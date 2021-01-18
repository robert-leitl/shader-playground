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
import { TweenMax, Power4 } from 'gsap';

export class ImageTransition1Sketch {
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
	private t2: Texture;
	private t3: Texture;

	private fromT: Texture;
	private toT: Texture;

	constructor(container: HTMLElement) {
		this.container = container;

		const assets: Promise<any>[] = [
			(new FileLoader()).loadAsync('assets/image-transition-1/_fragment.glsl'),
			(new FileLoader()).loadAsync('assets/image-transition-1/_vertex.glsl'),
			(new TextureLoader()).loadAsync('assets/image-transition-1/img1.jpg'),
			(new TextureLoader()).loadAsync('assets/image-transition-1/img2.jpg'),
			(new TextureLoader()).loadAsync('assets/image-transition-1/img3.jpg')
		];

		Promise.all(assets).then((res) => {

			this.fragmentShader = res[0];
			this.vertexShader = res[1];
			this.t1 = res[2];
			this.t2 = res[3];
			this.t3 = res[4];

			this.init();
		});
	}

	private init(): void {
		this.camera = new PerspectiveCamera( 45, this.container.offsetWidth / this.container.offsetHeight, 0.1, 100 );
		this.camera.position.z = 2;
		this.scene = new Scene();
		const geometry = new PlaneBufferGeometry( 2, 2 );

		this.fromT = this.t1;
		this.toT = this.t2;

		this.uniforms = {
			u_time: { type: '', value: 1.0 },
			u_progress: { type: 'f', value: 0.},
			u_resolution: { type: 'v2', value: new Vector2() },
			u_mouse: { type: 'v2', value: new Vector2() },
			u_t1: { type: 't', value: this.fromT},
			u_t2: { type: 't', value: this.toT},
			u_t1Aspect: {type: 'v2', value: this.getCoverAspectRatio(this.fromT, this.container)},
			u_t2Aspect: {type: 'v2', value: this.getCoverAspectRatio(this.toT, this.container)}
		};

		const material = new ShaderMaterial( {
			uniforms: this.uniforms,
			vertexShader: this.vertexShader,
			fragmentShader: this.fragmentShader
		} );

		const mesh = new Mesh( geometry, material );
		this.scene.add( mesh );

		this.renderer = new WebGLRenderer();
		this.renderer.setPixelRatio( window.devicePixelRatio );

		this.container.appendChild( this.renderer.domElement );

		this.updateSize();


		document.onmousemove = (e) => {
			this.uniforms.u_mouse.value.x = e.pageX
			this.uniforms.u_mouse.value.y = e.pageY
		}

		if (this.oninit) this.oninit();
	}

	public updateSize(): void {
		this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight );
		this.uniforms.u_resolution.value.x = this.renderer.domElement.width;
		this.uniforms.u_resolution.value.y = this.renderer.domElement.height;
		this.uniforms.u_t1Aspect.value = this.getCoverAspectRatio(this.fromT, this.container);
		this.uniforms.u_t2Aspect.value = this.getCoverAspectRatio(this.toT, this.container);
		this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
		this.camera.updateProjectionMatrix();
	}

	public animate(): void {
		this.render();
		requestAnimationFrame( () => this.animate() );
	}

	public render(): void {
		this.uniforms.u_time.value += 0.05;
		this.renderer.render( this.scene, this.camera );
	}

	public setImage(index: number): void {
		if (!this.uniforms) return;

		this.fromT = this.toT;
		this.toT = this[`t${index + 1}`];
		this.uniforms.u_t1.value = this.fromT;
		this.uniforms.u_t2.value = this.toT;
		this.uniforms.u_t1Aspect.value = this.getCoverAspectRatio(this.fromT, this.container);
		this.uniforms.u_t2Aspect.value = this.getCoverAspectRatio(this.toT, this.container);

		TweenMax.fromTo(this.uniforms.u_progress, .4, {value: 0}, {value: 1, ease: Power4.easeOut});
	}

	private getCoverAspectRatio(t: Texture, container: HTMLElement): Vector2 {
		const imgAspect: number = t.image.width / t.image.height;
		const containerAspect: number = container.offsetWidth / container.offsetHeight;

		if (imgAspect > containerAspect) {
			return new Vector2(containerAspect / imgAspect, 1.);
		} else {
			return new Vector2(1., imgAspect / containerAspect);
		}
	}
}
