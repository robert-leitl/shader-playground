import {
    AdditiveBlending,
    BufferAttribute,
    FileLoader,
    InstancedBufferAttribute,
    InstancedMesh,
    Mesh,
    Object3D,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Points,
    Scene,
    Shader,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

export class Particles3Sketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;

    private instanceVertexShader: string;
    private instanceFragmentShader: string;
    private instanceMaterial: ShaderMaterial;
    private instanceMesh: InstancedMesh;
    private INSTANCE_ROWS = 60;
    private INSTANCE_COLUMNS = 80;
    private CELL_SIZE = 1 / Math.max(this.INSTANCE_ROWS, this.INSTANCE_COLUMNS);
    private instanceDummy: Object3D = new Object3D();
    private instanceValue: Float32Array = new Float32Array(
        this.INSTANCE_ROWS * this.INSTANCE_COLUMNS
    );
    private imageTexture: Texture;
    private imageCanvas: HTMLCanvasElement;
    private charsTexture: Texture;

    private prevMousePos: Vector2;
    private mousePos: Vector2;

    private noiseStrength: number = 1;
    private targetNoiseStrength: number = 1;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/particles-3/_fragment.glsl'),
            new FileLoader().loadAsync('assets/particles-3/_vertex.glsl'),
            new TextureLoader().loadAsync('assets/particles-3/eye3.jpg'),
            new TextureLoader().loadAsync('assets/particles-3/chars.png')
        ];

        Promise.all(assets).then((res) => {
            this.instanceFragmentShader = res[0];
            this.instanceVertexShader = res[1];
            this.imageTexture = res[2];
            this.charsTexture = res[3];

            // draw the image to canvas
            this.imageCanvas = document.createElement('canvas');
            const ctx = this.imageCanvas.getContext('2d');
            ctx.drawImage(
                this.imageTexture.image,
                0,
                0,
                this.INSTANCE_COLUMNS,
                this.INSTANCE_ROWS
            );

            /*this.imageCanvas.style.position = 'absolute';
            this.imageCanvas.style.top = '0';
            document.body.appendChild(this.imageCanvas);*/

            this.init();
        });
    }

    private init(): void {
        //this.initDatGui();

        this.camera = new PerspectiveCamera(
            45,
            this.container.offsetWidth / this.container.offsetHeight,
            0.1,
            100
        );
        this.camera.position.z = 0.9;
        this.scene = new Scene();
        this.renderer = new WebGLRenderer({
            antialias: false
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.initInstances();

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();

        this.renderer.domElement.onpointermove = (e) => {
            if (!this.mousePos) this.mousePos = new Vector2();

            this.mousePos.x = e.clientX / this.renderer.domElement.offsetWidth;
            this.mousePos.y =
                1 - e.clientY / this.renderer.domElement.offsetHeight;

            if (!this.prevMousePos) {
                this.prevMousePos = this.mousePos.clone();
            }
        };

        if (this.oninit) this.oninit();
    }

    private initDatGui(): void {
        const gui = new dat.GUI();
        gui.add(this, 'noiseStrength', 0.1, 1, 0.01);

        document.body.appendChild(gui.domElement);
    }

    private initInstances(): void {
        const geometry = new PlaneBufferGeometry(
            this.CELL_SIZE * 0.95,
            this.CELL_SIZE * 0.95
        );
        this.instanceMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_charsTexture: { type: 't', value: this.charsTexture } as any,
                u_noiseStrength: { type: 'f', value: this.noiseStrength } as any
            },
            vertexShader: this.instanceVertexShader,
            fragmentShader: this.instanceFragmentShader,
            transparent: true,
            blending: AdditiveBlending
        });

        const totalInstanceCount = this.INSTANCE_COLUMNS * this.INSTANCE_ROWS;

        this.instanceMesh = new InstancedMesh(
            geometry,
            this.instanceMaterial,
            totalInstanceCount
        );

        const instanceIndex: Float32Array = new Float32Array(
            totalInstanceCount * 2
        );
        let count = 0;
        for (let x = 0; x < this.INSTANCE_COLUMNS; x++) {
            for (let y = 0; y < this.INSTANCE_ROWS; y++) {
                this.instanceDummy.position.set(
                    x * this.CELL_SIZE,
                    y * this.CELL_SIZE,
                    0
                );
                instanceIndex.set(
                    [x / this.INSTANCE_COLUMNS, y / this.INSTANCE_ROWS],
                    count * 2
                );

                this.instanceDummy.updateMatrix();
                this.instanceMesh.setMatrixAt(count, this.instanceDummy.matrix);
                count++;
            }
        }
        this.instanceMesh.instanceMatrix.needsUpdate = true;
        (this.instanceMesh.geometry as PlaneBufferGeometry).setAttribute(
            'a_index',
            new InstancedBufferAttribute(instanceIndex, 2)
        );

        // add the image values as attribute
        const ctx = this.imageCanvas.getContext('2d');
        const imageData: ImageData = ctx.getImageData(
            0,
            0,
            this.INSTANCE_COLUMNS,
            this.INSTANCE_ROWS
        );
        const imageDataArray: Float32Array = new Float32Array(
            this.INSTANCE_ROWS * this.INSTANCE_COLUMNS * 4
        );
        let index = 0;
        for (let j = 0; j < this.INSTANCE_COLUMNS; j++) {
            for (let k = 0; k < this.INSTANCE_ROWS; k++) {
                let srcIndex =
                    j + (this.INSTANCE_ROWS - k - 1) * this.INSTANCE_COLUMNS;
                imageDataArray.set(
                    [
                        imageData.data[srcIndex * 4] / 255,
                        imageData.data[srcIndex * 4 + 1] / 255,
                        imageData.data[srcIndex * 4 + 2] / 255,
                        imageData.data[srcIndex * 4 + 3] / 255
                    ],
                    index * 4
                );

                index++;
            }
        }

        (this.instanceMesh.geometry as PlaneBufferGeometry).setAttribute(
            'a_imageColor',
            new InstancedBufferAttribute(imageDataArray, 4)
        );

        this.instanceMesh.position.set(
            -(this.INSTANCE_COLUMNS / 2) * this.CELL_SIZE,
            -(this.INSTANCE_ROWS / 2) * this.CELL_SIZE,
            0
        );

        this.scene.add(this.instanceMesh);
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.instanceMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.instanceMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        // animate the noise strength
        this.noiseStrength +=
            (this.targetNoiseStrength - this.noiseStrength) / 12;
        this.instanceMaterial.uniforms.u_noiseStrength.value = this.noiseStrength;

        // animate the mesh rotation
        if (this.mousePos) {
            this.scene.rotation.y +=
                (this.mousePos.x / 15 - this.scene.rotation.y) / 10;
            this.scene.rotation.x +=
                (-this.mousePos.y / 15 - this.scene.rotation.x) / 10;
        }

        this.animateInstances();

        this.controls.update();
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    private animateInstances(): void {
        this.animatePointerTrail();

        (this.instanceMesh.geometry as PlaneBufferGeometry).setAttribute(
            'a_instanceValue',
            new InstancedBufferAttribute(this.instanceValue, 1)
        );
    }

    private animatePointerTrail(): void {
        if (this.mousePos) {
            const radius = 10;
            let dmX = this.mousePos.x - this.prevMousePos.x;
            let dmY = this.mousePos.y - this.prevMousePos.y;
            dmX = Math.max(-1, Math.min(1, dmX));
            dmY = Math.max(-1, Math.min(1, dmY));

            let mX = this.mousePos.x;
            let mY = this.mousePos.y;
            mX = Math.floor(mX * this.INSTANCE_COLUMNS);
            mY = Math.floor(mY * this.INSTANCE_ROWS);

            const aspect =
                this.renderer.domElement.offsetWidth /
                this.renderer.domElement.offsetHeight;

            const aspectX = aspect > 1 ? 1 : aspect;
            const aspectY = aspect > 1 ? aspect : 1;

            for (let i = 0; i < this.instanceValue.length; ++i) {
                let v = this.instanceValue[i];

                v *= 0.98;

                const px = Math.floor(i / this.INSTANCE_ROWS);
                const py = i - px * this.INSTANCE_ROWS;
                const dx = (mX - px) * aspectX;
                const dy = (mY - py) / aspectY;
                const d = Math.sqrt(dx * dx + dy * dy);
                const f = 1 - d / radius;

                if (d < radius && Math.abs(dmX) > 0 && Math.abs(dmY) > 0) {
                    v += f * 0.1;
                }

                this.instanceValue[i] = Math.min(v, 0.99);
            }

            this.prevMousePos.copy(this.mousePos);
        }
    }

    public render(): void {
        this.instanceMaterial.uniforms.u_time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }

    public set focus(value: boolean) {
        this.targetNoiseStrength = value ? 0.18 : 1;
    }
}
