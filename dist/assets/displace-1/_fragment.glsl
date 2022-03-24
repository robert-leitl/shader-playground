varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_progress;
uniform sampler2D u_t1;
uniform sampler2D u_tDisplace;

void main() {
    float progress = 0.55 * u_progress;
    vec4 map = texture2D(u_tDisplace, v_uv.yx);
    vec2 uv = v_uv;
    uv.y = mix(uv.y, map.r - 0., progress);

    vec4 color = texture2D(u_t1, uv);
    float abb = 0.2;
    color.r = texture2D(u_t1, uv + abb * vec2(0., 0.1) * progress).r;
    color.g = texture2D(u_t1, uv + abb * vec2(0., 0.2) * progress).g;
    color.b = texture2D(u_t1, uv + abb * vec2(0., 0.4) * progress).b;

    gl_FragColor = color;
}
