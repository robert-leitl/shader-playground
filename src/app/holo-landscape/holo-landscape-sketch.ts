import {
    AdditiveBlending,
    AlwaysDepth,
    Color,
    DoubleSide,
    FileLoader,
    GreaterDepth,
    LinearFilter,
    Mesh,
    MultiplyBlending,
    NoBlending,
    PerspectiveCamera,
    PlaneBufferGeometry,
    RGBAFormat,
    RGBFormat,
    Scene,
    ShaderMaterial,
    sRGBEncoding,
    Texture,
    TextureLoader,
    Vector2,
    WebGLMultisampleRenderTarget,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export class HoloLandscapeSketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;
    private composer?: EffectComposer;
    private renderTarget: WebGLMultisampleRenderTarget;

    private vertexShader: string;
    private fragmentShader: string;
    private t1: Texture;
    private shaderMaterial: ShaderMaterial;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/holo-landscape/_fragment.glsl'),
            new FileLoader().loadAsync('assets/holo-landscape/_vertex.glsl'),
            new TextureLoader().loadAsync('assets/shared-textures/logo.jpg')
        ];

        Promise.all(assets).then((res) => {
            this.fragmentShader = res[0];
            this.vertexShader = res[1];
            this.t1 = res[2];

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
        this.camera.position.z = 6;
        this.camera.position.y = 3;
        this.scene = new Scene();
        this.initObject();

        this.renderer = new WebGLRenderer();
        this.scene.background = new Color(1, 1, 1);
        this.renderer.setPixelRatio(0.5);
        this.renderer.autoClear = false;

        this.renderTarget = new WebGLMultisampleRenderTarget(400, 300, {
            magFilter: LinearFilter,
            minFilter: LinearFilter,
            format: RGBAFormat,
            encoding: sRGBEncoding
        });
        this.composer = new EffectComposer(this.renderer, this.renderTarget);
        this.composer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.composer.setPixelRatio(0.5);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        const bokehPass = new BokehPass(this.scene, this.camera, {
            focus: 10,
            aperture: 0.0015,
            maxblur: 0.012,

            width: 400,
            height: 300
        });
        this.composer.addPass(bokehPass);

        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

    initObject(): void {
        const geometry = new PlaneBufferGeometry(20, 20, 500, 500);
        this.shaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_resolution: { value: new Vector2() },
                u_mouse: { value: new Vector2() },
                u_t1: { value: this.t1 }
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            side: DoubleSide,
            transparent: false,
            depthWrite: true
        });

        const mesh = new Mesh(geometry, this.shaderMaterial);
        mesh.rotation.x = -0.5 * Math.PI;
        this.scene.add(mesh);
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.composer.setSize(
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
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    public render(): void {
        this.shaderMaterial.uniforms.u_time.value += 0.05;
        this.composer.render();
    }

    public destroy(): void {
        this.isDestroyed = true;
    }
}
