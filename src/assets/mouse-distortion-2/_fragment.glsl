varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_offsetTexture;
uniform sampler2D u_t1;
uniform vec2 u_t1Aspect;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    // cover mode from center
    vec2 uv = (v_uv - .5) * u_t1Aspect + 0.5;

    vec4 u_offsetTexture = texture2D(u_offsetTexture, v_uv);
    vec2 offset = (u_offsetTexture.xy) * 7.;

    gl_FragColor = texture2D(u_t1, uv - offset);
    gl_FragColor.r = texture2D(u_t1, uv - (offset * vec2(1.05))).r;
    gl_FragColor.g = texture2D(u_t1, uv - offset).g;
    gl_FragColor.b = texture2D(u_t1, uv - (offset * vec2(0.96))).b;
}
