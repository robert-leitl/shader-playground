uniform float u_time;

varying float v_f;

void main() {
    gl_FragColor = vec4(1., 1., 1., 0.7 * v_f + 0.1);
}
