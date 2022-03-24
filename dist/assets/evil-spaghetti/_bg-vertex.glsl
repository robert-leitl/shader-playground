varying vec3 v_position;
varying vec3 v_worldPosition;
varying vec3 v_normal;

void main() {
    v_position = position;
    v_normal = normal;
    v_worldPosition = (modelMatrix * vec4(position, 1.)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
