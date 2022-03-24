varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    gl_FragColor = vec4(1., 1., 1., .2);
}
