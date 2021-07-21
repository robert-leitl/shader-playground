import {
    Color,
    DataTexture,
    FileLoader,
    FloatType,
    LinearFilter,
    Mesh,
    MeshBasicMaterial,
    MirroredRepeatWrapping,
    Object3D,
    OrthographicCamera,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Ray,
    Raycaster,
    RepeatWrapping,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    Vector3,
    WebGLRenderer,
    WebGLRenderTarget
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class ReactionDiffusion1Sketch {
    public oninit: Function;

    private width: number;
    private height: number;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private raycaster: Raycaster;

    private renderMesh: Mesh;
    private renderVertexShader: string;
    private renderFragmentShader: string;
    private renderMaterial: ShaderMaterial;
    private renderMeshPointerPosition: Vector3 = new Vector3();

    private pointerPosition: Vector2 = new Vector2();
    private isPointerDown: boolean = false;

    private computeScene: Scene;
    private computeCamera: OrthographicCamera;
    private computeMesh: Mesh;
    private computeVertexShader: string;
    private computeFragmentShader: string;
    private computeMaterial: ShaderMaterial;
    private computeRenderTargets: WebGLRenderTarget[] = Array(2).fill(
        undefined
    );
    private computeStepsInFrame = 20;
    private currentRenderTargetIndex = 0;
    private computeSize = 256;

    /**
     * This material is necessary, because in order to manually update the
     * texture of a render target, one has to render it. The bypass material
     * just takes the manually modified texture and renders it to the target.
     *
     * @private
     */
    private computeBypassMaterial: ShaderMaterial;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync(
                'assets/reaction-diffusion-1/_rd-render-fragment.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/reaction-diffusion-1/_rd-render-vertex.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/reaction-diffusion-1/_rd-compute_fragment.glsl'
            ),
            new FileLoader().loadAsync(
                'assets/reaction-diffusion-1/_rd-compute_vertex.glsl'
            )
        ];

        Promise.all(assets).then((res) => {
            this.renderFragmentShader = res[0];
            this.renderVertexShader = res[1];
            this.computeFragmentShader = res[2];
            this.computeVertexShader = res[3];

            this.init();
        });
    }

    private init(): void {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.camera = new PerspectiveCamera(
            45,
            this.container.offsetWidth / this.container.offsetHeight,
            0.1,
            100
        );
        this.camera.position.z = 3;
        this.scene = new Scene();
        this.scene.background = new Color(1, 1, 1);
        this.renderer = new WebGLRenderer({
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.initComputeShader();
        this.initObject();

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        document.onpointermove = (e) => {
            this.pointerPosition.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.pointerPosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        document.onpointerdown = () => {
            this.isPointerDown = true;
        };
        document.onpointerup = () => {
            this.isPointerDown = false;
        };

        this.raycaster = new Raycaster();

        if (this.oninit) this.oninit();
    }

    initComputeShader(): void {
        this.computeMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_resolution: {
                    value: new Vector2(this.computeSize, this.computeSize)
                },
                u_pointer: { value: new Vector3() },
                u_isPointerDown: { value: false },
                u_texture: { value: null }
            },
            vertexShader: this.computeVertexShader,
            fragmentShader: this.computeFragmentShader
        });

        const geometry = new PlaneBufferGeometry(2, 2);
        this.computeMesh = new Mesh(geometry, this.computeMaterial);
        this.computeScene = new Scene();
        this.computeScene.add(this.computeMesh);
        this.computeCamera = new OrthographicCamera(1, 1, 1, 1);

        this.computeBypassMaterial = new ShaderMaterial({
            uniforms: {
                u_resolution: {
                    value: new Vector2(this.computeSize, this.computeSize)
                },
                u_texture: { value: null }
            },
            vertexShader: `
            uniform vec2 u_resolution;
            void main() {
                gl_Position = vec4(position, 1.0);
            }`,
            fragmentShader: `
            uniform sampler2D u_texture;
            uniform vec2 u_resolution;
            void main() {
                vec2 st = gl_FragCoord.xy / u_resolution.xy;
                gl_FragColor = texture2D( u_texture, st);
            }`
        });

        this.computeRenderTargets = this.computeRenderTargets.map(
            () =>
                new WebGLRenderTarget(this.computeSize, this.computeSize, {
                    minFilter: LinearFilter,
                    magFilter: LinearFilter,
                    // the type is very important for the compute shader to work!
                    type: FloatType,
                    wrapS: MirroredRepeatWrapping,
                    wrapT: MirroredRepeatWrapping,
                    depthBuffer: false,
                    stencilBuffer: false
                })
        );
        this.initialSeed(
            this.computeRenderTargets[this.currentRenderTargetIndex]
        );
    }

    initObject(): void {
        const geometry = new PlaneBufferGeometry(2.5, 2.5);
        this.renderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_resolution: {
                    value: new Vector2()
                },
                u_texture: { value: null }
            },
            fragmentShader: this.renderFragmentShader,
            vertexShader: this.renderVertexShader
        });

        this.renderMesh = new Mesh(geometry, this.renderMaterial);
        this.renderMesh.rotation.x = -Math.PI / 8;
        this.renderMesh.position.z += 1.2;
        this.scene.add(this.renderMesh);
    }

    private focusObject(obj: Object3D): void {
        const dist = this.camera.position.z;
        const height = 4.8;
        this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

        if (this.width / this.height > 1) {
            obj.scale.x = this.camera.aspect;
        } else {
            obj.scale.y = 1 / this.camera.aspect;
        }

        this.camera.updateProjectionMatrix();
    }

    public updateSize(): void {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.renderer.setSize(this.width, this.height);

        this.renderMaterial.uniforms.u_resolution.value.x = this.width;
        this.renderMaterial.uniforms.u_resolution.value.y = this.height;

        this.renderMesh.position.z = Math.max(1.5 - 1000 / this.width, 0.8);

        this.camera.aspect =
            this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.raycaster.setFromCamera(this.pointerPosition, this.camera);
        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObject(this.renderMesh);
        if (intersects.length > 0) {
            this.renderMeshPointerPosition.set(
                intersects[0].uv.x * 2 - 1,
                intersects[0].uv.y * 2 - 1,
                0
            );
            this.computeMaterial.uniforms.u_pointer.value = this.renderMeshPointerPosition;
            this.computeMaterial.uniforms.u_isPointerDown.value = this.isPointerDown;
        }

        this.scene.rotation.y +=
            (this.pointerPosition.x / 20 - this.scene.rotation.y) / 16;
        this.scene.rotation.x +=
            (-this.pointerPosition.y / 20 - this.scene.rotation.x) / 16;

        this.compute();
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    public render(): void {
        this.computeMaterial.uniforms.u_time.value += 0.05;
        this.renderMaterial.uniforms.u_time.value = this.computeMaterial.uniforms.u_time.value;
        this.renderer.render(this.scene, this.camera);
    }

    private compute(): void {
        for (let i = 0; i < this.computeStepsInFrame; i++) {
            const nextRenderTargetIndex =
                this.currentRenderTargetIndex === 0 ? 1 : 0;

            this.computeMaterial.uniforms.u_texture.value = this.computeRenderTargets[
                this.currentRenderTargetIndex
            ].texture;
            this.renderer.setRenderTarget(
                this.computeRenderTargets[nextRenderTargetIndex]
            );
            this.renderer.render(this.computeScene, this.computeCamera);

            this.currentRenderTargetIndex = nextRenderTargetIndex;
        }

        this.renderMaterial.uniforms.u_texture.value = this.computeRenderTargets[
            this.currentRenderTargetIndex
        ].texture;

        // reset to canvas
        this.renderer.setRenderTarget(null);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }

    private getRenderTargetDataTexture(
        renderTarget: WebGLRenderTarget
    ): DataTexture {
        const buffer = new Float32Array(
            renderTarget.width * renderTarget.height * 4
        );
        this.renderer.readRenderTargetPixels(
            renderTarget,
            0,
            0,
            renderTarget.width,
            renderTarget.height,
            buffer
        );
        const texture = new DataTexture(
            buffer,
            renderTarget.width,
            renderTarget.height,
            RGBAFormat,
            FloatType
        );
        return texture;
    }

    private initialSeed(renderTarget: WebGLRenderTarget): void {
        const texture: DataTexture = this.getRenderTargetDataTexture(
            renderTarget
        );
        const w = texture.image.width;
        const h = texture.image.height;
        const pixels = texture.image.data;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const pixelIndex = (y * w + x) * 4;
                pixels[pixelIndex] = 1; // A
                pixels[pixelIndex + 1] = 0; // B
                pixels[pixelIndex + 2] = 0;
                pixels[pixelIndex + 3] = 1;
            }
        }
        this.updateRenderTargetTexture(renderTarget, texture);
    }

    private updateRenderTargetTexture(
        renderTarget: WebGLRenderTarget,
        texture: Texture
    ): void {
        texture.needsUpdate = true;
        this.computeBypassMaterial.uniforms.u_texture.value = texture;
        this.computeBypassMaterial.uniforms.u_resolution.value.x = this.computeSize;
        this.computeBypassMaterial.uniforms.u_resolution.value.y = this.computeSize;
        this.computeMesh.material = this.computeBypassMaterial;
        this.renderer.setRenderTarget(renderTarget);
        this.renderer.render(this.computeScene, this.computeCamera);
        this.renderer.setRenderTarget(null);
        this.computeMesh.material = this.computeMaterial;
        this.computeBypassMaterial.uniforms.u_texture.value = null;
    }

    private rectSeed(renderTarget: WebGLRenderTarget): void {
        const texture: DataTexture = this.getRenderTargetDataTexture(
            renderTarget
        );
        const w = texture.image.width;
        const h = texture.image.height;
        const pixels = texture.image.data;
        const w2 = Math.floor(w / 2);
        const h2 = Math.floor(h / 2);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const pixelIndex = (y * w + x) * 4;
                pixels[pixelIndex] = 1; // A
                pixels[pixelIndex + 1] = 0; // B
                pixels[pixelIndex + 2] = 0;
                pixels[pixelIndex + 3] = 1;

                if (y > h2 - 20 && y < h2 + 20 && x > w2 - 20 && x < w2 + 20) {
                    pixels[pixelIndex + 1] = 1; // B
                    pixels[pixelIndex + 2] = 0;
                }
            }
        }
        this.updateRenderTargetTexture(renderTarget, texture);
    }
}
