varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec2 u_mouse_v;
uniform float u_time;
uniform sampler2D u_t1;
uniform vec2 u_t1Aspect;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    vec2 grid = vec2(100., 100.);
    vec2 stGrid = fract(st * grid);
    vec2 index = floor(st * grid);
    vec2 aspect = u_t1Aspect * 0.9;

    vec2 uv = stGrid / grid;
    uv += (vec2(1.) / grid) * index;
    uv = (uv - .5) * aspect + 0.5;

    vec2 tile = u_resolution / grid;
    vec2 cellCenter = index * tile + tile / 2.;
    float d = distance(u_mouse, cellCenter) / max(u_resolution.x, u_resolution.y);
    d = inversesqrt(d) * 0.2;
    d = smoothstep(.05, 1., d);

    uv += -(u_mouse_v / 2500.) * d * d;

    gl_FragColor = texture2D(u_t1, uv);
}
