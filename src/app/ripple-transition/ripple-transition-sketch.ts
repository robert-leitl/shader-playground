import {
    FileLoader,
    Mesh,
    OrthographicCamera,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Scene,
    Shader,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    VideoTexture,
    WebGLRenderer
} from 'three';

export class RippleTransitionSketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: OrthographicCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;

    private vertexShader: string;
    private fragmentShader: string;
    private shaderMaterial: ShaderMaterial;
    private videoTexture: VideoTexture;
    private videoTextureAspect: number;
    private t1: Texture;
    private t1Aspect: number;
    private progressLinear: number = 0;
    private progress: number = 0;
    private noiseProgress: number = 0;
    private isPointerDown: boolean = false;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync(
                'assets/ripple-transition/_fragment.glsl'
            ),
            new FileLoader().loadAsync('assets/ripple-transition/_vertex.glsl'),
            new TextureLoader().loadAsync('assets/shared-textures/img2.jpg'),
            this.loadVideo('assets/shared-textures/leaves.mp4')
        ];

        Promise.all(assets).then((res) => {
            this.fragmentShader = res[0];
            this.vertexShader = res[1];
            this.t1 = res[2];
            this.t1Aspect = this.t1.image.width / this.t1.image.height;

            const forestVideoElm: HTMLVideoElement = res[3] as HTMLVideoElement;
            forestVideoElm.autoplay = true;
            forestVideoElm.muted = true;
            forestVideoElm.loop = true;
            forestVideoElm.play();
            this.videoTextureAspect =
                forestVideoElm.videoWidth / forestVideoElm.videoHeight;
            this.videoTexture = new VideoTexture(forestVideoElm);

            this.init();
        });
    }

    private init(): void {
        this.camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 1, 1000);
        this.camera.position.z = 2;
        this.scene = new Scene();

        const geometry = new PlaneBufferGeometry(1, 1);
        this.shaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_progress: { value: 0.5 },
                u_noiseProgress: { value: 0.5 },
                u_resolution: { value: new Vector2() },
                u_mouse: { value: new Vector2() },
                u_t1: { value: this.t1 },
                u_t1Scale: { value: new Vector2(1, 1) },
                u_v1: { value: this.videoTexture },
                u_v1Scale: { value: new Vector2(1, 1) }
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        const mesh = new Mesh(geometry, this.shaderMaterial);
        this.scene.add(mesh);

        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        document.onpointermove = (e) => {
            this.shaderMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.shaderMaterial.uniforms.u_mouse.value.y = e.pageY;
        };

        document.onpointerdown = () => {
            this.isPointerDown = true;
        };
        document.onpointerup = () => {
            this.isPointerDown = false;
        };

        if (this.oninit) this.oninit();
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );
        this.shaderMaterial.uniforms.u_resolution.value.x = this.renderer.domElement.width;
        this.shaderMaterial.uniforms.u_resolution.value.y = this.renderer.domElement.height;

        // scale textures proportionally in cover fit mode
        const viewportAspect =
            this.renderer.domElement.width / this.renderer.domElement.height;
        let videoScaling: Vector2 = new Vector2(1, 1);
        let imgScaling: Vector2 = new Vector2(1, 1);
        if (viewportAspect > this.videoTextureAspect) {
            videoScaling.y = this.videoTextureAspect / viewportAspect;
        } else {
            videoScaling.x = viewportAspect / this.videoTextureAspect;
        }
        if (viewportAspect > this.t1Aspect) {
            imgScaling.y = this.t1Aspect / viewportAspect;
        } else {
            imgScaling.x = viewportAspect / this.t1Aspect;
        }

        this.shaderMaterial.uniforms.u_v1Scale.value.copy(videoScaling);
        this.shaderMaterial.uniforms.u_t1Scale.value.copy(imgScaling);

        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        if (this.isPointerDown) {
            this.progressLinear += 0.02;
        } else {
            this.progressLinear -= 0.07;
        }
        this.progressLinear = Math.max(0, Math.min(1, this.progressLinear));
        this.progress = this.easeInOutQuint(this.progressLinear);

        const damping = this.isPointerDown ? 1 : 10;
        this.noiseProgress += (this.progress - this.noiseProgress) / damping;
        this.shaderMaterial.uniforms.u_progress.value = this.progress;
        this.shaderMaterial.uniforms.u_noiseProgress.value = this.noiseProgress;

        this.render();

        requestAnimationFrame(() => this.animate());
    }

    easeInOutQuint(x: number): number {
        return x < 0.5
            ? 16 * x * x * x * x * x
            : 1 - Math.pow(-2 * x + 2, 5) / 2;
    }

    public render(): void {
        this.shaderMaterial.uniforms.u_time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }

    /**
     * This method takes a src string and creates a new video element
     * without appending it to the DOM and loading the video.
     * It returns a promise which resolves with the video element,
     * if the video was loaded successful and can be played through.
     *
     * The video will set autoplay to true and muted to false in order
     * to enable auto play in the browser.
     *
     * @param src The source url of the video to load.
     */
    loadVideo(src: string): Promise<HTMLVideoElement> {
        return new Promise((resolve, reject) => {
            let fallbackTimeoutId: any;

            const video = document.createElement('video');
            const oncanplaythroughHandler = () => {
                // clear the fallback timeout
                if (fallbackTimeoutId) {
                    clearTimeout(fallbackTimeoutId);
                }

                video.autoplay = false;
                video.play().then(() => resolve(video));
            };
            const errorHandler = () => {
                // clear the fallback timeout
                if (fallbackTimeoutId) {
                    clearTimeout(fallbackTimeoutId);
                }

                reject();
            };
            video.oncanplaythrough = oncanplaythroughHandler;
            video.onerror = errorHandler;
            video.onabort = errorHandler;
            video.src = src;
            video.muted = true;
            video.autoplay = true;

            // If the video is in the cache of the browser,
            // the 'canplaythrough' event might have been triggered
            // before we registered the event handler.
            if (video.readyState >= 4) {
                oncanplaythroughHandler();
            }

            // add a fallback timeout to trigger the video start,
            // because under some unknown circumstances the event won't fire
            // and the readyState also won't be set correctly
            fallbackTimeoutId = setTimeout(oncanplaythroughHandler, 10000);
        });
    }
}
