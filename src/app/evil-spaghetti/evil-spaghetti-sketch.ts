import {
    CatmullRomCurve3,
    DoubleSide,
    FileLoader,
    IcosahedronBufferGeometry,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Raycaster,
    Scene,
    ShaderMaterial,
    SphereBufferGeometry,
    Texture,
    TextureLoader,
    TubeBufferGeometry,
    Vector2,
    Vector3,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';

export class EvilSpaghettiSketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private bgScene: Scene;
    private renderer: WebGLRenderer;
    //private controls: OrbitControls;
    private raycaster: Raycaster = new Raycaster();

    private tubeContainer: Object3D;
    private tubeShaderMaterial: ShaderMaterial;
    private tubeVertexShader: string;
    private tubeFragmentShader: string;
    private rotationOffset = 0;

    private bgShaderMaterial: ShaderMaterial;
    private bgVertexShader: string;
    private bgFragmentShader: string;
    private bgPlane: Mesh;

    private lightSphere: Mesh;
    private mousePos: Vector2 = new Vector2();
    private mouseFollowerPos: Vector2 = new Vector2();
    private mouseScenePos: Vector3 = new Vector3();
    private mouseVelocity: Vector3 = new Vector3();
    private mousePosElastic: Vector3 = new Vector3();

    private isDestroyed: boolean = false;

    private simplex = new SimplexNoise();

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync(
                'assets/evil-spaghetti/_tube-fragment.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/evil-spaghetti/_tube-vertex.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/evil-spaghetti/_bg-fragment.glsl'
            ),
            new FileLoader().loadAsync('assets/evil-spaghetti/_bg-vertex.glsl')
        ];

        Promise.all(assets).then((res) => {
            this.tubeFragmentShader = res[0];
            this.tubeVertexShader = res[1];
            this.bgFragmentShader = res[2];
            this.bgVertexShader = res[3];

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
        this.camera.position.z = 1.8;
        this.scene = new Scene();
        this.bgScene = new Scene();

        this.initBg();
        this.initTubes();
        this.initLightSphere();

        this.renderer = new WebGLRenderer();
        this.renderer.autoClear = false;
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        /*this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();*/

        document.onpointermove = (e) => {
            this.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;

            this.tubeShaderMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.tubeShaderMaterial.uniforms.u_mouse.value.y = e.pageY;
            this.bgShaderMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.bgShaderMaterial.uniforms.u_mouse.value.y = e.pageY;
        };

        if (this.oninit) this.oninit();
    }

    initTubes(): void {
        this.tubeContainer = new Object3D();
        this.scene.add(this.tubeContainer);

        this.tubeShaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_lightPos: { type: 'v3', value: new Vector3() } as any
            },
            vertexShader: this.tubeVertexShader,
            fragmentShader: this.tubeFragmentShader,
            side: DoubleSide
        });

        for (let i = 0; i < 200; ++i) {
            this.initTube(
                new Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                )
            );
        }
    }

    initTube(start: Vector3): void {
        const scale = 1.2;
        const points: Vector3[] = [];
        const len = 1;
        const numPoints = 100;
        let currentPoint = start.clone();

        points.push(currentPoint);

        for (let i = 0; i < numPoints; ++i) {
            currentPoint = currentPoint
                .clone()
                .addScaledVector(
                    this.computeCurl(
                        currentPoint.x / scale,
                        currentPoint.y / scale,
                        currentPoint.z / scale
                    ) as Vector3,
                    len / numPoints
                );
            points.push(currentPoint);
        }

        const curve = new CatmullRomCurve3(points);
        const geometry = new TubeBufferGeometry(
            curve,
            numPoints,
            0.005,
            5,
            false
        );
        const mesh = new Mesh(geometry, this.tubeShaderMaterial);
        this.tubeContainer.add(mesh);
    }

    initBg(): void {
        const geometry = new PlaneBufferGeometry(6, 6);

        this.bgShaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_lightPos: { type: 'v3', value: new Vector3() } as any
            },
            vertexShader: this.bgVertexShader,
            fragmentShader: this.bgFragmentShader
        });

        this.bgPlane = new Mesh(geometry, this.bgShaderMaterial);
        this.bgScene.add(this.bgPlane);
    }

    initLightSphere(): void {
        const geometry = new IcosahedronBufferGeometry(0.01, 2);
        this.lightSphere = new Mesh(
            geometry,
            new MeshBasicMaterial({ color: 0xffffee })
        );
        this.scene.add(this.lightSphere);
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.tubeShaderMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.tubeShaderMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.bgShaderMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.bgShaderMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.mouseFollowerPos.add(
            this.mousePos.clone().sub(this.mouseFollowerPos).multiplyScalar(0.1)
        );

        this.rotationOffset += 0.0005;
        this.tubeContainer.rotation.y =
            this.mouseFollowerPos.x / 10 + this.rotationOffset;
        this.tubeContainer.rotation.x = -this.mouseFollowerPos.y / 10;

        this.raycaster.setFromCamera(this.mousePos, this.camera);
        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObject(this.bgPlane);
        if (intersects.length > 0) {
            this.mouseScenePos.copy(intersects[0].point);
        }

        this.animateLightSphere();
        //this.controls.update();
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    animateLightSphere(): void {
        this.mouseVelocity
            .add(
                this.mouseScenePos
                    .clone()
                    .sub(this.mousePosElastic)
                    .multiplyScalar(0.015)
            )
            .multiplyScalar(0.95);

        this.mousePosElastic.add(this.mouseVelocity);

        this.lightSphere.position.copy(this.mousePosElastic);
    }

    public render(): void {
        this.tubeShaderMaterial.uniforms.u_time.value += 0.05;
        this.bgShaderMaterial.uniforms.u_time.value += 0.05;
        this.tubeShaderMaterial.uniforms.u_lightPos.value.copy(
            this.mousePosElastic
        );
        this.bgShaderMaterial.uniforms.u_lightPos.value.copy(
            this.mousePosElastic
        );

        this.renderer.clear();
        this.renderer.render(this.bgScene, this.camera);
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.camera);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }

    computeCurl(x, y, z): { x: number; y: number; z: number } {
        var eps = 0.0001;

        var curl = new Vector3();

        //Find rate of change in YZ plane
        var n1 = this.simplex.noise3d(x, y + eps, z);
        var n2 = this.simplex.noise3d(x, y - eps, z);
        //Average to find approximate derivative
        var a = (n1 - n2) / (2 * eps);
        var n1 = this.simplex.noise3d(x, y, z + eps);
        var n2 = this.simplex.noise3d(x, y, z - eps);
        //Average to find approximate derivative
        var b = (n1 - n2) / (2 * eps);
        curl.x = a - b;

        //Find rate of change in XZ plane
        n1 = this.simplex.noise3d(x, y, z + eps);
        n2 = this.simplex.noise3d(x, y, z - eps);
        a = (n1 - n2) / (2 * eps);
        n1 = this.simplex.noise3d(x + eps, y, z);
        n2 = this.simplex.noise3d(x + eps, y, z);
        b = (n1 - n2) / (2 * eps);
        curl.y = a - b;

        //Find rate of change in XY plane
        n1 = this.simplex.noise3d(x + eps, y, z);
        n2 = this.simplex.noise3d(x - eps, y, z);
        a = (n1 - n2) / (2 * eps);
        n1 = this.simplex.noise3d(x, y + eps, z);
        n2 = this.simplex.noise3d(x, y - eps, z);
        b = (n1 - n2) / (2 * eps);
        curl.z = a - b;

        return curl;
    }
}
