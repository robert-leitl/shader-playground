varying vec2 v_uv;
varying float v_instanceValue;
varying vec4 v_imageColor;
varying vec2 v_index;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_charsTexture;
uniform float u_noiseStrength;

#define CHAR_COUNT 20.

void main() {
    vec2 uv = v_uv;

    // gradient colors
    vec3 colorAccent1 = vec3(62., 196., 229.) / 255.;
    vec3 colorAccent2 = vec3(103., 255., 254.) / 255.;
    vec3 colorAccent = mix(colorAccent2, colorAccent1, v_index.y / .4);

    // get the brightness value from the color image
    float imageValue = (v_imageColor.r + v_imageColor.g + v_imageColor.b) / 3.;

    // for bright images, subtract the instanceValue (-> dark mouse follower)
    float value = max(0., imageValue - v_instanceValue);

    // get the color from the instance index
    vec2 index = v_index * 2. - 1.;
    vec3 color = colorAccent * (smoothstep(0.8, 0.3, length(index)) + (1. - u_noiseStrength));

    // map the uv to the char corresponding to the brightness value
    uv.x = uv.x / CHAR_COUNT + floor(value * CHAR_COUNT) * 1. / CHAR_COUNT;
    vec4 charsMap = texture2D(u_charsTexture, uv);
    charsMap.rgb *= color;

    // dim the char according to its value
    charsMap.a *= 0.7 + value * 0.7;

    // draw the background rectangle
    vec4 bgColor = vec4(color, value * 0.6);
    bgColor.rgb *= color;

    gl_FragColor = charsMap + bgColor;

    // overall opacity factor
    gl_FragColor.a *= 0.4 + (1. - u_noiseStrength) * 0.9;
}
