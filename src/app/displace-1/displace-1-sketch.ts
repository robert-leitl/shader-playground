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

export class Displace1Sketch {
  public oninit: Function;

  private container: HTMLElement;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private controls: OrbitControls;
  private uniforms: { [uniform: string]: any };

  private vertexShader: string;
  private fragmentShader: string;
  private t1: Texture;
  private tDisplace: Texture;
  private toProgress: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    const assets: Promise<any>[] = [
      new FileLoader().loadAsync("assets/displace-1/_fragment.glsl"),
      new FileLoader().loadAsync("assets/displace-1/_vertex.glsl"),
      new TextureLoader().loadAsync("assets/shared-textures/img4.jpg"),
      new TextureLoader().loadAsync("assets/shared-textures/displace.jpg"),
    ];

    Promise.all(assets).then((res) => {
      this.fragmentShader = res[0];
      this.vertexShader = res[1];
      this.t1 = res[2];
      this.tDisplace = res[3];

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
      u_time: { type: "f", value: 1.0 },
      u_progress: { type: "f", value: this.toProgress },
      u_resolution: { type: "v2", value: new Vector2() },
      u_mouse: { type: "v2", value: new Vector2() },
      u_t1: { type: "t", value: this.t1 },
      u_tDisplace: { type: "t", value: this.tDisplace },
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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();

    document.onmousemove = (e) => {
      this.uniforms.u_mouse.value.x = e.pageX;
      this.uniforms.u_mouse.value.y = e.pageY;
    };

    this.renderer.domElement.onpointerdown = () => {
      this.toProgress = 1;
    };

    this.renderer.domElement.onpointerup = () => {
      this.toProgress = 0;
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
    this.camera.aspect =
      this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
  }

  public animate(): void {
    this.controls.update();
    this.render();

    this.uniforms.u_progress.value +=
      (this.toProgress - this.uniforms.u_progress.value) / 5;

    requestAnimationFrame(() => this.animate());
  }

  public render(): void {
    this.uniforms.u_time.value += 0.05;
    this.renderer.render(this.scene, this.camera);
  }
}
