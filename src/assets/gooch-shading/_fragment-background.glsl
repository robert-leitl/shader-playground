varying vec2 v_uv;
varying vec3 v_normal;
varying vec4 v_world_position;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;

#define HEX_RATIO 1.7320508076

float hexDist(vec2 p) {
    p = abs(p);
    // 1.73 ~= sqrt(3)
    float c = dot(p, normalize(vec2(1., HEX_RATIO)));
    c = max(p.x, c);

    return c * 2.;
}


vec4 hexCoords(float scale, vec2 uv) {
    vec2 suv = uv * scale;

    vec2 r = vec2(1., HEX_RATIO);
    vec2 h = r * .5; // offset of hexagon grid
    vec2 a = mod(suv, r) - h;
    vec2 b = mod(suv - h, r) - h;
    vec2 g = dot(a,a) > dot(b,b) ? b : a;

    vec2 id = suv - g;

    return vec4(g, id);
}


void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = v_normal.xy;
    uv = uv * 2. - 1.; // center uv
    float maxRes = max(u_resolution.x, u_resolution.y);
    vec2 aspectRatio = vec2(u_resolution.x / maxRes, u_resolution.y / maxRes);
    uv = uv * aspectRatio;
    uv = v_uv;

    vec4 hex = hexCoords(45., uv);

    // get the distance to the edge
    hex.xy = vec2(0., hexDist(hex.xy));

    float c = smoothstep(1., .96, hex.y);

    vec3 col = vec3(c);

    gl_FragColor = vec4(col, 1.);
}
