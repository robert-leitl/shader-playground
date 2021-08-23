import {
    AmbientLight,
    BasicShadowMap,
    Color,
    DirectionalLight,
    DoubleSide,
    FileLoader,
    Material,
    Matrix3,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MeshNormalMaterial,
    MeshStandardMaterial,
    PCFShadowMap,
    PCFSoftShadowMap,
    PerspectiveCamera,
    Plane,
    PlaneBufferGeometry,
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

class RibbonJoint {
    public parent: Ribbon;
    public id: number;
    public indexes: number[];

    public currentPosition: Vector3 = new Vector3();
    public previousPosition: Vector3 = new Vector3();

    constructor(parent: Ribbon, indexes: number[], id: number) {
        this.indexes = indexes;
        this.id = id;
        this.parent = parent;
    }

    public update(target: Vector3): void {
        this.previousPosition.copy(this.currentPosition);
        this.currentPosition.copy(target);

        let angle = Math.atan2(this.currentPosition.y, this.currentPosition.x);

        angle -= Math.PI / 2;
        const width =
            this.parent.width * Math.min(1, this.currentPosition.length());
        const spread = width / this.parent.WIDTH_SEGMENT_COUNT;
        const w2 = width / 2;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const p: Vector3 = new Vector3(dx * w2, dy * w2, 0);
        p.add(this.currentPosition);

        const posArray: Float32Array = this.parent.geometry.attributes.position
            .array as Float32Array;

        this.indexes.forEach((v) => {
            posArray[v + 0] = p.x;
            posArray[v + 1] = p.y;
            posArray[v + 2] = 0;

            p.x -= dx * spread;
            p.y -= dy * spread;
        });
    }

    public follow(target: RibbonJoint): void {
        this.previousPosition.copy(this.currentPosition);
        this.currentPosition.copy(target.currentPosition);
        const posArray: Float32Array = this.parent.geometry.attributes.position
            .array as Float32Array;

        // copy position values from target
        this.indexes.forEach((v, i) => {
            posArray[v + 0] = posArray[target.indexes[i] + 0];
            posArray[v + 1] = posArray[target.indexes[i] + 1];
            posArray[v + 2] = posArray[target.indexes[i] + 2];
        });
    }
}

class Ribbon {
    public mesh: Mesh;
    public joints: RibbonJoint[];
    public width: number;
    public geometry: PlaneBufferGeometry;
    public WIDTH_SEGMENT_COUNT = 1;

    constructor(numJoints: number, width: number, material: Material) {
        this.width = width;
        this.geometry = new PlaneBufferGeometry(
            width,
            0,
            this.WIDTH_SEGMENT_COUNT,
            numJoints - 1
        );
        const m: MeshStandardMaterial = new MeshStandardMaterial({
            color: 0xff0000,
            side: DoubleSide,
            shadowSide: DoubleSide
        });
        this.mesh = new Mesh(this.geometry, m);
        this.mesh.castShadow = this.mesh.receiveShadow = true;

        // create the joints with the geometry vertices
        this.joints = [];
        const verticesPerJoint = this.WIDTH_SEGMENT_COUNT + 1;
        for (let i = 0; i < numJoints; i++) {
            const indexes: number[] = Array(verticesPerJoint)
                .fill(undefined)
                .map((item, index) => (i * verticesPerJoint + index) * 3);
            let joint = new RibbonJoint(this, indexes, i);

            this.joints.push(joint);
        }

        console.log(this.geometry, this.joints);
    }

    public update(target: Vector3) {
        const posArray: Float32Array = this.geometry.attributes.position
            .array as Float32Array;
        const verticesPerJoint = this.WIDTH_SEGMENT_COUNT + 1;

        const rotationMat: Matrix4 = new Matrix4();
        const axis: Vector3 = new Vector3(target.y, -target.x, 0);
        axis.normalize();
        rotationMat.makeRotationAxis(axis, target.length() * 0.07);
        this.geometry.applyMatrix4(rotationMat);

        for (let i = this.joints.length - 1; i >= 0; i--) {
            let joint = this.joints[i];

            if (i === 0) {
                joint.update(target);
            } else {
                joint.follow(this.joints[i - 1]);
            }
        }

        this.geometry.computeVertexNormals();
        this.geometry.attributes.position.needsUpdate = true;
    }
}

export class RibbonSketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private raycaster: Raycaster;
    private raycasterPlaneMesh: Mesh;
    private pointer: Vector2 = new Vector2();

    private vertexShader: string;
    private fragmentShader: string;
    private t1: Texture;
    private shaderMaterial: ShaderMaterial;
    private targetPosition: Vector3 = new Vector3();
    private followerPosition: Vector3 = new Vector3();

    private ribbon: Ribbon;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/ribbon/_fragment.glsl'),
            new FileLoader().loadAsync('assets/ribbon/_vertex.glsl'),
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
        this.camera.position.z = 2;
        this.scene = new Scene();
        this.scene.background = new Color(1, 1, 1);
        this.raycaster = new Raycaster();
        const raycasterPlane = new PlaneBufferGeometry(8, 8, 1, 1);
        this.raycasterPlaneMesh = new Mesh(
            raycasterPlane,
            new MeshBasicMaterial({
                color: 0xff0000
            })
        );
        this.raycasterPlaneMesh.visible = false;
        this.scene.add(this.raycasterPlaneMesh);

        const light = new DirectionalLight(0xffffff, 1);
        light.position.set(0.25, 0.5, 0.5);
        light.position.multiplyScalar(10);
        light.castShadow = true;
        this.scene.add(light);

        light.shadow.mapSize.width = 1024; // default
        light.shadow.mapSize.height = 1024; // default
        light.shadow.camera.near = 0.01; // default
        light.shadow.camera.far = 10; // default
        light.shadow.normalBias = -0.02;

        const ambi = new AmbientLight();
        ambi.color = new Color(0xf0f0ff);
        ambi.intensity = 0.6;
        this.scene.add(ambi);

        this.initRibbon();
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFShadowMap;

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        document.onpointermove = (e) => {
            this.shaderMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.shaderMaterial.uniforms.u_mouse.value.y = e.pageY;

            this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };

        if (this.oninit) this.oninit();
    }

    initRibbon(): void {
        this.shaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_resolution: { value: new Vector2() },
                u_mouse: { value: new Vector2() },
                u_t1: { value: this.t1 }
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            wireframe: false,
            side: DoubleSide
        });

        this.ribbon = new Ribbon(400, 0.3, this.shaderMaterial);
        this.scene.add(this.ribbon.mesh);
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

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects([
            this.raycasterPlaneMesh
        ]);
        if (intersects.length > 0) {
            this.targetPosition.copy(intersects[0].point);
            this.followerPosition.x +=
                (this.targetPosition.x - this.followerPosition.x) / 16;
            this.followerPosition.y +=
                (this.targetPosition.y - this.followerPosition.y) / 16;
        }

        this.ribbon.update(this.followerPosition);
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
