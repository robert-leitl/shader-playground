varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    gl_FragColor = vec4(v_uv.x, v_uv.y, 0.0, 1.0);

    gl_FragColor = texture2D(u_t1, v_uv);
}
