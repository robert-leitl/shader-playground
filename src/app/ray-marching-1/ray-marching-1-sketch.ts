import {
    FileLoader,
    Mesh,
    Object3D,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class RayMarching1Sketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private width: number;
    private height: number;

    private mesh: Mesh;
    private material: ShaderMaterial;
    private vertexShader: string;
    private fragmentShader: string;
    private mouse: Vector2 = new Vector2();

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/ray-marching-1/_fragment.glsl'),
            new FileLoader().loadAsync('assets/ray-marching-1/_vertex.glsl')
        ];

        Promise.all(assets).then((res) => {
            this.fragmentShader = res[0];
            this.vertexShader = res[1];

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
        this.renderer = new WebGLRenderer({ antialias: false });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.initPlane();
        this.updateSize();

        document.onpointermove = (e) => {
            this.mouse.x = e.pageX;
            this.mouse.y = e.pageY;
        };

        if (this.oninit) this.oninit();
    }

    private initPlane(): void {
        const geometry = new PlaneBufferGeometry(2, 2);
        this.material = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });

        this.mesh = new Mesh(geometry, this.material);
        this.scene.add(this.mesh);
    }

    public updateSize(): void {
        this.width = Math.min(this.container.offsetWidth, 900);
        this.height = Math.min(this.container.offsetHeight, 900);

        this.renderer.setSize(this.width, this.height);
        this.material.uniforms.u_resolution.value.x = this.width;
        this.material.uniforms.u_resolution.value.y = this.height;

        this.camera.aspect = this.width / this.height;

        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.material.uniforms.u_mouse.value.x +=
            (this.mouse.x - this.material.uniforms.u_mouse.value.x) / 8;
        this.material.uniforms.u_mouse.value.y +=
            (this.mouse.y - this.material.uniforms.u_mouse.value.y) / 8;

        this.render();

        requestAnimationFrame(() => this.animate());
    }

    public render(): void {
        this.material.uniforms.u_time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }
}
