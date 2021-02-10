attribute float a_instanceValue;
attribute vec4 a_imageColor;

varying vec2 v_uv;
varying float v_instanceValue;
varying vec4 v_imageColor;

void main() {
    v_uv = uv;
    v_instanceValue = a_instanceValue;
    v_imageColor = a_imageColor;

    vec3 pos = position;
    pos.z -= v_instanceValue * 0.07;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
}
