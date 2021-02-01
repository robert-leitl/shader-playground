import {
    AdditiveBlending,
    Blending,
    BufferAttribute,
    BufferGeometry,
    FileLoader,
    Mesh,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Points,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ParticleLine {
    points: Vector3[];
    currentPosition: number;
    speed: number;
    opacities: number[];
}

export class Particles2Sketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;

    private PARTICLES_PER_LINE = 300;

    private particleMaterial: ShaderMaterial;
    private particleVertexShader: string;
    private particleFragmentShader: string;
    private particleLines: ParticleLine[];
    private particleMesh: Points;
    private particlePositions: Float32Array;
    private particleOpacity: Float32Array;

    private planeMaterial: ShaderMaterial;
    private planeVertexShader: string;
    private planeFragmentShader: string;
    private t1: Texture;

    private mouse: Vector2 = new Vector2();

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync(
                'assets/particles-2/_particleFragment.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/particles-2/_particleVertex.glsl'
            ),
            new FileLoader().loadAsync('assets/particles-2/_fragment.glsl'),
            new FileLoader().loadAsync('assets/particles-2/_vertex.glsl'),
            new TextureLoader().loadAsync('assets/particles-2/logo.png')
        ];

        Promise.all(assets).then((res) => {
            this.particleFragmentShader = res[0];
            this.particleVertexShader = res[1];
            this.planeFragmentShader = res[2];
            this.planeVertexShader = res[3];
            this.t1 = res[4];

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
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.initPlane();
        this.initPoints();

        this.updateSize();

        /*this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();*/

        document.onpointermove = (e) => {
            this.mouse.x = e.pageX;
            this.mouse.y = e.pageY;
        };

        if (this.oninit) this.oninit();
    }

    private initPlane(): void {
        const geometry = new PlaneBufferGeometry(2, 2);
        this.planeMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_t1: { type: 't', value: this.t1 } as any
            },
            vertexShader: this.planeVertexShader,
            fragmentShader: this.planeFragmentShader
        });

        const mesh = new Mesh(geometry, this.planeMaterial);
        this.scene.add(mesh);
    }

    private initPoints(): void {
        const paths: SVGPathElement[] = Array.from(
            this.container.querySelectorAll('.logo-path')
        );
        const svgElm: SVGElement = this.container.querySelector(
            'svg'
        ) as SVGElement;
        const svgWidth: number = parseInt(svgElm.getAttribute('width'), 10);
        const svgHeight: number = parseInt(svgElm.getAttribute('height'), 10);

        const POINT_DENSITY = 0.4;
        const POINT_OFFSET = 0.005;
        this.particleLines = [];

        paths.forEach((path, index) => {
            const line: ParticleLine = {
                points: [],
                currentPosition: 0,
                speed: index > 1 ? 8 : 3,
                opacities: []
            };
            const len = path.getTotalLength();

            const numberOfPoints = Math.floor(len / POINT_DENSITY);
            for (let i = 0; i < numberOfPoints; i++) {
                const p: SVGPoint = path.getPointAtLength(
                    (i / numberOfPoints) * len
                );
                line.points.push(
                    new Vector3(
                        (1 - p.x / svgWidth) * 2 -
                            1 +
                            (Math.random() * POINT_OFFSET - POINT_OFFSET / 2),
                        (p.y / svgHeight) * 2 -
                            1 +
                            (Math.random() * POINT_OFFSET - POINT_OFFSET / 2),
                        0
                    )
                );
                line.opacities.push(Math.random());
            }

            this.particleLines.push(line);
        });

        ///////// create mesh

        const NUM_PARTICLES =
            this.particleLines.length * this.PARTICLES_PER_LINE;

        const geometry = new BufferGeometry();
        const vertices = new Float32Array(NUM_PARTICLES * 3);
        const opacity = new Float32Array(NUM_PARTICLES);

        let count = 0;
        this.particleLines.forEach((line) => {
            for (let i = 0; i < this.PARTICLES_PER_LINE; i++) {
                opacity.set([Math.random()], count);
                count++;
            }
        });

        this.particlePositions = vertices;
        this.particleOpacity = opacity;

        geometry.setAttribute('position', new BufferAttribute(vertices, 3));
        geometry.setAttribute('opacity', new BufferAttribute(opacity, 1));
        this.particleMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any
            },
            vertexShader: this.particleVertexShader,
            fragmentShader: this.particleFragmentShader,
            transparent: true,
            depthTest: true,
            depthWrite: true,
            blending: AdditiveBlending
        });
        this.particleMesh = new Points(geometry, this.particleMaterial);
        this.particleMesh.position.z = 0.001;
        this.scene.add(this.particleMesh);
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.planeMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.planeMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.animateLines();

        //this.controls.update();
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    private animateLines(): void {
        let count = 0;
        this.particleLines.forEach((line) => {
            line.currentPosition =
                (line.currentPosition + line.speed) % line.points.length;

            for (let i = 0; i < this.PARTICLES_PER_LINE; i++) {
                const index = (line.currentPosition + i) % line.points.length;

                const point: Vector3 = line.points[index];
                this.particlePositions.set(
                    [point.x, point.y, point.z],
                    count * 3
                );
                this.particleOpacity.set(
                    [line.opacities[index] * (i / this.PARTICLES_PER_LINE)],
                    count
                );
                count++;
            }
        });

        (this.particleMesh
            .geometry as BufferGeometry).attributes.opacity.needsUpdate = true;
        (this.particleMesh
            .geometry as BufferGeometry).attributes.position.needsUpdate = true;
    }

    public render(): void {
        this.planeMaterial.uniforms.u_time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }
}
