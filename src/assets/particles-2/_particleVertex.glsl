uniform float u_time;

attribute float opacity;

varying float v_opacity;

void main() {
    vec3 pos = position;
    v_opacity = opacity;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 500. * (1. / - mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
