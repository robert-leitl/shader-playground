varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_progress;
uniform sampler2D u_t1;
uniform sampler2D u_t2;
uniform vec2 u_t1Aspect;
uniform vec2 u_t2Aspect;

mat2 rotate(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 grid = vec2(40., 1.);

    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv1 = (st - 0.5) * u_t1Aspect + .5;
    vec2 uv1Divided = fract(uv1 * grid);
    vec2 uv2 = (st - 0.5) * u_t2Aspect + .5;
    vec2 uv2Divided = fract(uv2 * grid);

    float progress = u_progress;

    vec2 i1 = floor(uv1 * grid) / (grid - vec2(1.));
    vec2 i2 = floor(uv2 * grid) / (grid - vec2(1.));

    mat2 r = rotate(1.);
    float div = 0.1;

    uv1 += vec2(((uv1Divided).x - i1.x) * div * progress, 0.);
    uv2 += vec2(((uv2Divided).x - i2.x) * div * (1. - progress), 0.);

    vec4 t1 = texture2D(u_t1, uv1);
    vec4 t2 = texture2D(u_t2, uv2);

    gl_FragColor = mix(t1, t2, progress);
}
