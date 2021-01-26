varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;
uniform vec2 u_t1Aspect;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = (v_uv - 0.5) * u_t1Aspect + .5;

    gl_FragColor = texture2D(u_t1, uv);
}
