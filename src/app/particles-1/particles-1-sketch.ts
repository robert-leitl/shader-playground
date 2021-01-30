import {
    BufferAttribute,
    BufferGeometry,
    FileLoader,
    IcosahedronBufferGeometry,
    IUniform,
    Mesh,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Points,
    Scene,
    ShaderMaterial,
    SphereBufferGeometry,
    Texture,
    TextureLoader,
    Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Particles1Sketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;
    private sphereMaterial: ShaderMaterial;
    private particlesMaterial: ShaderMaterial;
    private particlePoints: Points;

    private sphereVertexShader: string;
    private sphereFragmentShader: string;
    private particlesVertexShader: string;
    private particlesFragmentShader: string;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/particles-1/_fragment.glsl'),
            new FileLoader().loadAsync('assets/particles-1/_vertex.glsl'),
            new FileLoader().loadAsync(
                'assets/particles-1/_particleFragment.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/particles-1/_particleVertex.glsl'
            )
        ];

        Promise.all(assets).then((res) => {
            this.sphereFragmentShader = res[0];
            this.sphereVertexShader = res[1];
            this.particlesFragmentShader = res[2];
            this.particlesVertexShader = res[3];

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
        this.camera.position.z = 5;
        this.scene = new Scene();
        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.initSphere();
        this.initParticles();

        this.updateSize();

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();

        if (this.oninit) this.oninit();
    }

    private initSphere(): void {
        const geometry = new IcosahedronBufferGeometry(1, 64);

        this.sphereMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as IUniform,
                u_resolution: { type: 'v2', value: new Vector2() } as IUniform
            },
            vertexShader: this.sphereVertexShader,
            fragmentShader: this.sphereFragmentShader
        });

        const mesh = new Mesh(geometry, this.sphereMaterial);
        this.scene.add(mesh);
    }

    private initParticles(): void {
        const radius = 1.3;
        const N = 12000;
        const vertices = new Float32Array(N * 3);
        const geometry = new BufferGeometry();
        const inc = Math.PI * (3 - Math.sqrt(5));
        const off = 2 / N;

        for (let i = 0; i < N; ++i) {
            let y = i * off - 1 + off / 2;
            let r = Math.sqrt(1 - y * y);
            let phi = i * inc;
            vertices[i * 3] = radius * Math.cos(phi) * r;
            vertices[i * 3 + 1] = radius * y;
            vertices[i * 3 + 2] = radius * Math.sin(phi) * r;
        }

        geometry.setAttribute('position', new BufferAttribute(vertices, 3));

        this.particlesMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as IUniform,
                u_resolution: { type: 'v2', value: new Vector2() } as IUniform
            },
            vertexShader: this.particlesVertexShader,
            fragmentShader: this.particlesFragmentShader,
            transparent: true
        });

        this.particlePoints = new Points(geometry, this.particlesMaterial);
        this.scene.add(this.particlePoints);
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.sphereMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.sphereMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.controls.update();
        this.particlePoints.rotation.y += 0.003;
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    public render(): void {
        this.sphereMaterial.uniforms.u_time.value += 0.05;
        this.particlesMaterial.uniforms.u_time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }
}
