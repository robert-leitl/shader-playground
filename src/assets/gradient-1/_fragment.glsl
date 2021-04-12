varying vec2 v_uv;
varying vec3 v_color;
uniform vec2 u_resolution;
uniform float u_time;


void main() {
    vec3 color = v_color;
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = v_uv * 2. - 1.;

    // darken edges
    color += pow(length(uv * vec2(.5, 5.)), 3.) * 0.1;

    gl_FragColor = vec4(color, 1);
}
