import {
    AdditiveBlending,
    Box3,
    BufferAttribute,
    FileLoader,
    InstancedBufferAttribute,
    InstancedMesh,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    Plane,
    PlaneBufferGeometry,
    Points,
    Raycaster,
    Scene,
    Shader,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    Vector3,
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
    //private controls: OrbitControls;
    private raycaster: Raycaster;

    private instanceVertexShader: string;
    private instanceFragmentShader: string;
    private instanceMaterial: ShaderMaterial;
    private instanceMesh: InstancedMesh;
    private instanceRows = 60;
    private instanceColumns = 80;
    private cellSize = 1 / Math.max(this.instanceRows, this.instanceColumns);
    private instanceDummy: Object3D = new Object3D();
    private instanceValue: Float32Array;
    private imageTexture: Texture;
    private imageCanvas: HTMLCanvasElement;
    private charsTexture: Texture;

    private raycasterPlaneMesh: Mesh;

    private pointerPosition: Vector2 = new Vector2();
    private planePosition: Vector3 = new Vector3();
    private prevPlanePosition: Vector3;

    private noiseStrength: number = 1;
    private targetNoiseStrength: number = 1;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const aspect = this.container.offsetWidth / this.container.offsetHeight;
        const maxCells = 140;
        if (aspect > 1) {
            this.instanceRows = Math.floor(maxCells / aspect);
            this.instanceColumns = maxCells;
        } else {
            this.instanceRows = maxCells;
            this.instanceColumns = Math.floor(maxCells * aspect);
        }
        this.cellSize = 1 / Math.max(this.instanceRows, this.instanceColumns);
        this.instanceValue = new Float32Array(
            this.instanceRows * this.instanceColumns
        );

        let imagePath = 'assets/particles-3/hand_portrait.jpg';
        if (aspect > 1) {
            imagePath = 'assets/particles-3/hand_landscape.jpg';
        }

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/particles-3/_fragment.glsl'),
            new FileLoader().loadAsync('assets/particles-3/_vertex.glsl'),
            new TextureLoader().loadAsync(imagePath),
            new TextureLoader().loadAsync('assets/particles-3/chars.png')
        ];

        Promise.all(assets).then((res) => {
            this.instanceFragmentShader = res[0];
            this.instanceVertexShader = res[1];
            this.imageTexture = res[2];
            this.charsTexture = res[3];

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
        this.camera.position.z = 2;
        this.scene = new Scene();
        this.renderer = new WebGLRenderer({
            antialias: false
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.raycaster = new Raycaster();

        this.initImageCanvas();
        this.initPointerPlane();
        this.initInstances();

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        /*this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();*/

        this.renderer.domElement.onpointermove = (e) => {
            this.pointerPosition.x =
                (e.clientX / this.renderer.domElement.offsetWidth) * 2 - 1;
            this.pointerPosition.y =
                -(e.clientY / this.renderer.domElement.offsetHeight) * 2 + 1;
        };

        if (this.oninit) this.oninit();
    }

    private initDatGui(): void {
        const gui = new dat.GUI();
        gui.add(this, 'noiseStrength', 0.1, 1, 0.01);

        document.body.appendChild(gui.domElement);
    }

    private initImageCanvas(): void {
        this.imageCanvas = document.createElement('canvas');
        const ctx = this.imageCanvas.getContext('2d');

        const container: Vector2 = new Vector2(
            this.instanceColumns,
            this.instanceRows
        );
        const item: Vector2 = new Vector2(
            this.imageTexture.image.width,
            this.imageTexture.image.height
        );
        const aspect: Vector2 = this.getCoverAspectRatio(item, container);
        const sw = aspect.x * item.x;
        const sh = aspect.y * item.y;
        const sx = (item.x - sw) / 2;
        const sy = (item.y - sh) / 2;

        ctx.drawImage(
            this.imageTexture.image,
            sx,
            sy,
            sw,
            sh,
            0,
            0,
            this.instanceColumns,
            this.instanceRows
        );

        /*this.imageCanvas.style.position = 'absolute';
        this.imageCanvas.style.top = '0';
        document.body.appendChild(this.imageCanvas);*/
    }

    private initPointerPlane(): void {
        const geometry = new PlaneBufferGeometry(
            this.cellSize * this.instanceColumns,
            this.cellSize * this.instanceRows
        );
        this.raycasterPlaneMesh = new Mesh(
            geometry,
            new MeshBasicMaterial({ color: 0x333333 })
        );
        this.raycasterPlaneMesh.visible = false;
        this.raycasterPlaneMesh.position.z = 0.1;
        this.scene.add(this.raycasterPlaneMesh);
    }

    private initInstances(): void {
        const geometry = new PlaneBufferGeometry(
            this.cellSize * 0.95,
            this.cellSize * 0.95
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

        const totalInstanceCount = this.instanceColumns * this.instanceRows;

        this.instanceMesh = new InstancedMesh(
            geometry,
            this.instanceMaterial,
            totalInstanceCount
        );

        const instanceIndex: Float32Array = new Float32Array(
            totalInstanceCount * 2
        );
        let count = 0;
        for (let x = 0; x < this.instanceColumns; x++) {
            for (let y = 0; y < this.instanceRows; y++) {
                this.instanceDummy.position.set(
                    x * this.cellSize,
                    y * this.cellSize,
                    0
                );
                instanceIndex.set(
                    [x / this.instanceColumns, y / this.instanceRows],
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
            this.instanceColumns,
            this.instanceRows
        );
        const imageDataArray: Float32Array = new Float32Array(
            this.instanceRows * this.instanceColumns * 4
        );
        let index = 0;
        for (let j = 0; j < this.instanceColumns; j++) {
            for (let k = 0; k < this.instanceRows; k++) {
                let srcIndex =
                    j + (this.instanceRows - k - 1) * this.instanceColumns;
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
            -(this.instanceColumns / 2) * this.cellSize,
            -(this.instanceRows / 2) * this.cellSize,
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
        this.focusObjectCover(this.raycasterPlaneMesh);
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.updatePointer();

        // animate the noise strength
        this.noiseStrength +=
            (this.targetNoiseStrength - this.noiseStrength) / 8;
        this.instanceMaterial.uniforms.u_noiseStrength.value = this.noiseStrength;

        this.animateInstances();

        //this.controls.update();
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    private updatePointer(): void {
        this.raycaster.setFromCamera(this.pointerPosition, this.camera);
        const intersects = this.raycaster.intersectObjects([this.instanceMesh]);
        if (intersects.length > 0) {
            this.planePosition = intersects[0].point;
            this.planePosition.x = this.planePosition.x + 0.5;
            this.planePosition.y = this.planePosition.y + 0.5;

            if (!this.prevPlanePosition) {
                this.prevPlanePosition = this.planePosition.clone();
            }
        }
    }

    private animateInstances(): void {
        this.animatePointerTrail();

        (this.instanceMesh.geometry as PlaneBufferGeometry).setAttribute(
            'a_instanceValue',
            new InstancedBufferAttribute(this.instanceValue, 1)
        );
    }

    private animatePointerTrail(): void {
        if (this.planePosition && this.prevPlanePosition) {
            const radius = 10;
            let dmX = this.planePosition.x - this.prevPlanePosition.x;
            let dmY = this.planePosition.y - this.prevPlanePosition.y;
            dmX = Math.max(-1, Math.min(1, dmX));
            dmY = Math.max(-1, Math.min(1, dmY));

            let mX = this.planePosition.x;
            let mY = this.planePosition.y;
            mX = Math.floor(mX * this.instanceColumns);
            mY = Math.floor(mY * this.instanceRows);

            const aspect =
                this.renderer.domElement.offsetWidth /
                this.renderer.domElement.offsetHeight;

            const aspectX = aspect > 1 ? 1 : aspect;
            const aspectY = aspect > 1 ? aspect : 1;

            for (let i = 0; i < this.instanceValue.length; ++i) {
                let v = this.instanceValue[i];

                v *= 0.98;

                const px = Math.floor(i / this.instanceRows);
                const py = i - px * this.instanceRows;
                const dx = mX - px; // * aspectX;
                const dy = mY - py; // / aspectY;
                const d = Math.sqrt(dx * dx + dy * dy);
                const f = 1 - d / radius;

                if (d < radius && Math.abs(dmX) > 0 && Math.abs(dmY) > 0) {
                    v += f * 0.1;
                }

                this.instanceValue[i] = Math.min(v, 0.99);
            }

            this.prevPlanePosition.copy(this.planePosition);
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

    private getCoverAspectRatio(item: Vector2, container: Vector2): Vector2 {
        const itemAspect: number = item.x / item.y;
        const containerAspect: number = container.x / container.y;

        if (itemAspect > containerAspect) {
            return new Vector2(containerAspect / itemAspect, 1);
        } else {
            return new Vector2(1, itemAspect / containerAspect);
        }
    }

    private focusObjectCover(obj: Object3D): void {
        const bbox: Box3 = new Box3().setFromObject(obj);
        const objSize: Vector3 = bbox.getSize(new Vector3());
        const objAspect = objSize.x / objSize.y;

        // the horizontal field of view
        const vFOV = this.camera.fov / (180 / Math.PI);
        const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * this.camera.aspect);

        // take the z position of the obj into account
        let cameraZ = this.camera.position.z - obj.position.z;

        // get the viewport size at z = obj.z
        const viewportSize: Vector3 = new Vector3(
            2 * Math.tan(hFOV / 2) * cameraZ,
            2 * Math.tan(vFOV / 2) * cameraZ,
            0
        );
        // fit the object horizontally
        cameraZ = objSize.x / 2 / Math.tan(hFOV / 2) + obj.position.z;
        this.camera.position.z = cameraZ;

        // update the viewport size
        viewportSize.set(
            2 * Math.tan(hFOV / 2) * cameraZ,
            2 * Math.tan(vFOV / 2) * cameraZ,
            0
        );

        // fit the object vertically
        if (viewportSize.y > objSize.y) {
            this.camera.fov =
                2 * (180 / Math.PI) * Math.atan(objSize.y / (2 * cameraZ));
        }

        this.camera.updateProjectionMatrix();
    }
}
