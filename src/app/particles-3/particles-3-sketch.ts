import {
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
    private INSTANCE_ROWS = 50;
    private INSTANCE_COLUMNS = 50;
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

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/particles-3/_fragment.glsl'),
            new FileLoader().loadAsync('assets/particles-3/_vertex.glsl'),
            new TextureLoader().loadAsync('assets/particles-3/eye1.jpg'),
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

            this.init();
        });
    }

    private init(): void {
        this.camera = new PerspectiveCamera(
            45,
            this.container.offsetWidth / this.container.offsetHeight,
            0.1,
            100
        );
        this.camera.position.z = 2;
        this.scene = new Scene();
        this.renderer = new WebGLRenderer();
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

    private initInstances(): void {
        const geometry = new PlaneBufferGeometry(
            this.CELL_SIZE,
            this.CELL_SIZE
        );
        this.instanceMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_charsTexture: { type: 't', value: this.charsTexture } as any
            },
            vertexShader: this.instanceVertexShader,
            fragmentShader: this.instanceFragmentShader,
            transparent: true
        });

        const totalInstanceCount = this.INSTANCE_COLUMNS * this.INSTANCE_ROWS;

        this.instanceMesh = new InstancedMesh(
            geometry,
            this.instanceMaterial,
            totalInstanceCount
        );

        let count = 0;
        for (let x = 0; x < this.INSTANCE_COLUMNS; x++) {
            for (let y = 0; y < this.INSTANCE_ROWS; y++) {
                this.instanceDummy.position.set(
                    x * this.CELL_SIZE,
                    y * this.CELL_SIZE,
                    0
                );
                this.instanceDummy.updateMatrix();
                this.instanceMesh.setMatrixAt(count, this.instanceDummy.matrix);
                count++;
            }
        }
        this.instanceMesh.instanceMatrix.needsUpdate = true;

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
        for (let j = 0; j < this.INSTANCE_COLUMNS; j++) {
            for (let k = 0; k < this.INSTANCE_ROWS; k++) {
                let index = j * this.INSTANCE_ROWS + k;
                let targetIndex =
                    this.INSTANCE_COLUMNS - j - 1 + k * this.INSTANCE_COLUMNS;
                imageDataArray.set(
                    [
                        imageData.data[index * 4],
                        imageData.data[index * 4 + 1],
                        imageData.data[index * 4 + 2],
                        imageData.data[index * 4 + 3]
                    ],
                    targetIndex * 4
                );
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

        this.animateInstances();

        this.controls.update();
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    private animateInstances(): void {
        /*let count = 0;
        for (let x = 0; x < this.INSTANCE_COLUMNS; x++) {
            for (let y = 0; y < this.INSTANCE_ROWS; y++) {
                // update the brightness value of each instance
                this.instanceValue.set([0], count);
                count++;
            }
        }*/

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

                v *= 0.95;

                const py = Math.floor(i / this.INSTANCE_ROWS);
                const px = i - py * this.INSTANCE_COLUMNS;
                const dx = (mX - py) * aspectX;
                const dy = (mY - px) / aspectY;
                const d = Math.sqrt(dx * dx + dy * dy);
                const f = 1 - d / radius;

                if (d < radius && Math.abs(dmX) > 0 && Math.abs(dmY) > 0) {
                    v += f * 0.2;
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
}
