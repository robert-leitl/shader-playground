varying vec2 v_uv;
varying vec3 v_normal;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;


void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec3 n = normalize(v_normal);

    vec3 finalColor = vec3(0, 0.75, 0);
    vec3 shadowColor = vec3(0, 0, 0);
    float shadowPower = 0.5;

    gl_FragColor = vec4(v_uv.x, v_uv.y, 1.0, 1.0);
    gl_FragColor = vec4(0., 0., .0, 1.0);
    gl_FragColor = vec4(n, 1.0);

    //gl_FragColor = texture2D(u_t1, v_uv);
}
