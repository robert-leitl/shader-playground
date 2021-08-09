varying vec2 v_uv;
varying vec3 v_normal;
varying vec4 v_world_position;

void main() {
    v_uv = uv;
    v_normal = normal;

    // the model coordinates transformed to the world coordinates
    v_world_position = (modelMatrix * vec4(position, 1.0));

    // the position transformed to the camera view (viewMatrix = camera.matrixWorldInverse)
    vec4 viewPosition = viewMatrix * v_world_position;

    // the projected positions
    gl_Position = projectionMatrix * viewPosition;
}
