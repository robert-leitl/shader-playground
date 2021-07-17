import { Bodies, Body, Composite, Engine, Render } from 'matter-js';
import * as Matter from 'matter-js';
import {
    AmbientLight,
    CubeTextureLoader,
    DoubleSide,
    FileLoader,
    Mesh,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    MirroredRepeatWrapping,
    PerspectiveCamera,
    PlaneBufferGeometry,
    PointLight,
    RepeatWrapping,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    TorusBufferGeometry,
    Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CubeTexture } from 'three/src/textures/CubeTexture';
import { MatterAttractors } from './matter-attractor';

class FocusHandler {
    private _index = 0;
    private bodies: Body[];

    constructor(bodies) {
        this.bodies = bodies;
    }

    get index(): number {
        return this._index;
    }

    attractor(bodyA, bodyB) {
        return {
            x: (bodyA.position.x - bodyB.position.x) * 1e-6,
            y: (bodyA.position.y - bodyB.position.y) * 1e-6
        };
    }

    setIndex(newFocusIndex) {
        const currentBody = this.bodies[this._index];
        const newBody = this.bodies[newFocusIndex];

        Body.setStatic(currentBody, false);
        currentBody.plugin.attractors = [];
        currentBody.render.strokeStyle = '#ccc';
        currentBody.render.lineWidth = 1;
        Body.setStatic(newBody, true);
        newBody.render.strokeStyle = '#f44';
        newBody.render.lineWidth = 3;
        newBody.plugin = {
            attractors: [(a, b) => this.attractor(a, b)]
        };

        this._index = newFocusIndex;
    }
}

