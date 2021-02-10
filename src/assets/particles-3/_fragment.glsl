varying vec2 v_uv;
varying float v_instanceValue;
varying vec4 v_imageColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_charsTexture;

#define CHAR_COUNT 7.

void main() {
    vec2 uv = v_uv;
    float imageValue = (v_imageColor.r + v_imageColor.g + v_imageColor.b) / 3.;
    float value = max(v_instanceValue, imageValue / 255.);
    uv.x = uv.x / CHAR_COUNT + floor(value * CHAR_COUNT) * 1. / CHAR_COUNT;
    vec4 charsMap = texture2D(u_charsTexture, uv);
    charsMap.a *= 0.7;
    vec4 bgColor = vec4(1., 1., 1., value * 0.2);
    gl_FragColor = charsMap + bgColor;
}
