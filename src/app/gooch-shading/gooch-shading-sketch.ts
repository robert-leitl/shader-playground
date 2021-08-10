import {
    BackSide,
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

export class GoochShadingSketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;

    private vertexShader: string;
    private fragmentShader: string;
    private shaderMaterial: ShaderMaterial;

    private vertexShaderBackground: string;
    private fragmentShaderBackground: string;
    private shaderMaterialBackground: ShaderMaterial;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/gooch-shading/_fragment.glsl'),
            new FileLoader().loadAsync('assets/gooch-shading/_vertex.glsl'),
            new FileLoader().loadAsync(
                'assets/gooch-shading/_fragment-background.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/gooch-shading/_vertex-background.glsl'
            )
        ];

        Promise.all(assets).then((res) => {
            this.fragmentShader = res[0];
            this.vertexShader = res[1];
            this.fragmentShaderBackground = res[2];
            this.vertexShaderBackground = res[3];

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
        this.initObject();
        this.initBackground();
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.enableDamping = true;
        this.controls.minPolarAngle = Math.PI / 3;
        this.controls.maxPolarAngle = (2 / 3) * Math.PI;
        this.controls.enableZoom = false;
        this.controls.update();

        document.onpointermove = (e) => {
            this.shaderMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.shaderMaterial.uniforms.u_mouse.value.y = e.pageY;
        };

        if (this.oninit) this.oninit();
    }

    initObject(): void {
        const geometry = new TorusKnotBufferGeometry(0.4, 0.15, 256, 64);
        this.shaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_resolution: { value: new Vector2() },
                u_mouse: { value: new Vector2() }
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });

        const mesh = new Mesh(geometry, this.shaderMaterial);
        mesh.scale.multiplyScalar(0.8);
        this.scene.add(mesh);
    }

    initBackground(): void {
        const geometry = new IcosahedronBufferGeometry(3, 9);
        this.shaderMaterialBackground = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_resolution: { value: new Vector2() },
                u_mouse: { value: new Vector2() }
            },
            vertexShader: this.vertexShaderBackground,
            fragmentShader: this.fragmentShaderBackground,
            side: BackSide
        });

        const mesh = new Mesh(geometry, this.shaderMaterialBackground);
        this.scene.add(mesh);
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.shaderMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.shaderMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.shaderMaterialBackground.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.shaderMaterialBackground.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.controls.update();
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
