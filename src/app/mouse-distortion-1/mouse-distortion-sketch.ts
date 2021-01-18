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
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class MouseDistortionSketch {
  public oninit: Function;

  private container: HTMLElement;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private uniforms: { [uniform: string]: any };

  private vertexShader: string;
  private fragmentShader: string;
  private t1: Texture;

  private mousePos: Vector2 = new Vector2(0, 0);
  private mouseTracker: Vector2 = new Vector2(0, 0);
  private mouseVelocity: Vector2 = new Vector2(0, 0);

  constructor(container: HTMLElement) {
    this.container = container;

    const assets: Promise<any>[] = [
      new FileLoader().loadAsync("assets/mouse-distortion-1/_fragment.glsl"),
      new FileLoader().loadAsync("assets/mouse-distortion-1/_vertex.glsl"),
      new TextureLoader().loadAsync("assets/shared-textures/img4.jpg"),
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
    const geometry = new PlaneBufferGeometry(2, 2);

    this.uniforms = {
      u_time: { type: "", value: 1.0 },
      u_resolution: { type: "v2", value: new Vector2() },
      u_mouse: { type: "v2", value: this.mousePos },
      u_mouse_v: { type: "v2", value: this.mouseVelocity },
      u_t1: { type: "t", value: this.t1 },
      u_t1Aspect: {
        type: "v2",
        value: this.getCoverAspectRatio(this.t1, this.container),
      },
    };

    const material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    const mesh = new Mesh(geometry, material);
    this.scene.add(mesh);

    this.renderer = new WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.container.appendChild(this.renderer.domElement);

    this.updateSize();

    this.renderer.domElement.onmousemove = (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = this.renderer.domElement.offsetHeight - e.clientY;
    };

    if (this.oninit) this.oninit();
  }

  public updateSize(): void {
    this.renderer.setSize(
      this.container.offsetWidth,
      this.container.offsetHeight
    );
    this.uniforms.u_resolution.value.x = this.renderer.domElement.width;
    this.uniforms.u_resolution.value.y = this.renderer.domElement.height;
    this.uniforms.u_t1Aspect.value = this.getCoverAspectRatio(
      this.t1,
      this.container
    );
    this.camera.aspect =
      this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
  }

  public animate(): void {
    this.render();

    this.mouseTracker.x += (this.mousePos.x - this.mouseTracker.x) / 20;
    this.mouseTracker.y += (this.mousePos.y - this.mouseTracker.y) / 20;
    this.mouseVelocity.x +=
      (this.mousePos.x - this.mouseTracker.x - this.mouseVelocity.x) / 1.5;
    this.mouseVelocity.y +=
      (this.mousePos.y - this.mouseTracker.y - this.mouseVelocity.y) / 1.5;

    requestAnimationFrame(() => this.animate());
  }

  public render(): void {
    this.uniforms.u_time.value += 0.05;
    this.renderer.render(this.scene, this.camera);
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
