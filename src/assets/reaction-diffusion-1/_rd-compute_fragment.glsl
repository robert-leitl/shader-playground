varying vec2 v_uv;
varying vec2 v_texelSize;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_pointer;
uniform bool u_isPointerDown;
uniform sampler2D u_texture;

float u_diffusionA = 1.0;
float u_diffusionB = 0.50;
float u_feedRate = .055;
float u_killRate = .062;
float u_timeStep = 1.0;
float dropperSize = 0.05;

// http://theorangeduck.com/page/avoiding-shader-conditionals
float when_eq(float x, float y) {
    return 1.0 - abs(sign(x - y));
}
float when_neq(float x, float y) {
    return abs(sign(x - y));
}
float when_gt(float x, float y) {
    return max(sign(x - y), 0.0);
}
float when_lt(float x, float y) {
    return max(sign(y - x), 0.0);
}
float when_le(float x, float y) {
    return 1.0 - max(sign(x - y), 0.0);
}
float when_ge(float x, float y) {
    return 1.0 - max(sign(y - x), 0.0);
}

vec4 laplacian(vec2 pos) {
    vec4 result = vec4(0., 0., 0., 1.);

    vec3 kernel[3] = vec3[](
        vec3(.05, .2, .05),
        vec3(.2, -1., .2),
        vec3(.05, .2, .05)
    );

    result += texture2D(u_texture, vec2(pos.x - v_texelSize.x, pos.y - v_texelSize.y)) * kernel[0][0];
    result += texture2D(u_texture, vec2(pos.x, pos.y - v_texelSize.y)) * kernel[0][1];
    result += texture2D(u_texture, vec2(pos.x + v_texelSize.x, pos.y - v_texelSize.y)) * kernel[0][2];
    result += texture2D(u_texture, vec2(pos.x - v_texelSize.x, pos.y)) * kernel[1][0];

    result += texture2D(u_texture, vec2(pos.x + v_texelSize.x, pos.y)) * kernel[1][2];
    result += texture2D(u_texture, vec2(pos.x - v_texelSize.x, pos.y + v_texelSize.y)) * kernel[2][0];
    result += texture2D(u_texture, vec2(pos.x, pos.y + v_texelSize.y)) * kernel[2][1];
    result += texture2D(u_texture, vec2(pos.x + v_texelSize.x, pos.y + v_texelSize.y)) * kernel[2][2];

    result += texture2D(u_texture, pos) * kernel[1][1];

    return result;
}

vec4 drawSeed(vec4 pixel, vec2 seedPosition, vec2 pos) {
    vec4 result = vec4(pixel);
    float dist = distance(seedPosition, pos);

    result.g += 1. - smoothstep(dropperSize - .01, dropperSize, dist);

    return result;
}

vec4 react(vec2 pos) {
    vec4 result = texture2D(u_texture, pos);
    vec4 convolution = laplacian(pos);

    float a = result[0];
    float b = result[1];

    float da = u_diffusionA * convolution[0];
    float db = u_diffusionB * convolution[1];
    float feed = u_feedRate * (1. - a);
    float kill = (u_killRate + u_feedRate) * b;
    float reaction = a * (b * b);

    result[0] = a + (da - reaction + feed) * u_timeStep;
    result[1] = b + (db + reaction - kill) * u_timeStep;

    return result;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    vec4 pixel = react(st);
    if (u_isPointerDown) {
        pixel = drawSeed(pixel, (u_pointer.xy + 1.) / 2., st);
    }
    pixel = clamp(pixel, 0.0, 1.0);
    gl_FragColor = pixel;
}

