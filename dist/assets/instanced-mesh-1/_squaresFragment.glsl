varying vec2 v_uv;
varying float v_f;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;
uniform vec2 u_t1Aspect;

void main() {
    gl_FragColor = vec4(1., 1., 1., 0.3 * v_f);
}
