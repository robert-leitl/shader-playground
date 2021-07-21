varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    float dist = distance(vec2(.5,.5), v_uv);

    float delta = max(dFdx(v_uv.x), dFdx(v_uv.y));

    float rdValueA1 = texture2D(u_t1, vec2(v_uv.x - delta * 1., v_uv.y)).r;
    float rdValueA2 = texture2D(u_t1, vec2(v_uv.x, v_uv.y)).r;
    float rdValueA3 = texture2D(u_t1, vec2(v_uv.x + delta * 1., v_uv.y)).r;

    float glow = 120.;
    float edge = 0.5;
    float colorValueR = smoothstep(edge, edge + delta * glow * 2., rdValueA1);
    float colorValueG = smoothstep(edge, edge + delta * glow * 1.6, rdValueA2);
    float colorValueB = smoothstep(edge, edge + delta * glow, rdValueA3);
    vec4 color = vec4(max(vec3(colorValueR, colorValueG, colorValueB), 0.1), 1.);

    float rdValueSpecular = texture2D(u_t1, vec2(v_uv.x, v_uv.y - delta * 20.)).r;
    float specularValue = (1. - smoothstep(0.1, 0.4, rdValueSpecular));
    vec4 specularColor = vec4(specularValue, specularValue, specularValue, 1.);
    color += specularColor;

    float rdValueShadow = texture2D(u_t1, vec2(v_uv.x, v_uv.y + delta * 10.)).r;
    float shadowValue = smoothstep(0., 0.8, rdValueShadow);
    shadowValue = max(shadowValue + (1. - colorValueB), 0.95);
    vec4 shadowColor = vec4(vec3(shadowValue), 1.);
    color *= shadowColor;

    color = clamp(color, vec4(0.), vec4(1.));

    gl_FragColor = color;
}
