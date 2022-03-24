varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec4 color = texture2D(u_t1, v_uv);
    color.rgb = vec3(1.) - color.rgb;
    color.rgb *= 0.2;
    color.rgb *= vec3(0.05, 0.6, 1.);
    gl_FragColor = color;
}