export class FerrofluidSketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;

    private vertexShader: string;
    private fragmentShader: string;
    private shaderMaterial: ShaderMaterial;
    private extendedMaterial: MeshStandardMaterial;

    private engine: Engine;
    private physicsScale = 280;
    private focusHandler: FocusHandler;
    private ITEM_COUNT = 26;

    //cubemap
    private cubemapPath = 'assets/shared-textures/cube/CoitTower2/';
    private cubemapFormat = '.jpg';
    private cubemapUrls = [
        this.cubemapPath + 'posx' + this.cubemapFormat,
        this.cubemapPath + 'negx' + this.cubemapFormat,
        this.cubemapPath + 'posy' + this.cubemapFormat,
        this.cubemapPath + 'negy' + this.cubemapFormat,
        this.cubemapPath + 'posz' + this.cubemapFormat,
        this.cubemapPath + 'negz' + this.cubemapFormat
    ];
    private cubemapTexture: CubeTexture;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const cubemapLoader: CubeTextureLoader = new CubeTextureLoader();
        const cubemapPromise: Promise<CubeTexture> = new Promise(
            (resolve, reject) => {
                cubemapLoader.load(
                    this.cubemapUrls,
                    (t) => resolve(t),
                    (e) => reject(e)
                );
            }
        );

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/ferrofluid/_fragment.glsl'),
            new FileLoader().loadAsync('assets/ferrofluid/_vertex.glsl'),
            new TextureLoader().loadAsync('assets/shared-textures/img3.jpg'),
            cubemapPromise
        ];

        Promise.all(assets).then((res) => {
            this.fragmentShader = res[0];
            this.vertexShader = res[1];
            this.cubemapTexture = res[3];

            this.init();
        });
    }

    private init(): void {
        this.initPhysics();

        this.camera = new PerspectiveCamera(
            45,
            this.container.offsetWidth / this.container.offsetHeight,
            0.1,
            100
        );
        this.camera.position.z = 2;
        this.camera.position.y = -3;
        this.camera.lookAt(0, 0, 0);
        this.scene = new Scene();

        const light: AmbientLight = new AmbientLight();
        //this.scene.add(light);
        const pointLight = new PointLight(0xffffff, 10);
        pointLight.position.set(0, 5, -10);
        //this.scene.add(pointLight);

        this.initObject();
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container.appendChild(this.renderer.domElement);

        this.updateSize();

        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();

        document.onpointermove = (e) => {
            this.shaderMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.shaderMaterial.uniforms.u_mouse.value.y = e.pageY;
        };

        if (this.oninit) this.oninit();
    }

    initObject(): void {
        const geometry = new PlaneBufferGeometry(2, 2, 180, 180);
        //const geometry = new TorusBufferGeometry(1, 0.4, 24, 128);
        this.shaderMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { value: 1.0 },
                u_resolution: { value: new Vector2() },
                u_mouse: { value: new Vector2() },
                u_itemPositions: {
                    value: Array(this.ITEM_COUNT)
                        .fill(undefined)
                        .map(() => new Vector2())
                }
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        this.extendedMaterial = new MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.5,
            envMap: this.cubemapTexture,
            envMapIntensity: 1,
            roughness: 0.05,
            side: DoubleSide
        });
        this.extendedMaterial.userData.itemPositions = {
            value: Array(this.ITEM_COUNT)
                .fill(undefined)
                .map(() => new Vector2())
        };
        this.extendedMaterial.onBeforeCompile = (shader, renderer) => {
            shader.uniforms.u_itemPositions = this.extendedMaterial.userData.itemPositions;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `
                #include <common>
                
                varying vec2 v_uv;
                varying vec3 v_normal;
                varying vec3 v_world_position;
                varying vec3 v_world_normal;
                
                uniform vec2 u_itemPositions[${this.ITEM_COUNT}];
                
                float almostUnitIdentity( float x ) {
                    return x*x*(2.0-x);
                }
                
                float almostIdentity( float x, float n ) {
                    return sqrt(x*x+n);
                }
                
                float circularEaseOut (float x){
                  float y = sqrt(1. - pow(1. - x, 2.));
                  return y;
                }
                
                vec3 vertex_distort(vec3 pos) {
                    vec3 distorted = vec3(pos);
                    
                    float MAX_HEIGHT = 0.7;
                    float m_dist = 1.;
                    vec3 nPoint = vec3(0.);
                    float d, falloff;
                    vec2 bending = vec2(0., 0.);
                    for (int i = 0; i < ${this.ITEM_COUNT}; i++) {
                        float dist = distance(pos.xy, u_itemPositions[i] * 2. - 1.);
                        if (m_dist > dist) {
                            m_dist = dist;
                            nPoint = vec3(u_itemPositions[i] * 2. - 1., 1.);
                        }
                    }
                    d = length(pos);
                    falloff = smoothstep(0., 0.95, .9 - d) * MAX_HEIGHT;
                    nPoint.z *= falloff;
                    /*distorted.z = smoothstep(1., 0., m_dist / 0.22) * falloff;
                    bending = pos.xy * d * (distorted.z / MAX_HEIGHT) * 2.5;
                    distorted.xy += bending;*/
                    
                    float nPointD = length(nPoint.xy) * 0.5;
                    falloff = smoothstep(0., 0.95, .9 - d) * MAX_HEIGHT;
                    falloff = max(0.1, circularEaseOut(.8 - d)) * MAX_HEIGHT * smoothstep(.9, .6, d) ;
                    distorted.z = (1. - max(0., almostIdentity((m_dist * 50.), 1.) / 12.)) * falloff;
                    bending = pos.xy * nPointD * (distorted.z / MAX_HEIGHT) * 1.;
                    distorted.xy += bending;
                    
                    return distorted;
                }
                `
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <defaultnormal_vertex>',
                `
                    // source: https://observablehq.com/@k9/calculating-normals-for-distorted-vertices
                    float tangentFactor = 0.03;
                    
                    // tangents can be hardcoded, because we know that a plane is used
                    vec3 tangent1 = vec3(0., 1., 0.);
                    vec3 tangent2 = vec3(1., 0., 0.);
                    vec3 nearby1 = position + tangent1 * tangentFactor;
                    vec3 nearby2 = position + tangent2 * tangentFactor;
                    vec3 distorted1 = vertex_distort(nearby1);
                    vec3 distorted2 = vertex_distort(nearby2);
                    vec3 distortedPosition = vertex_distort(position);
                
                    objectNormal = normalize(cross(distorted1 - distortedPosition, distorted2 - distortedPosition));
                    v_normal = vec3(objectNormal);
                    
                    #include <defaultnormal_vertex>
                `
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <uv_vertex>',
                `
                v_uv = uv;
                `
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                vec3 transformed = distortedPosition;
                `
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <project_vertex>',
                `
                #include <project_vertex>
                v_world_position = (modelMatrix * vec4(position, 1.0)).xyz;
                v_world_normal = mat3(modelMatrix) * normalize(objectNormal);
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `
                #include <common>
                
                varying vec2 v_uv;
                varying vec3 v_normal;
                varying vec3 v_world_position;
                varying vec3 v_world_normal;
                
                vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
                    return a + b*cos( 6.28318*(c*t+d) );
                }
                
                `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <tonemapping_fragment>',
                `
                #include <tonemapping_fragment>
                vec2 uv = v_uv * 2. - 1.;
                float falloff = length(uv);
                vec4 color = vec4(gl_FragColor);
                
                vec3 viewWorldDir = normalize(v_world_position - cameraPosition);
                float i = abs(dot(viewWorldDir, normalize(v_world_normal)));
                float t = sin((1.0 - i) * 6.) * .5 + .5;
                float fresnel = max(.1, pow(1. - i, 5.) * 0.3) * 0.5;
                
                vec3 p1_a = vec3(0.5, 0.5, 0.5);
                vec3 p1_b = vec3(0.5, 0.5, 0.5);
                vec3 p1_c = vec3(2.0, 1.0, 0.0);
                vec3 p1_d = vec3(0.50, 0.20, 0.25);
                
                vec3 p2_a = vec3(0.5, 0.5, 0.5);
                vec3 p2_b = vec3(0.5, 0.5, 0.5);
                vec3 p2_c = vec3(1.0, 1.0, 1.0);
                vec3 p2_d = vec3(0.00, 0.33, 0.67);
                
                vec3 p3_a = vec3(0.8, 0.5, 0.4);
                vec3 p3_b = vec3(0.2, 0.4, 0.2);
                vec3 p3_c = vec3(2.0, 1.0, 1.0);
                vec3 p3_d = vec3(0.00, 0.25, 0.25);
                
                color += vec4(palette(t, p2_a, p2_b, p2_c, p2_d), 1.) * fresnel;
                color *= 1. - pow(falloff, 3.);
                
                gl_FragColor = color;
                `
            );
        };

        this.extendedMaterial.needsUpdate = true;

        const mesh = new Mesh(geometry, this.extendedMaterial);
        this.scene.add(mesh);
    }

    initPhysics(): void {
        Matter.Plugin.register(MatterAttractors);
        Matter.use('matter-attractors');

        const width = this.physicsScale;
        const height = this.physicsScale;
        this.engine = Engine.create();
        this.engine.gravity.scale = 0;

        // debugging renderer
        /*const render = Render.create({
            element: this.container,
            engine: this.engine,
            options: {
                width: width,
                height: height,
                wireframes: false
            }
        });
        render.canvas.style.position = 'absolute';
        render.canvas.style.bottom = '0';
        render.canvas.style.left = '0';
        render.canvas.style.zIndex = '1000';
        Render.run(render);*/

        const COUNT = this.ITEM_COUNT;
        const RADIUS = 20;
        const MASS = 0.015;
        for (let i = 0; i < COUNT; i++) {
            const body = Bodies.circle(
                Math.random() * width,
                Math.random() * height,
                RADIUS + Math.random() * 2,
                {
                    mass: MASS,
                    friction: 0,
                    frictionAir: 0.025,
                    restitution: 0
                }
            );
            body.render.fillStyle = 'none';
            body.render.lineWidth = 1;
            Composite.add(this.engine.world, body);
        }

        this.focusHandler = new FocusHandler(this.engine.world.bodies);
        this.focusHandler.setIndex(0);

        document.body.addEventListener('pointerdown', () => {
            let newFocusIndex = this.focusHandler.index + 1;
            if (newFocusIndex >= 8) newFocusIndex = 0;
            this.focusHandler.setIndex(newFocusIndex);
        });
    }

    private updatePhysics(): void {
        const currentBody = this.engine.world.bodies[this.focusHandler.index];

        Body.translate(currentBody, {
            x: (this.physicsScale / 2 - currentBody.position.x) * 0.15,
            y: (this.physicsScale / 2 - currentBody.position.y) * 0.15
        });

        Engine.update(this.engine, 1000 / 60);
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

        this.updatePhysics();

        // apply the physics body positions to the shader uniform
        this.engine.world.bodies.forEach((body, i) =>
            (this.extendedMaterial.userData.itemPositions.value[i] as Vector2)
                .set(body.position.x, this.physicsScale - body.position.y)
                .divideScalar(this.physicsScale)
        );

        this.controls.update();
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
