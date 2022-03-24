varying vec2 v_uv;

uniform float u_time;

void main() {
    v_uv = uv;

    vec3 pos = position;
    pos.y += (sin(pos.y * 10. + u_time / 2.) * 0.5 + 0.5) * 0.1;
    pos.z += (sin(pos.y * 5. + u_time / 2.) * 0.5 + 0.5) * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 12. * (1. / - mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
