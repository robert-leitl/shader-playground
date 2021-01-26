import {
    BufferAttribute,
    BufferGeometry,
    FileLoader,
    InstancedMesh,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Points,
    Raycaster,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class InstancedMesh1Sketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;
    private raycaster: Raycaster;
    private width: number;
    private height: number;

    private raycasterPlane: Mesh;

    private planeMesh: Mesh;
    private planeMaterial: ShaderMaterial;
    private planeVertexShader: string;
    private planeFragmentShader: string;
    private t1: Texture;

    private squaresMesh: InstancedMesh;
    private squaresMaterial: ShaderMaterial;
    private squaresVertexShader: string;
    private squaresFragmentShader: string;

    private pointsMesh: Points;
    private pointsMaterial: ShaderMaterial;
    private pointsVertexShader: string;
    private pointsFragmentShader: string;

    private GRID_SIZE = 30;
    private SQUARE_SIZE = 2.5 / this.GRID_SIZE;

    private mouse: Vector2 = new Vector2();
    private mouseFollower: Vector2 = new Vector2();

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync(
                'assets/instanced-mesh-1/_planeFragment.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/instanced-mesh-1/_planeVertex.glsl'
            ),
            new TextureLoader().loadAsync('assets/shared-textures/img1.jpg'),
            new FileLoader().loadAsync(
                'assets/instanced-mesh-1/_squaresFragment.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/instanced-mesh-1/_squaresVertex.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/instanced-mesh-1/_pointsFragment.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/instanced-mesh-1/_pointsVertex.glsl'
            )
        ];

        Promise.all(assets).then((res) => {
            this.planeFragmentShader = res[0];
            this.planeVertexShader = res[1];
            this.t1 = res[2];
            this.squaresFragmentShader = res[3];
            this.squaresVertexShader = res[4];
            this.pointsFragmentShader = res[5];
            this.pointsVertexShader = res[6];

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
        this.raycaster = new Raycaster();
        this.container.appendChild(this.renderer.domElement);

        this.raycasterPlane = new Mesh(
            new PlaneBufferGeometry(5, 5),
            new MeshBasicMaterial()
        );

        this.initPlane();
        this.initSquares();
        this.initPoints();
        this.initLines();
        this.updateSize();

        /*this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();*/

        document.onpointermove = (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        if (this.oninit) this.oninit();
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.width = this.renderer.domElement.width;
        this.height = this.renderer.domElement.height;
        this.planeMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.planeMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.planeMaterial.uniforms.u_t1Aspect.value = this.getCoverAspectRatio(
            this.t1,
            this.container
        );

        this.focusObject(this.planeMesh);

        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        //this.controls.update();

        this.mouseFollower.x += (this.mouse.x - this.mouseFollower.x) / 15;
        this.mouseFollower.y += (this.mouse.y - this.mouseFollower.y) / 15;
        this.raycaster.setFromCamera(this.mouseFollower, this.camera);
        const intersects = this.raycaster.intersectObjects([
            this.raycasterPlane
        ]);
        if (intersects.length > 0) {
            this.squaresMaterial.uniforms.u_mousePoint.value =
                intersects[0].point;
        }

        this.scene.rotation.y = this.mouseFollower.x / 10;
        this.scene.rotation.x = -this.mouseFollower.y / 10;

        this.render();

        requestAnimationFrame(() => this.animate());
    }

    public render(): void {
        this.planeMaterial.uniforms.u_time.value += 0.05;
        this.squaresMaterial.uniforms.u_time.value += 0.05;
        this.pointsMaterial.uniforms.u_time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    private initPlane(): void {
        const geometry = new PlaneBufferGeometry(1, 1);
        this.planeMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_t1: { type: 't', value: this.t1 } as any,
                u_t1Aspect: { type: 'v2', value: new Vector2() } as any
            },
            vertexShader: this.planeVertexShader,
            fragmentShader: this.planeFragmentShader
        });

        this.planeMesh = new Mesh(geometry, this.planeMaterial);
        this.scene.add(this.planeMesh);
    }

    private initSquares(): void {
        const geometry = new PlaneBufferGeometry(
            this.SQUARE_SIZE,
            this.SQUARE_SIZE
        );
        this.squaresMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mousePoint: { type: 'v3', value: new Vector3() } as any
            },
            vertexShader: this.squaresVertexShader,
            fragmentShader: this.squaresFragmentShader,
            transparent: true
        });

        this.squaresMesh = new InstancedMesh(
            geometry,
            this.squaresMaterial,
            this.GRID_SIZE ** 2
        );
        this.scene.add(this.squaresMesh);

        this.squaresMesh.position.z = 0.01;

        const pos: Object3D = new Object3D();
        let count = 0;
        for (let x = -this.GRID_SIZE / 2; x < this.GRID_SIZE / 2; x++) {
            for (let y = -this.GRID_SIZE / 2; y < this.GRID_SIZE / 2; y++) {
                pos.position.set(x * this.SQUARE_SIZE, y * this.SQUARE_SIZE, 0);
                pos.updateMatrix();
                this.squaresMesh.setMatrixAt(count++, pos.matrix);
            }
        }
    }

    private initPoints(): void {
        const geometry = new BufferGeometry();
        this.pointsMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any
            },
            vertexShader: this.pointsVertexShader,
            fragmentShader: this.pointsFragmentShader,
            transparent: true
        });

        const vertices = new Float32Array(this.GRID_SIZE ** 2 * 3);
        let count = 0;
        for (let x = -this.GRID_SIZE / 2; x < this.GRID_SIZE / 2; x++) {
            for (let y = -this.GRID_SIZE / 2; y < this.GRID_SIZE / 2; y++) {
                vertices[count] =
                    x * this.SQUARE_SIZE - this.SQUARE_SIZE / 2 + 0.0015;
                vertices[count + 1] =
                    y * this.SQUARE_SIZE - this.SQUARE_SIZE / 2 - 0.0015;
                vertices[count + 2] = 0;
                count += 3;
            }
        }

        geometry.setAttribute('position', new BufferAttribute(vertices, 3));

        this.pointsMesh = new Points(geometry, this.pointsMaterial);
        this.scene.add(this.pointsMesh);

        this.pointsMesh.position.z = 0.009;
    }

    private initLines(): void {
        const material = new LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15
        });

        const points = [];

        for (let i = -this.GRID_SIZE / 2; i < this.GRID_SIZE / 2; i++) {
            points.push(
                new Vector3(-5, i * this.SQUARE_SIZE - this.SQUARE_SIZE / 2, 0)
            );
            points.push(
                new Vector3(5, i * this.SQUARE_SIZE - this.SQUARE_SIZE / 2, 0)
            );
            points.push(
                new Vector3(i * this.SQUARE_SIZE - this.SQUARE_SIZE / 2, -5, 0)
            );
            points.push(
                new Vector3(i * this.SQUARE_SIZE - this.SQUARE_SIZE / 2, 5, 0)
            );
        }

        const geometry = new BufferGeometry().setFromPoints(points);
        const line = new LineSegments(geometry, material);

        line.position.z = 0.008;

        this.scene.add(line);
    }

    private focusObject(obj: Object3D): void {
        const dist = this.camera.position.z;
        const height = 0.8;
        this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

        if (this.width / this.height > 1) {
            obj.scale.x = this.camera.aspect;
        } else {
            obj.scale.y = 1 / this.camera.aspect;
        }

        this.camera.updateProjectionMatrix();
    }

    private getCoverAspectRatio(t: Texture, container: HTMLElement): Vector2 {
        const imgAspect: number = t.image.width / t.image.height;
        const containerAspect: number =
            container.offsetWidth / container.offsetHeight;

        if (imgAspect > containerAspect) {
            return new Vector2(containerAspect / imgAspect, 1);
        } else {
            return new Vector2(1, imgAspect / containerAspect);
        }
    }
}
