varying vec2 v_uv;
varying vec3 v_normal;
varying vec4 v_world_position;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;

#define HEX_RATIO 1.7320508076
#define TILE_COUNT 6.
#define LINE_THICKNESS 0.1
#define EPSILON 0.015
#define M_PI 3.1415926535897932384626433832795

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

float rand(float n){return fract(sin(n) * 43758.5453123);}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 n) {
    const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float circle(vec2 p, vec2 c, float r) {
    float o = 0.;
    float d = length(p - c);
    float e = EPSILON;
    float l = LINE_THICKNESS;
    float ir = r + l / 2.;
    float or = r - l / 2. + e;
    o = smoothstep(ir, ir - e, d) * smoothstep(or - e, or, d);
    return o;
}

vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, -s, s, c);
    return m * v;
}

float tile(vec4 hex) {
    int tileIndex = int(floor(noise(hex.zw) * TILE_COUNT));
    float c = 0.;
    float e = EPSILON;
    float l = LINE_THICKNESS;
    float radius = .5 / HEX_RATIO;

    if (tileIndex == 0) {
        c = circle(hex.xy, vec2(.5, .5 / HEX_RATIO), radius);
        c += circle(hex.xy, vec2(-.5, .5 / HEX_RATIO), radius);
        c += circle(hex.xy, vec2(0., -HEX_RATIO / 3.), radius);
    } else {
        vec2 p = rotate(hex.xy, (M_PI / 3.) * float(tileIndex));

        c = circle(p, vec2(.5, .5 / HEX_RATIO), radius);
        c += circle(p, vec2(-.5, -.5 / HEX_RATIO), radius);
        float line = dot(p, normalize(vec2(HEX_RATIO, 1.)));
        c += smoothstep(l / 2., l / 2. - e, abs(line));
    }

    return c;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = v_uv;
    //uv = v_normal.xy;
    uv = uv * 2. - 1.; // center uv
    float maxRes = max(u_resolution.x, u_resolution.y);
    vec2 aspectRatio = vec2(u_resolution.x / maxRes, u_resolution.y / maxRes);
    uv = uv * aspectRatio;
    vec4 hex = hexCoords(8., uv);
    // get the distance to the edge
    float hexDist = hexDist(hex.xy);
    float distCol = smoothstep(.97, .96, hexDist) * 0.2;
    float tileCol = tile(hex) + distCol;


    // gooch shading model (see vertex.glsl)
    vec3 n = normalize(v_normal);
    vec3 l = normalize(vec3(-1., -1., -1.));
    vec4 colorSurface = vec4(1., 0., 0.1, 1.);
    vec4 colorHighlight = vec4(.6, .6, .6, 1.);
    vec4 colorWarm = vec4(.3, .3, 0., 1.) + .45 * colorSurface;
    vec4 colorCool = vec4(0.1, 0., 0.1, 1.) + .45 * colorSurface;
    vec3 v = normalize(cameraPosition - v_world_position.xyz);
    vec3 r = 2. * dot(n, l) * n - l;
    float t = (dot(n, l) + 1.) / 2.;
    float s = max(0., (1. * dot(r, v) - .93) * 15.);
    vec4 c = mix(colorCool, colorWarm, t);
    c += mix(c, colorHighlight, s);
    c *= tileCol;

    gl_FragColor = c;
}
