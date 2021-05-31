import {
    Color,
    FileLoader,
    IcosahedronBufferGeometry,
    Mesh,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    TorusKnotBufferGeometry,
    Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class DirtyStrokesSketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;
    private noiseTexture: Texture;

    private vertexShader: string;
    private fragmentShader: string;
    private shaderMaterial: ShaderMaterial;
    private objectMesh: Mesh;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/dirty-strokes/_fragment.glsl'),
            new FileLoader().loadAsync('assets/dirty-strokes/_vertex.glsl'),
            new TextureLoader().loadAsync('assets/dirty-strokes/noise.jpeg')
        ];

        Promise.all(assets).then((res) => {
            this.fragmentShader = res[0];
            this.vertexShader = res[1];
            this.noiseTexture = res[2];

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
        this.camera.position.z = 3;
        this.scene = new Scene();
        this.scene.background = new Color(240, 240, 240);
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.initObject();

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();

        document.onpointermove = (e) => {
            this.shaderMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.shaderMaterial.uniforms.u_mouse.value.y = e.pageY;
        };

        if (this.oninit) this.oninit();
    }

    private initObject(): void {
        this.shaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_noiseTexture: { type: 't', value: this.noiseTexture } as any
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });

        /*const geometry: IcosahedronBufferGeometry = new IcosahedronBufferGeometry(
            1,
            30
        );*/
        const geometry: TorusKnotBufferGeometry = new TorusKnotBufferGeometry(
            0.8,
            0.3,
            120,
            60
        );
        this.objectMesh = new Mesh(geometry, this.shaderMaterial);
        this.scene.add(this.objectMesh);
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.shaderMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.shaderMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.controls.update();

        this.objectMesh.rotation.y += 0.01;

        this.render();

        requestAnimationFrame(() => this.animate());
    }

    public render(): void {
        this.shaderMaterial.uniforms.u_time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }
}
