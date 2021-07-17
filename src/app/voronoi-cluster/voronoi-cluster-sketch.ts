import {
    FileLoader,
    Mesh,
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
import noise from './noise';

export class VoronoiClusterSketch {
    public oninit: Function;

    private width: number;
    private height: number;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private mouse: Vector2 = new Vector2();

    private vertexShader: string;
    private fragmentShader: string;
    private t1: Texture;
    private t2: Texture;
    private t3: Texture;
    private t4: Texture;
    private t5: Texture;
    private t6: Texture;
    private shaderMaterial: ShaderMaterial;

    private CELL_COUNT = 12;
    private minDistance = 140;
    private cells: Cell[] = [];
    private constraints: MinDistanceConstraint[] = [];
    private center = new Vector2(100, 100);
    private hoveredCell: Cell;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/voronoi-cluster/_fragment.glsl'),
            new FileLoader().loadAsync('assets/voronoi-cluster/_vertex.glsl'),
            new TextureLoader().loadAsync(
                'assets/shared-textures/cover-1-480.jpg'
            ),
            new TextureLoader().loadAsync(
                'assets/shared-textures/cover-2-480.jpg'
            ),
            new TextureLoader().loadAsync(
                'assets/shared-textures/cover-3-480.jpg'
            ),
            new TextureLoader().loadAsync(
                'assets/shared-textures/cover-4-480.jpg'
            ),
            new TextureLoader().loadAsync(
                'assets/shared-textures/cover-5-480.jpg'
            ),
            new TextureLoader().loadAsync(
                'assets/shared-textures/cover-6-480.png'
            )
        ];

        Promise.all(assets).then((res) => {
            this.fragmentShader = res[0];
            this.vertexShader = res[1];
            this.t1 = res[2];
            this.t2 = res[3];
            this.t3 = res[4];
            this.t4 = res[5];
            this.t5 = res[6];
            this.t6 = res[7];

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
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        this.initCells();

        document.onpointermove = (e) => {
            this.mouse.set(e.pageX, e.pageY);
            this.shaderMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.shaderMaterial.uniforms.u_mouse.value.y = e.pageY;
        };

        if (this.oninit) this.oninit();
    }

    initObject(): void {
        const geometry = new PlaneBufferGeometry(2, 2);
        this.shaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_resolution: { value: new Vector2() },
                u_mouse: { value: new Vector2() },
                u_t1: { value: this.t1 },
                u_t2: { value: this.t2 },
                u_t3: { value: this.t3 },
                u_t4: { value: this.t4 },
                u_t5: { value: this.t5 },
                u_t6: { value: this.t6 },
                u_itemPositions: {
                    value: Array(this.CELL_COUNT)
                        .fill(undefined)
                        .map(() => new Vector2())
                }
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });

        const mesh = new Mesh(geometry, this.shaderMaterial);
        this.scene.add(mesh);
    }

    initCells(): void {
        for (let i = 0; i < this.CELL_COUNT; i++) {
            const cell = new Cell(
                i,
                new Vector2(
                    Math.random() * this.width,
                    Math.random() * this.height
                )
            );
            this.cells.push(cell);
        }

        this.cells.forEach((a) => {
            this.cells.forEach((b) => {
                if (a !== b) {
                    const constraint = new MinDistanceConstraint(
                        a,
                        b,
                        this.minDistance
                    );
                    this.constraints.push(constraint);
                }
            });
        });
    }

    public updateSize(): void {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.renderer.setSize(this.width, this.height);

        this.center.x = this.width / 2;
        this.center.y = this.height / 2;
        this.minDistance = this.width / 7.5;
        this.constraints.forEach((c) => (c.minDistance = this.minDistance));

        this.shaderMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.shaderMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;
        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.constraints.forEach((c) => c.update());

        this.cells.forEach((c, i) => {
            const mouseDist: number = new Vector2()
                .subVectors(this.mouse, c.pos)
                .length();
            const isHovered: boolean = mouseDist < this.minDistance / 1.5;

            if (isHovered && c !== this.hoveredCell) {
                if (this.hoveredCell) {
                    this.hoveredCell.isHovered = false;
                }
                this.hoveredCell = c;
                c.isHovered = true;
            } else if (!isHovered && c === this.hoveredCell) {
                c.isHovered = false;
                this.hoveredCell = null;
            }

            c.update(
                this.shaderMaterial.uniforms.u_time.value,
                this.cells,
                this.center
            );

            const a = Math.max(this.width, this.height);

            (this.shaderMaterial.uniforms.u_itemPositions.value[
                i
            ] as Vector2).set(c.pos.x / a, (this.height - c.pos.y) / a);
        });

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

class Cell {
    public totalForce: Vector2 = new Vector2(0, 0);
    public velocity: Vector2 = new Vector2(0, 0);

    public mass: number = 10;
    public drag: number = 1.25;
    public isHovered: boolean = false;

    public onIsHovered: Function;

    constructor(public id: number, public pos: Vector2) {}

    update(time, cells, center) {
        const gravityCenter = this.isHovered ? this.pos : center;
        const centerForce = new Vector2()
            .subVectors(gravityCenter, this.pos)
            .divideScalar(10);

        const n = noise.simplex2(time / 10 + this.id, time / 10 + this.id);
        const randomForce = new Vector2(n, n);
        randomForce.multiplyScalar(15);

        this.totalForce.add(centerForce);
        if (!this.isHovered) {
            this.totalForce.add(randomForce);
        }

        this.velocity.add(this.totalForce.divideScalar(this.mass));
        this.pos.add(this.velocity.divideScalar(this.drag));
    }
}

class MinDistanceConstraint {
    private _minDistance: number = 0;

    constructor(public a: Cell, public b: Cell, minDistance: number) {
        this.minDistance = minDistance;
    }

    set minDistance(value: number) {
        this._minDistance = value + Math.random() * 50;
    }
    get minDistance(): number {
        return this._minDistance;
    }

    update() {
        const sub = new Vector2().subVectors(this.a.pos, this.b.pos);
        const dist = sub.length();
        const mDist =
            this.a.isHovered || this.b.isHovered
                ? this._minDistance * 2.4
                : this._minDistance;
        if (dist < mDist) {
            const f = (mDist - dist) / 2;
            const fV = sub.normalize().multiplyScalar(f);
            if (!this.a.isHovered) this.a.totalForce.add(fV);
            if (!this.b.isHovered) this.b.totalForce.sub(fV);
        }
    }
}
