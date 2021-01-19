import {
  FileLoader,
  Intersection,
  Mesh,
  PerspectiveCamera,
  PlaneBufferGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ParametricGeometries } from "three/examples/jsm/geometries/ParametricGeometries";
import plane = ParametricGeometries.plane;

export class Displace2Sketch {
  public oninit: Function;

  private container: HTMLElement;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: Raycaster;
  private uniforms: { [uniform: string]: any };
  private planeMesh: Mesh;

  private vertexShader: string;
  private fragmentShader: string;
  private t1: Texture;

  private mouse: Vector2 = new Vector2();

  constructor(container: HTMLElement) {
    this.container = container;

    const assets: Promise<any>[] = [
      new FileLoader().loadAsync("assets/displace-2/_fragment.glsl"),
      new FileLoader().loadAsync("assets/displace-2/_vertex.glsl"),
      new TextureLoader().loadAsync("assets/shared-textures/text1.jpg"),
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
      u_mouse: { type: "v2", value: new Vector2() },
      u_planePoint: { type: "v3", value: new Vector3() },
      u_t1: { type: "t", value: this.t1 },
    };

    const material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    this.planeMesh = new Mesh(geometry, material);
    this.scene.add(this.planeMesh);

    this.renderer = new WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.container.appendChild(this.renderer.domElement);

    this.updateSize();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();

    document.onmousemove = (e) => {
      this.uniforms.u_mouse.value.x = e.pageX;
      this.uniforms.u_mouse.value.y = e.pageY;
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    this.raycaster = new Raycaster();

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

    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    const planeIntersect: Intersection = intersects.find(
      (i) => i.object === this.planeMesh
    );

    if (planeIntersect) {
      (this.uniforms.u_planePoint.value as Vector3).copy(planeIntersect.point);
    }

    this.render();

    requestAnimationFrame(() => this.animate());
  }

  public render(): void {
    this.uniforms.u_time.value += 0.05;
    this.renderer.render(this.scene, this.camera);
  }
}
