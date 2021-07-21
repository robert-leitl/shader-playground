varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    float rdValue = texture2D(u_t1, v_uv).r;
    vec4 color = vec4(vec3(smoothstep(0.5, 0.51, rdValue)), 1.);


    gl_FragColor = color;
}
