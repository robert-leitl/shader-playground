import {
    ClampToEdgeWrapping,
    DataTexture,
    DoubleSide,
    FileLoader,
    LinearFilter,
    Mesh,
    OrthographicCamera,
    PerspectiveCamera,
    PlaneBufferGeometry,
    RGBFormat,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    UnsignedByteType,
    UVMapping,
    Vector2,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface WaveLayer {
    color: number[];
    noiseFreq: number[];
    noiseSpeed: number;
    noiseFlow: number;
    noiseSeed: number;
    noiseFloor: number;
    noiseCeil: number;
}

export class Gradient1Sketch {
    public oninit: Function;

    private container: HTMLElement;
    private camera: OrthographicCamera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private controls: OrbitControls;

    private gradientMaterial: ShaderMaterial;
    private vertexShader: string;
    private fragmentShader: string;
    private colorRampTexture: Texture;

    private isDestroyed: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;

        const assets: Promise<any>[] = [
            new FileLoader().loadAsync('assets/gradient-1/_fragment.glsl'),
            new FileLoader().loadAsync('assets/gradient-1/_vertex.glsl')
        ];

        Promise.all(assets).then((res) => {
            this.fragmentShader = res[0];
            this.vertexShader = res[1];

            this.init();
        });
    }

    private init(): void {
        this.camera = new OrthographicCamera(-1, 1, -1, 1);
        this.camera.position.z = -2;
        this.scene = new Scene();

        this.initGradientNoiseBackground();

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
            this.gradientMaterial.uniforms.u_mouse.value.x = e.pageX;
            this.gradientMaterial.uniforms.u_mouse.value.y = e.pageY;
        };

        if (this.oninit) this.oninit();
    }

    private initGradientNoiseBackground(): void {
        const geometry = new PlaneBufferGeometry(2, 2, 128, 128);

        // init the wave layers uniform structs
        const colorA: number[] = [49, 63, 155];
        const colorB: number[] = [134, 218, 213];
        const colorC: number[] = [168, 231, 148];
        const colorD: number[] = [226, 87, 112];
        const colorE: number[] = [254, 232, 103];
        const colors: number[][] = [colorA, colorB, colorC, colorB];
        const waveLayers: WaveLayer[] = colors.map((c, i) => ({
            color: c,
            noiseFreq: [(i / colors.length) * 0.5, 1.5 * (i / colors.length)],
            noiseSpeed: 11 + 0.3 * i,
            noiseFlow: 0.3 * i,
            noiseSeed: 10 * i,
            noiseFloor: 0.1,
            noiseCeil: 0.83 + 0.07 * i
        }));

        this.gradientMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_wave_layers: {
                    value: waveLayers
                },
                u_active_colors: { type: 'v4', value: [1, 1, 1, 1] } as any,
                u_base_color: { type: 'v3', value: colorA } as any
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            side: DoubleSide,
            depthTest: false,
            depthWrite: false
        });
        const mesh = new Mesh(geometry, this.gradientMaterial);
        this.scene.add(mesh);
    }

    private initGradientBackground(): void {
        const geometry = new PlaneBufferGeometry(2, 2);

        // create the color ramp texture
        const colorA: number[] = [49, 63, 155];
        const colorB: number[] = [134, 218, 213];
        const colorC: number[] = [168, 231, 148];
        const colorD: number[] = [226, 87, 112];
        const colorE: number[] = [254, 232, 103];
        const colors: number[][] = [colorA, colorB, colorC, colorD, colorE];
        const colorData: Uint8Array = new Uint8Array(
            colors.reduce((arr, cc) => {
                return [...arr, ...cc.map((c) => c)];
            }, [])
        );
        this.colorRampTexture = new DataTexture(
            colorData,
            colors.length,
            1,
            RGBFormat,
            UnsignedByteType,
            UVMapping,
            ClampToEdgeWrapping,
            ClampToEdgeWrapping,
            LinearFilter,
            LinearFilter
        );

        this.gradientMaterial = new ShaderMaterial({
            uniforms: {
                u_time: { type: '', value: 1.0 } as any,
                u_resolution: { type: 'v2', value: new Vector2() } as any,
                u_mouse: { type: 'v2', value: new Vector2() } as any,
                u_colorRamp: { type: 't', value: this.colorRampTexture } as any
            },
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        const mesh = new Mesh(geometry, this.gradientMaterial);
        this.scene.add(mesh);
    }

    public updateSize(): void {
        this.renderer.setSize(
            this.container.offsetWidth,
            this.container.offsetHeight
        );

        const w = this.renderer.domElement.width;
        const h = this.renderer.domElement.height;

        this.gradientMaterial.uniforms.u_resolution.value.x = w;
        this.gradientMaterial.uniforms.u_resolution.value.y = h;
        /*this.camera.left = w / -2;
        this.camera.right = w / 2;
        this.camera.top = h / 2;
        this.camera.bottom = h / -2;*/
        this.camera.updateProjectionMatrix();
    }

    public animate(): void {
        if (this.isDestroyed) return;

        this.controls.update();
        this.render();

        requestAnimationFrame(() => this.animate());
    }

    public render(): void {
        this.gradientMaterial.uniforms.u_time.value += 0.05;
        this.renderer.clearDepth();
        this.renderer.render(this.scene, this.camera);
    }

    public destroy(): void {
        this.isDestroyed = true;
    }
}

/////////////////////////// stripe.com gradient

/*

--gradientColorZero: #a960ee;
    --gradientColorOne: #ff333d;
    --gradientColorTwo: #90e0ff;
    --gradientColorThree: #ffcb57;


    --angleNormal: -6deg;
    --angleStrong: -12deg;
    --angleNormalSin: 0.106;
    --angleStrongSin: 0.212;
 */
/*
class r {
    constructor(e, t, n, i = !1) {
        const s = this,
            o =
                -1 !==
                document.location.search.toLowerCase().indexOf('debug=webgl');
        (s.canvas = e),
            (s.gl = s.canvas.getContext('webgl', {
                antialias: !0
            })),
            (s.meshes = []);
        const r = s.gl;
        t && n && this.setSize(t, n),
            s.lastDebugMsg,
            (s.debug =
                i && o
                    ? function (e) {
                          const t = new Date();
                          t - s.lastDebugMsg > 1e3 && console.log('---'),
                              console.log(
                                  t.toLocaleTimeString() +
                                      Array(Math.max(0, 32 - e.length)).join(
                                          ' '
                                      ) +
                                      e +
                                      ': ',
                                  ...Array.from(arguments).slice(1)
                              ),
                              (s.lastDebugMsg = t);
                      }
                    : () => {}),
            Object.defineProperties(s, {
                Material: {
                    enumerable: !1,
                    value: class {
                        constructor(e, t, n = {}) {
                            const i = this;
                            function o(e, t) {
                                const n = r.createShader(e);
                                return (
                                    r.shaderSource(n, t),
                                    r.compileShader(n),
                                    r.getShaderParameter(n, r.COMPILE_STATUS) ||
                                        console.error(r.getShaderInfoLog(n)),
                                    s.debug('Material.compileShaderSource', {
                                        source: t
                                    }),
                                    n
                                );
                            }
                            function a(e, t) {
                                return Object.entries(e)
                                    .map(([e, n]) => n.getDeclaration(e, t))
                                    .join('\n');
                            }
                            (i.uniforms = n), (i.uniformInstances = []);
                            const l =
                                '\n              precision highp float;\n            ';
                            (i.vertexSource = `\n              ${l}\n              attribute vec4 position;\n              attribute vec2 uv;\n              attribute vec2 uvNorm;\n              ${a(
                                s.commonUniforms,
                                'vertex'
                            )}\n              ${a(
                                n,
                                'vertex'
                            )}\n              ${e}\n            `),
                                (i.fragmentSource = `\n              ${l}\n              ${a(
                                    s.commonUniforms,
                                    'fragment'
                                )}\n              ${a(
                                    n,
                                    'fragment'
                                )}\n              ${t}\n            `),
                                (i.vertexShader = o(
                                    r.VERTEX_SHADER,
                                    i.vertexSource
                                )),
                                (i.fragmentShader = o(
                                    r.FRAGMENT_SHADER,
                                    i.fragmentSource
                                )),
                                (i.program = r.createProgram()),
                                r.attachShader(i.program, i.vertexShader),
                                r.attachShader(i.program, i.fragmentShader),
                                r.linkProgram(i.program),
                                r.getProgramParameter(
                                    i.program,
                                    r.LINK_STATUS
                                ) ||
                                    console.error(
                                        r.getProgramInfoLog(i.program)
                                    ),
                                r.useProgram(i.program),
                                i.attachUniforms(void 0, s.commonUniforms),
                                i.attachUniforms(void 0, i.uniforms);
                        }
                        attachUniforms(e, t) {
                            const n = this;
                            void 0 === e
                                ? Object.entries(t).forEach(([e, t]) => {
                                      n.attachUniforms(e, t);
                                  })
                                : 'array' == t.type
                                ? t.value.forEach((t, i) =>
                                      n.attachUniforms(`${e}[${i}]`, t)
                                  )
                                : 'struct' == t.type
                                ? Object.entries(t.value).forEach(([t, i]) =>
                                      n.attachUniforms(`${e}.${t}`, i)
                                  )
                                : (s.debug('Material.attachUniforms', {
                                      name: e,
                                      uniform: t
                                  }),
                                  n.uniformInstances.push({
                                      uniform: t,
                                      location: r.getUniformLocation(
                                          n.program,
                                          e
                                      )
                                  }));
                        }
                    }
                },
                Uniform: {
                    enumerable: !1,
                    value: class {
                        constructor(e) {
                            (this.type = 'float'), Object.assign(this, e);
                            (this.typeFn =
                                {
                                    float: '1f',
                                    int: '1i',
                                    vec2: '2fv',
                                    vec3: '3fv',
                                    vec4: '4fv',
                                    mat4: 'Matrix4fv'
                                }[this.type] || '1f'),
                                this.update();
                        }
                        update(e) {
                            void 0 !== this.value &&
                                r['uniform' + this.typeFn](
                                    e,
                                    0 === this.typeFn.indexOf('Matrix')
                                        ? this.transpose
                                        : this.value,
                                    0 === this.typeFn.indexOf('Matrix')
                                        ? this.value
                                        : null
                                );
                        }
                        getDeclaration(e, t, n) {
                            const i = this;
                            if (i.excludeFrom !== t) {
                                if ('array' === i.type)
                                    return (
                                        i.value[0].getDeclaration(
                                            e,
                                            t,
                                            i.value.length
                                        ) +
                                        `\nconst int ${e}_length = ${i.value.length};`
                                    );
                                if ('struct' === i.type) {
                                    let s = e.replace('u_', '');
                                    return (
                                        (s =
                                            s.charAt(0).toUpperCase() +
                                            s.slice(1)),
                                        `uniform struct ${s} {\n` +
                                            Object.entries(i.value)
                                                .map(([e, n]) =>
                                                    n
                                                        .getDeclaration(e, t)
                                                        .replace(/^uniform/, '')
                                                )
                                                .join('') +
                                            `\n} ${e}${n > 0 ? `[${n}]` : ''};`
                                    );
                                }
                                return `uniform ${i.type} ${e}${
                                    n > 0 ? `[${n}]` : ''
                                };`;
                            }
                        }
                    }
                },
                PlaneGeometry: {
                    enumerable: !1,
                    value: class {
                        constructor(e, t, n, i, o) {
                            r.createBuffer(),
                                (this.attributes = {
                                    position: new s.Attribute({
                                        target: r.ARRAY_BUFFER,
                                        size: 3
                                    }),
                                    uv: new s.Attribute({
                                        target: r.ARRAY_BUFFER,
                                        size: 2
                                    }),
                                    uvNorm: new s.Attribute({
                                        target: r.ARRAY_BUFFER,
                                        size: 2
                                    }),
                                    index: new s.Attribute({
                                        target: r.ELEMENT_ARRAY_BUFFER,
                                        size: 3,
                                        type: r.UNSIGNED_SHORT
                                    })
                                }),
                                this.setTopology(n, i),
                                this.setSize(e, t, o);
                        }
                        setTopology(e = 1, t = 1) {
                            const n = this;
                            (n.xSegCount = e),
                                (n.ySegCount = t),
                                (n.vertexCount =
                                    (n.xSegCount + 1) * (n.ySegCount + 1)),
                                (n.quadCount = n.xSegCount * n.ySegCount * 2),
                                (n.attributes.uv.values = new Float32Array(
                                    2 * n.vertexCount
                                )),
                                (n.attributes.uvNorm.values = new Float32Array(
                                    2 * n.vertexCount
                                )),
                                (n.attributes.index.values = new Uint16Array(
                                    3 * n.quadCount
                                ));
                            for (let e = 0; e <= n.ySegCount; e++)
                                for (let t = 0; t <= n.xSegCount; t++) {
                                    const i = e * (n.xSegCount + 1) + t;
                                    if (
                                        ((n.attributes.uv.values[2 * i] =
                                            t / n.xSegCount),
                                        (n.attributes.uv.values[2 * i + 1] =
                                            1 - e / n.ySegCount),
                                        (n.attributes.uvNorm.values[2 * i] =
                                            (t / n.xSegCount) * 2 - 1),
                                        (n.attributes.uvNorm.values[2 * i + 1] =
                                            1 - (e / n.ySegCount) * 2),
                                        t < n.xSegCount && e < n.ySegCount)
                                    ) {
                                        const s = e * n.xSegCount + t;
                                        (n.attributes.index.values[6 * s] = i),
                                            (n.attributes.index.values[
                                                6 * s + 1
                                            ] = i + 1 + n.xSegCount),
                                            (n.attributes.index.values[
                                                6 * s + 2
                                            ] = i + 1),
                                            (n.attributes.index.values[
                                                6 * s + 3
                                            ] = i + 1),
                                            (n.attributes.index.values[
                                                6 * s + 4
                                            ] = i + 1 + n.xSegCount),
                                            (n.attributes.index.values[
                                                6 * s + 5
                                            ] = i + 2 + n.xSegCount);
                                    }
                                }
                            n.attributes.uv.update(),
                                n.attributes.uvNorm.update(),
                                n.attributes.index.update(),
                                s.debug('Geometry.setTopology', {
                                    uv: n.attributes.uv,
                                    uvNorm: n.attributes.uvNorm,
                                    index: n.attributes.index
                                });
                        }
                        setSize(e = 1, t = 1, n = 'xz') {
                            const i = this;
                            (i.width = e),
                                (i.height = t),
                                (i.orientation = n),
                                (i.attributes.position.values &&
                                    i.attributes.position.values.length ===
                                        3 * i.vertexCount) ||
                                    (i.attributes.position.values = new Float32Array(
                                        3 * i.vertexCount
                                    ));
                            const o = e / -2,
                                r = t / -2,
                                a = e / i.xSegCount,
                                l = t / i.ySegCount;
                            for (let e = 0; e <= i.ySegCount; e++) {
                                const t = r + e * l;
                                for (let s = 0; s <= i.xSegCount; s++) {
                                    const r = o + s * a,
                                        l = e * (i.xSegCount + 1) + s;
                                    (i.attributes.position.values[
                                        3 * l + 'xyz'.indexOf(n[0])
                                    ] = r),
                                        (i.attributes.position.values[
                                            3 * l + 'xyz'.indexOf(n[1])
                                        ] = -t);
                                }
                            }
                            i.attributes.position.update(),
                                s.debug('Geometry.setSize', {
                                    position: i.attributes.position
                                });
                        }
                    }
                },
                Mesh: {
                    enumerable: !1,
                    value: class {
                        constructor(e, t) {
                            const n = this;
                            (n.geometry = e),
                                (n.material = t),
                                (n.wireframe = !1),
                                (n.attributeInstances = []),
                                Object.entries(n.geometry.attributes).forEach(
                                    ([e, t]) => {
                                        n.attributeInstances.push({
                                            attribute: t,
                                            location: t.attach(
                                                e,
                                                n.material.program
                                            )
                                        });
                                    }
                                ),
                                s.meshes.push(n),
                                s.debug('Mesh.constructor', {
                                    mesh: n
                                });
                        }
                        draw() {
                            r.useProgram(this.material.program),
                                this.material.uniformInstances.forEach(
                                    ({ uniform: e, location: t }) => e.update(t)
                                ),
                                this.attributeInstances.forEach(
                                    ({ attribute: e, location: t }) => e.use(t)
                                ),
                                r.drawElements(
                                    this.wireframe ? r.LINES : r.TRIANGLES,
                                    this.geometry.attributes.index.values
                                        .length,
                                    r.UNSIGNED_SHORT,
                                    0
                                );
                        }
                        remove() {
                            s.meshes = s.meshes.filter((e) => e != this);
                        }
                    }
                },
                Attribute: {
                    enumerable: !1,
                    value: class {
                        constructor(e) {
                            (this.type = r.FLOAT),
                                (this.normalized = !1),
                                (this.buffer = r.createBuffer()),
                                Object.assign(this, e),
                                this.update();
                        }
                        update() {
                            void 0 !== this.values &&
                                (r.bindBuffer(this.target, this.buffer),
                                r.bufferData(
                                    this.target,
                                    this.values,
                                    r.STATIC_DRAW
                                ));
                        }
                        attach(e, t) {
                            const n = r.getAttribLocation(t, e);
                            return (
                                this.target === r.ARRAY_BUFFER &&
                                    (r.enableVertexAttribArray(n),
                                    r.vertexAttribPointer(
                                        n,
                                        this.size,
                                        this.type,
                                        this.normalized,
                                        0,
                                        0
                                    )),
                                n
                            );
                        }
                        use(e) {
                            r.bindBuffer(this.target, this.buffer),
                                this.target === r.ARRAY_BUFFER &&
                                    (r.enableVertexAttribArray(e),
                                    r.vertexAttribPointer(
                                        e,
                                        this.size,
                                        this.type,
                                        this.normalized,
                                        0,
                                        0
                                    ));
                        }
                    }
                }
            });
        const a = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        s.commonUniforms = {
            projectionMatrix: new s.Uniform({
                type: 'mat4',
                value: a
            }),
            modelViewMatrix: new s.Uniform({
                type: 'mat4',
                value: a
            }),
            resolution: new s.Uniform({
                type: 'vec2',
                value: [1, 1]
            }),
            aspectRatio: new s.Uniform({
                type: 'float',
                value: 1
            })
        };
    }
    setSize(e = 640, t = 480) {
        (this.width = e),
            (this.height = t),
            (this.canvas.width = e),
            (this.canvas.height = t),
            this.gl.viewport(0, 0, e, t),
            (this.commonUniforms.resolution.value = [e, t]),
            (this.commonUniforms.aspectRatio.value = e / t),
            this.debug('MiniGL.setSize', {
                width: e,
                height: t
            });
    }
    setOrthographicCamera(e = 0, t = 0, n = 0, i = -2e3, s = 2e3) {
        (this.commonUniforms.projectionMatrix.value = [
            2 / this.width,
            0,
            0,
            0,
            0,
            2 / this.height,
            0,
            0,
            0,
            0,
            2 / (i - s),
            0,
            e,
            t,
            n,
            1
        ]),
            this.debug(
                'setOrthographicCamera',
                this.commonUniforms.projectionMatrix.value
            );
    }
    render() {
        this.gl.clearColor(0, 0, 0, 0),
            this.gl.clearDepth(1),
            this.meshes.forEach((e) => e.draw());
    }
}
function a(e) {
    return [((e >> 16) & 255) / 255, ((e >> 8) & 255) / 255, (255 & e) / 255];
}
['SCREEN', 'LINEAR_LIGHT'].reduce(
    (e, t, n) =>
        Object.assign(e, {
            [t]: n
        }),
    {}
);
n.register(
    'Gradient',
    class extends i {
        constructor(...t) {
            super(...t),
                e(this, 'el', void 0),
                e(this, 'cssVarRetries', 0),
                e(this, 'maxCssVarRetries', 200),
                e(this, 'angle', 0),
                e(this, 'isLoadedClass', !1),
                e(this, 'isScrolling', !1),
                e(this, 'isStatic', o.disableAmbientAnimations()),
                e(this, 'isGPUDisabled', o.disableGPUAnimations()),
                e(this, 'scrollingTimeout', void 0),
                e(this, 'scrollingRefreshDelay', 200),
                e(this, 'isIntersecting', !1),
                e(this, 'shaderFiles', void 0),
                e(this, 'vertexShader', void 0),
                e(this, 'sectionColors', void 0),
                e(this, 'computedCanvasStyle', void 0),
                e(this, 'conf', void 0),
                e(this, 'uniforms', void 0),
                e(this, 't', 1253106),
                e(this, 'last', 0),
                e(this, 'width', void 0),
                e(this, 'minWidth', 1111),
                e(this, 'height', 600),
                e(this, 'xSegCount', void 0),
                e(this, 'ySegCount', void 0),
                e(this, 'mesh', void 0),
                e(this, 'material', void 0),
                e(this, 'geometry', void 0),
                e(this, 'minigl', void 0),
                e(this, 'scrollObserver', void 0),
                e(this, 'amp', 320),
                e(this, 'seed', 5),
                e(this, 'freqX', 14e-5),
                e(this, 'freqY', 29e-5),
                e(this, 'freqDelta', 1e-5),
                e(this, 'activeColors', [1, 1, 1, 1]),
                e(this, 'konamiCode', [
                    'arrowup',
                    'arrowup',
                    'arrowdown',
                    'arrowdown',
                    'arrowleft',
                    'arrowright',
                    'arrowleft',
                    'arrowright',
                    'b',
                    'a'
                ]),
                e(this, 'konamiIndex', 0),
                e(this, 'isMetaKey', !1),
                e(this, 'isGradientLegendVisible', !1),
                e(this, 'isMouseDown', !1),
                e(this, 'handleScroll', () => {
                    clearTimeout(this.scrollingTimeout),
                        (this.scrollingTimeout = setTimeout(
                            this.handleScrollEnd,
                            this.scrollingRefreshDelay
                        )),
                        this.isGradientLegendVisible &&
                            this.hideGradientLegend(),
                        this.conf.playing &&
                            ((this.isScrolling = !0), this.pause());
                }),
                e(this, 'handleScrollEnd', () => {
                    (this.isScrolling = !1), this.isIntersecting && this.play();
                }),
                e(this, 'resize', () => {
                    (this.width = window.innerWidth),
                        this.minigl.setSize(this.width, this.height),
                        this.minigl.setOrthographicCamera(),
                        (this.xSegCount = Math.ceil(
                            this.width * this.conf.density[0]
                        )),
                        (this.ySegCount = Math.ceil(
                            this.height * this.conf.density[1]
                        )),
                        this.mesh.geometry.setTopology(
                            this.xSegCount,
                            this.ySegCount
                        ),
                        this.mesh.geometry.setSize(this.width, this.height),
                        (this.mesh.material.uniforms.u_shadow_power.value =
                            this.width < 600 ? 5 : 6);
                }),
                e(this, 'handleMouseDown', (e) => {
                    this.isGradientLegendVisible &&
                        ((this.isMetaKey = e.metaKey),
                        (this.isMouseDown = !0),
                        !1 === this.conf.playing &&
                            requestAnimationFrame(this.animate));
                }),
                e(this, 'handleMouseUp', () => {
                    this.isMouseDown = !1;
                }),
                e(this, 'handleKeyDown', (e) => {
                    if ((this.checkKonami(e), this.isGradientLegendVisible)) {
                        switch (e.key) {
                            case '1':
                                this.toggleColor(1);
                                break;
                            case '2':
                                this.toggleColor(2);
                                break;
                            case '3':
                                this.toggleColor(3);
                                break;
                            case '4':
                                this.toggleColor(0);
                                break;
                            case '-':
                                this.updateFrequency(this.freqDelta);
                                break;
                            case '+':
                                this.updateFrequency(-this.freqDelta);
                                break;
                            case '_':
                                this.updateFrequency(this.freqDelta);
                                break;
                            case '=':
                                this.updateFrequency(-this.freqDelta);
                                break;
                            case 'p':
                                this.conf.playing ? this.pause() : this.play();
                                break;
                            case 'ArrowUp':
                                e.preventDefault(), (this.amp += 10);
                                break;
                            case 'ArrowDown':
                                e.preventDefault(), (this.amp -= 10);
                                break;
                            case 'ArrowLeft':
                                this.freqX += this.freqDelta;
                                break;
                            case 'ArrowRight':
                                this.freqX -= this.freqDelta;
                        }
                        (this.mesh.material.uniforms.u_vertDeform.value.noiseAmp.value = this.amp),
                            (this.mesh.material.uniforms.u_global.value.noiseFreq.value = [
                                this.freqX,
                                this.freqY
                            ]),
                            (this.mesh.material.uniforms.u_active_colors.value = this.activeColors),
                            this.minigl.render();
                    }
                }),
                e(this, 'animate', (e) => {
                    if (!this.shouldSkipFrame(e) || this.isMouseDown) {
                        if (
                            ((this.t += Math.min(e - this.last, 1e3 / 15)),
                            (this.last = e),
                            this.isMouseDown)
                        ) {
                            let e = 160;
                            this.isMetaKey && (e = -160), (this.t += e);
                        }
                        (this.mesh.material.uniforms.u_time.value = this.t),
                            this.minigl.render();
                    }
                    if (0 !== this.last && this.isStatic)
                        return this.minigl.render(), void this.disconnect();
                    ((this.isIntersecting && this.conf.playing) ||
                        this.isMouseDown) &&
                        requestAnimationFrame(this.animate);
                }),
                e(this, 'addIsLoadedClass', () => {
                    this.isIntersecting &&
                        !this.isLoadedClass &&
                        ((this.isLoadedClass = !0),
                        this.el.classList.add('isLoaded'),
                        setTimeout(() => {
                            this.el.parentElement.classList.add('isLoaded');
                        }, 3e3));
                }),
                e(this, 'pause', () => {
                    this.conf.playing = !1;
                }),
                e(this, 'play', () => {
                    requestAnimationFrame(this.animate),
                        (this.conf.playing = !0);
                });
        }
        async connect() {
            (this.shaderFiles = {
                vertex:
                    'varying vec3 v_color;\n\nvoid main() {\n  float time = u_time * u_global.noiseSpeed;\n\n  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;\n\n  vec2 st = 1. - uvNorm.xy;\n\n  //\n  // Tilting the plane\n  //\n\n  // Front-to-back tilt\n  float tilt = resolution.y / 2.0 * uvNorm.y;\n\n  // Left-to-right angle\n  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;\n\n  // Up-down shift to offset incline\n  float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);\n\n  //\n  // Vertex noise\n  //\n\n  float noise = snoise(vec3(\n    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,\n    noiseCoord.y * u_vertDeform.noiseFreq.y,\n    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed\n  )) * u_vertDeform.noiseAmp;\n\n  // Fade noise to zero at edges\n  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);\n\n  // Clamp to 0\n  noise = max(0.0, noise);\n\n  vec3 pos = vec3(\n    position.x,\n    position.y + tilt + incline + noise - offset,\n    position.z\n  );\n\n  //\n  // Vertex color, to be passed to fragment shader\n  //\n\n  if (u_active_colors[0] == 1.) {\n    v_color = u_baseColor;\n  }\n\n  for (int i = 0; i < u_waveLayers_length; i++) {\n    if (u_active_colors[i + 1] == 1.) {\n      WaveLayers layer = u_waveLayers[i];\n\n      float noise = smoothstep(\n        layer.noiseFloor,\n        layer.noiseCeil,\n        snoise(vec3(\n          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,\n          noiseCoord.y * layer.noiseFreq.y,\n          time * layer.noiseSpeed + layer.noiseSeed\n        )) / 2.0 + 0.5\n      );\n\n      v_color = blendNormal(v_color, layer.color, pow(noise, 4.));\n    }\n  }\n\n  //\n  // Finish\n  //\n\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);\n}',
                noise:
                    '//\n// Description : Array and textureless GLSL 2D/3D/4D simplex\n//               noise functions.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : stegu\n//     Lastmod : 20110822 (ijm)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n//               https://github.com/stegu/webgl-noise\n//\n\nvec3 mod289(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289(vec4 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute(vec4 x) {\n    return mod289(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nfloat snoise(vec3 v)\n{\n  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n// First corner\n  vec3 i  = floor(v + dot(v, C.yyy) );\n  vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n// Other corners\n  vec3 g = step(x0.yzx, x0.xyz);\n  vec3 l = 1.0 - g;\n  vec3 i1 = min( g.xyz, l.zxy );\n  vec3 i2 = max( g.xyz, l.zxy );\n\n  //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n  //   x1 = x0 - i1  + 1.0 * C.xxx;\n  //   x2 = x0 - i2  + 2.0 * C.xxx;\n  //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n  vec3 x1 = x0 - i1 + C.xxx;\n  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\n// Permutations\n  i = mod289(i);\n  vec4 p = permute( permute( permute(\n            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))\n          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n// Gradients: 7x7 points over a square, mapped onto an octahedron.\n// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n  float n_ = 0.142857142857; // 1.0/7.0\n  vec3  ns = n_ * D.wyz - D.xzx;\n\n  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\n  vec4 x_ = floor(j * ns.z);\n  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n  vec4 x = x_ *ns.x + ns.yyyy;\n  vec4 y = y_ *ns.x + ns.yyyy;\n  vec4 h = 1.0 - abs(x) - abs(y);\n\n  vec4 b0 = vec4( x.xy, y.xy );\n  vec4 b1 = vec4( x.zw, y.zw );\n\n  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n  vec4 s0 = floor(b0)*2.0 + 1.0;\n  vec4 s1 = floor(b1)*2.0 + 1.0;\n  vec4 sh = -step(h, vec4(0.0));\n\n  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n  vec3 p0 = vec3(a0.xy,h.x);\n  vec3 p1 = vec3(a0.zw,h.y);\n  vec3 p2 = vec3(a1.xy,h.z);\n  vec3 p3 = vec3(a1.zw,h.w);\n\n//Normalise gradients\n  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n  p0 *= norm.x;\n  p1 *= norm.y;\n  p2 *= norm.z;\n  p3 *= norm.w;\n\n// Mix final noise value\n  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n  m = m * m;\n  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),\n                                dot(p2,x2), dot(p3,x3) ) );\n}',
                blend:
                    '//\n// https://github.com/jamieowen/glsl-blend\n//\n\n// Normal\n\nvec3 blendNormal(vec3 base, vec3 blend) {\n\treturn blend;\n}\n\nvec3 blendNormal(vec3 base, vec3 blend, float opacity) {\n\treturn (blendNormal(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Screen\n\nfloat blendScreen(float base, float blend) {\n\treturn 1.0-((1.0-base)*(1.0-blend));\n}\n\nvec3 blendScreen(vec3 base, vec3 blend) {\n\treturn vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));\n}\n\nvec3 blendScreen(vec3 base, vec3 blend, float opacity) {\n\treturn (blendScreen(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Multiply\n\nvec3 blendMultiply(vec3 base, vec3 blend) {\n\treturn base*blend;\n}\n\nvec3 blendMultiply(vec3 base, vec3 blend, float opacity) {\n\treturn (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Overlay\n\nfloat blendOverlay(float base, float blend) {\n\treturn base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));\n}\n\nvec3 blendOverlay(vec3 base, vec3 blend) {\n\treturn vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));\n}\n\nvec3 blendOverlay(vec3 base, vec3 blend, float opacity) {\n\treturn (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Hard light\n\nvec3 blendHardLight(vec3 base, vec3 blend) {\n\treturn blendOverlay(blend,base);\n}\n\nvec3 blendHardLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendHardLight(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Soft light\n\nfloat blendSoftLight(float base, float blend) {\n\treturn (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));\n}\n\nvec3 blendSoftLight(vec3 base, vec3 blend) {\n\treturn vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));\n}\n\nvec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Color dodge\n\nfloat blendColorDodge(float base, float blend) {\n\treturn (blend==1.0)?blend:min(base/(1.0-blend),1.0);\n}\n\nvec3 blendColorDodge(vec3 base, vec3 blend) {\n\treturn vec3(blendColorDodge(base.r,blend.r),blendColorDodge(base.g,blend.g),blendColorDodge(base.b,blend.b));\n}\n\nvec3 blendColorDodge(vec3 base, vec3 blend, float opacity) {\n\treturn (blendColorDodge(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Color burn\n\nfloat blendColorBurn(float base, float blend) {\n\treturn (blend==0.0)?blend:max((1.0-((1.0-base)/blend)),0.0);\n}\n\nvec3 blendColorBurn(vec3 base, vec3 blend) {\n\treturn vec3(blendColorBurn(base.r,blend.r),blendColorBurn(base.g,blend.g),blendColorBurn(base.b,blend.b));\n}\n\nvec3 blendColorBurn(vec3 base, vec3 blend, float opacity) {\n\treturn (blendColorBurn(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Vivid Light\n\nfloat blendVividLight(float base, float blend) {\n\treturn (blend<0.5)?blendColorBurn(base,(2.0*blend)):blendColorDodge(base,(2.0*(blend-0.5)));\n}\n\nvec3 blendVividLight(vec3 base, vec3 blend) {\n\treturn vec3(blendVividLight(base.r,blend.r),blendVividLight(base.g,blend.g),blendVividLight(base.b,blend.b));\n}\n\nvec3 blendVividLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendVividLight(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Lighten\n\nfloat blendLighten(float base, float blend) {\n\treturn max(blend,base);\n}\n\nvec3 blendLighten(vec3 base, vec3 blend) {\n\treturn vec3(blendLighten(base.r,blend.r),blendLighten(base.g,blend.g),blendLighten(base.b,blend.b));\n}\n\nvec3 blendLighten(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLighten(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Linear burn\n\nfloat blendLinearBurn(float base, float blend) {\n\t// Note : Same implementation as BlendSubtractf\n\treturn max(base+blend-1.0,0.0);\n}\n\nvec3 blendLinearBurn(vec3 base, vec3 blend) {\n\t// Note : Same implementation as BlendSubtract\n\treturn max(base+blend-vec3(1.0),vec3(0.0));\n}\n\nvec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Linear dodge\n\nfloat blendLinearDodge(float base, float blend) {\n\t// Note : Same implementation as BlendAddf\n\treturn min(base+blend,1.0);\n}\n\nvec3 blendLinearDodge(vec3 base, vec3 blend) {\n\t// Note : Same implementation as BlendAdd\n\treturn min(base+blend,vec3(1.0));\n}\n\nvec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));\n}\n\n// Linear light\n\nfloat blendLinearLight(float base, float blend) {\n\treturn blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));\n}\n\nvec3 blendLinearLight(vec3 base, vec3 blend) {\n\treturn vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));\n}\n\nvec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {\n\treturn (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));\n}',
                fragment:
                    'varying vec3 v_color;\n\nvoid main() {\n  vec3 color = v_color;\n  if (u_darken_top == 1.0) {\n    vec2 st = gl_FragCoord.xy/resolution.xy;\n    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;\n  }\n  gl_FragColor = vec4(color, 1.0);\n}'
            }),
                (this.conf = {
                    presetName: '',
                    wireframe: !1,
                    density: [0.06, 0.16],
                    zoom: 1,
                    rotation: 0,
                    playing: !0
                }),
                document.querySelectorAll('canvas').length < 1 ||
                this.isGPUDisabled
                    ? t.info('DID NOT LOAD HERO STRIPE CANVAS')
                    : ((this.minigl = new r(this.el, null, null, !0)),
                      requestAnimationFrame(() => {
                          this.el &&
                              ((this.computedCanvasStyle = getComputedStyle(
                                  this.el
                              )),
                              this.waitForCssVars());
                      }),
                      (this.scrollObserver = await s.create(0.1, !1)),
                      this.scrollObserver.observe(this.el),
                      this.scrollObserver.onSeparate(() => {
                          window.removeEventListener(
                              'scroll',
                              this.handleScroll
                          ),
                              window.removeEventListener(
                                  'mousedown',
                                  this.handleMouseDown
                              ),
                              window.removeEventListener(
                                  'mouseup',
                                  this.handleMouseUp
                              ),
                              window.removeEventListener(
                                  'keydown',
                                  this.handleKeyDown
                              ),
                              (this.isIntersecting = !1),
                              this.conf.playing && this.pause();
                      }),
                      this.scrollObserver.onIntersect(() => {
                          window.addEventListener('scroll', this.handleScroll),
                              window.addEventListener(
                                  'mousedown',
                                  this.handleMouseDown
                              ),
                              window.addEventListener(
                                  'mouseup',
                                  this.handleMouseUp
                              ),
                              window.addEventListener(
                                  'keydown',
                                  this.handleKeyDown
                              ),
                              (this.isIntersecting = !0),
                              this.addIsLoadedClass(),
                              this.play();
                      }));
        }
        disconnect() {
            this.scrollObserver &&
                (window.removeEventListener('scroll', this.handleScroll),
                window.removeEventListener('mousedown', this.handleMouseDown),
                window.removeEventListener('mouseup', this.handleMouseUp),
                window.removeEventListener('keydown', this.handleKeyDown),
                this.scrollObserver.disconnect()),
                window.removeEventListener('resize', this.resize);
        }
        initMaterial() {
            this.uniforms = {
                u_time: new this.minigl.Uniform({
                    value: 0
                }),
                u_shadow_power: new this.minigl.Uniform({
                    value: 5
                }),
                u_darken_top: new this.minigl.Uniform({
                    value: '' === this.el.dataset.jsDarkenTop ? 1 : 0
                }),
                u_active_colors: new this.minigl.Uniform({
                    value: this.activeColors,
                    type: 'vec4'
                }),
                u_global: new this.minigl.Uniform({
                    value: {
                        noiseFreq: new this.minigl.Uniform({
                            value: [this.freqX, this.freqY],
                            type: 'vec2'
                        }),
                        noiseSpeed: new this.minigl.Uniform({
                            value: 5e-6
                        })
                    },
                    type: 'struct'
                }),
                u_vertDeform: new this.minigl.Uniform({
                    value: {
                        incline: new this.minigl.Uniform({
                            value: Math.sin(this.angle) / Math.cos(this.angle)
                        }),
                        offsetTop: new this.minigl.Uniform({
                            value: -0.5
                        }),
                        offsetBottom: new this.minigl.Uniform({
                            value: -0.5
                        }),
                        noiseFreq: new this.minigl.Uniform({
                            value: [3, 4],
                            type: 'vec2'
                        }),
                        noiseAmp: new this.minigl.Uniform({
                            value: this.amp
                        }),
                        noiseSpeed: new this.minigl.Uniform({
                            value: 10
                        }),
                        noiseFlow: new this.minigl.Uniform({
                            value: 3
                        }),
                        noiseSeed: new this.minigl.Uniform({
                            value: this.seed
                        })
                    },
                    type: 'struct',
                    excludeFrom: 'fragment'
                }),
                u_baseColor: new this.minigl.Uniform({
                    value: this.sectionColors[0],
                    type: 'vec3',
                    excludeFrom: 'fragment'
                }),
                u_waveLayers: new this.minigl.Uniform({
                    value: [],
                    excludeFrom: 'fragment',
                    type: 'array'
                })
            };
            for (let e = 1; e < this.sectionColors.length; e += 1)
                this.uniforms.u_waveLayers.value.push(
                    new this.minigl.Uniform({
                        value: {
                            color: new this.minigl.Uniform({
                                value: this.sectionColors[e],
                                type: 'vec3'
                            }),
                            noiseFreq: new this.minigl.Uniform({
                                value: [
                                    2 + e / this.sectionColors.length,
                                    3 + e / this.sectionColors.length
                                ],
                                type: 'vec2'
                            }),
                            noiseSpeed: new this.minigl.Uniform({
                                value: 11 + 0.3 * e
                            }),
                            noiseFlow: new this.minigl.Uniform({
                                value: 6.5 + 0.3 * e
                            }),
                            noiseSeed: new this.minigl.Uniform({
                                value: this.seed + 10 * e
                            }),
                            noiseFloor: new this.minigl.Uniform({
                                value: 0.1
                            }),
                            noiseCeil: new this.minigl.Uniform({
                                value: 0.63 + 0.07 * e
                            })
                        },
                        type: 'struct'
                    })
                );
            return (
                (this.vertexShader = [
                    this.shaderFiles.noise,
                    this.shaderFiles.blend,
                    this.shaderFiles.vertex
                ].join('\n\n')),
                new this.minigl.Material(
                    this.vertexShader,
                    this.shaderFiles.fragment,
                    this.uniforms
                )
            );
        }
        initMesh() {
            (this.material = this.initMaterial()),
                (this.geometry = new this.minigl.PlaneGeometry()),
                (this.mesh = new this.minigl.Mesh(
                    this.geometry,
                    this.material
                ));
        }
        shouldSkipFrame(e) {
            return (
                !!window.document.hidden ||
                !this.conf.playing ||
                parseInt(e, 10) % 2 == 0 ||
                void 0
            );
        }
        checkKonami(e) {
            e.key.toLowerCase() === this.konamiCode[this.konamiIndex]
                ? (this.konamiIndex += 1)
                : (this.konamiIndex = 0),
                this.konamiIndex > 1 && e.preventDefault(),
                this.konamiIndex < this.konamiCode.length ||
                    this.showGradientLegend();
        }
        updateFrequency(e) {
            (this.freqX += e), (this.freqY += e);
        }
        toggleColor(e) {
            this.activeColors[e] = 0 === this.activeColors[e] ? 1 : 0;
        }
        showGradientLegend() {
            this.width > this.minWidth &&
                ((this.isGradientLegendVisible = !0),
                document.body.classList.add('isGradientLegendVisible'));
        }
        hideGradientLegend() {
            (this.isGradientLegendVisible = !1),
                document.body.classList.remove('isGradientLegendVisible');
        }
        init() {
            this.initGradientColors(),
                this.initMesh(),
                this.resize(),
                requestAnimationFrame(this.animate),
                window.addEventListener('resize', this.resize);
        }
        waitForCssVars() {
            if (
                this.computedCanvasStyle &&
                -1 !==
                    this.computedCanvasStyle
                        .getPropertyValue('--gradientColorOne')
                        .indexOf('#')
            )
                this.init(), this.addIsLoadedClass();
            else {
                if (
                    ((this.cssVarRetries += 1),
                    this.cssVarRetries > this.maxCssVarRetries)
                )
                    return (
                        (this.sectionColors = [
                            16711680,
                            16711680,
                            16711935,
                            65280,
                            255
                        ]),
                        void this.init()
                    );
                requestAnimationFrame(() => this.waitForCssVars());
            }
        }
        initGradientColors() {
            this.sectionColors = [
                '--gradientColorZero',
                '--gradientColorOne',
                '--gradientColorTwo',
                '--gradientColorThree'
            ]
                .map((e) => {
                    let t = this.computedCanvasStyle.getPropertyValue(e).trim();
                    if (4 === t.length) {
                        const e = t
                            .substr(1)
                            .split('')
                            .map((e) => e + e)
                            .join('');
                        t = '#' + e;
                    }
                    return t && '0x' + t.substr(1);
                })
                .filter(Boolean)
                .map(a);
        }
    }
);
*/
