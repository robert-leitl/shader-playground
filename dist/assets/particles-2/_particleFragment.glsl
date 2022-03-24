uniform vec2 u_resolution;
uniform float u_time;

varying float v_opacity;

void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1. - gl_PointCoord.y);
    vec2 st = uv * 2. - 1.;

    float opacity = v_opacity / 6.;

    vec4 color = vec4(0.08 / length(st));
    color = min(vec4(10.), color);

    color.rgb *= vec3(0.05, 0.6, 1.) * 18.;
    color *= opacity;

    color.a *= opacity * 10.;

    gl_FragColor = color;
}
