varying vec2 v_texelSize;

uniform vec2 u_resolution;

void main() {
    v_texelSize = vec2(1. / u_resolution);

    gl_Position = vec4(position, 1.0);
}
