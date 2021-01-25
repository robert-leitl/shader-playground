import {
  Color,
  DataTexture,
  FileLoader,
  FloatType,
  Mesh,
  NearestFilter,
  PerspectiveCamera,
  PlaneBufferGeometry,
  RGBFormat,
  Scene,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class MouseDistortion2Sketch {
  public oninit: Function;

  private container: HTMLElement;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private uniforms: { [uniform: string]: any };

  private vertexShader: string;
  private fragmentShader: string;
  private t1: Texture;

  private dataTextureSize = 32;
  private dataTexture: Texture;

  private prevMousePos: Vector2;
  private mousePos: Vector2;

  constructor(container: HTMLElement) {
    this.container = container;

    const assets: Promise<any>[] = [
      new FileLoader().loadAsync("assets/mouse-distortion-2/_fragment.glsl"),
      new FileLoader().loadAsync("assets/mouse-distortion-2/_vertex.glsl"),
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

    this.initDataTexture();

    this.uniforms = {
      u_time: { type: "", value: 1.0 },
      u_resolution: { type: "v2", value: new Vector2() },
      u_mouse: { type: "v2", value: this.mousePos },
      u_offsetTexture: { type: "t", value: this.dataTexture },
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

    this.renderer.domElement.onpointermove = (e) => {
      if (!this.mousePos) this.mousePos = new Vector2();

      this.mousePos.x = e.clientX / this.renderer.domElement.offsetWidth;
      this.mousePos.y = 1 - e.clientY / this.renderer.domElement.offsetHeight;

      if (!this.prevMousePos) {
        this.prevMousePos = this.mousePos.clone();
      }
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
    if (this.mousePos) {
      const radius = 5;
      let dmX = this.mousePos.x - this.prevMousePos.x;
      let dmY = this.mousePos.y - this.prevMousePos.y;
      dmX = Math.max(-1, Math.min(1, dmX));
      dmY = Math.max(-1, Math.min(1, dmY));

      let mX = this.mousePos.x;
      let mY = this.mousePos.y;
      mX = Math.floor(mX * 32);
      mY = Math.floor(mY * 32);

      const aspect =
        this.renderer.domElement.offsetWidth /
        this.renderer.domElement.offsetHeight;

      const aspectX = aspect > 1 ? 1 : aspect;
      const aspectY = aspect > 1 ? aspect : 1;

      for (let i = 0; i < this.dataTextureSize * this.dataTextureSize; ++i) {
        let r = this.dataTexture.image.data[i * 3];
        let g = this.dataTexture.image.data[i * 3 + 1];
        let b = this.dataTexture.image.data[i * 3 + 2];

        r *= 0.93;
        g *= 0.93;
        b *= 0.93;

        const py = Math.floor(i / this.dataTextureSize);
        const px = i - py * this.dataTextureSize;
        const dx = (mX - px) * aspectX;
        const dy = (mY - py) / aspectY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const f = 1 - d / radius;

        if (d < radius && Math.abs(dmX) > 0 && Math.abs(dmY) > 0) {
          r += dmX * f * f;
          g += dmY * f * f;
        }

        this.dataTexture.image.data[i * 3] = r;
        this.dataTexture.image.data[i * 3 + 1] = g;
        this.dataTexture.image.data[i * 3 + 2] = b;
      }

      this.dataTexture.needsUpdate = true;
      this.prevMousePos.copy(this.mousePos);
    }

    this.render();
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

  private initDataTexture(): void {
    // create a buffer with color data
    const size = this.dataTextureSize * this.dataTextureSize;
    const data = new Float32Array(3 * size);

    for (let i = 0; i < size; i++) {
      const stride = i * 3;
      data[stride] = 0;
      data[stride + 1] = 0;
      data[stride + 2] = 0;
    }

    // used the buffer to create a DataTexture
    this.dataTexture = new DataTexture(
      data,
      this.dataTextureSize,
      this.dataTextureSize,
      RGBFormat,
      FloatType
    );
    this.dataTexture.magFilter = NearestFilter;
    this.dataTexture.minFilter = NearestFilter;
  }

  private getDataTextureIndices(x, y) {
    const red = y * (this.dataTextureSize * 3) + x * 3;
    return [red, red + 1, red + 2];
  }
}
