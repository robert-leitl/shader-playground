varying vec2 v_uv;

void main() {
    v_uv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    gl_Position = vec4(position, 1.0);
}
