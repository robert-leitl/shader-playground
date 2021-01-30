varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
    0.0,                                0.0,                                0.0,                                1.0);
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
}

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 glowPalette( in vec3 p, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    float t = clamp((1.9 - length(p * 0.5)) / 2., 0., 1.);
    return (a + b*cos( 6.28318*(c*t+d) )) * t * t * t;
}

float sdSphere(vec3 p, float radius) {
    return length(p) - radius;
}

float sdBox( vec3 p, vec3 b )
{
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdSine(vec3 p) {
    float scale = 10. + 6. * sin(u_time / 20.);

    vec3 p1 = p * scale;
    float d = 1. - (sin(p1.x + u_time / 10.) + cos(p1.y + u_time / 20.) + sin(p1.z / .8 + u_time / 50.)) / 3.;
    return (0.8 - d) / scale;
}

float opUnion( float d1, float d2 ) { return min(d1,d2); }

float opSubtraction( float d1, float d2 ) { return max(-d1,d2); }

float opIntersection( float d1, float d2 ) { return max(d1,d2); }

float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); }

float opSmoothSubtraction( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h); }

float opSmoothIntersection( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) + k*h*(1.0-h); }

float sdScene(vec3 p) {
    vec2 m = u_mouse / u_resolution;
    m = m * 2.  - 1.;
    vec3 p1 = rotate(p, vec3(-m.y, -m.x, 0.), -length(m));

    float sphere = sdSphere(p1, 1.);
    float box = sdBox(p1, vec3(.5));
    float sine = sdSine(p1);
    return opSmoothIntersection(sphere, sine, 0.02);
}

vec3 calcNormal(vec3 pos, float eps) {
    const vec3 v1 = vec3( 1.0,-1.0,-1.0);
    const vec3 v2 = vec3(-1.0,-1.0, 1.0);
    const vec3 v3 = vec3(-1.0, 1.0,-1.0);
    const vec3 v4 = vec3( 1.0, 1.0, 1.0);

    return normalize(
    v1 * sdScene( pos + v1*eps ) +
    v2 * sdScene( pos + v2*eps ) +
    v3 * sdScene( pos + v3*eps ) +
    v4 * sdScene( pos + v4*eps ) );
}

vec3 calcNormal(vec3 pos) {
    return calcNormal(pos, 0.002);
}

void main() {
    float m = max(u_resolution.x, u_resolution.y);
    vec2 st = gl_FragCoord.xy / m;
    vec2 uv = st * 2. - (u_resolution / m);

    vec3 camera = vec3(0., 0., 1.7);
    vec3 light = vec3(-.5, 1., 0.25);
    vec3 ray = normalize(vec3(uv, -1.));
    vec3 p = vec3(camera);
    vec3 color = vec3(0., 0., 0.);

    // color args
    vec3 c_a = vec3(0.5, 0.5, 0.5);
    vec3 c_b = vec3(0.5, 0.5, 0.5);
    vec3 c_c = vec3(1.0, 1.0, 0.5);
    vec3 c_d = vec3(0.80, 0.90, 0.30);
    vec3 c_d2 = vec3(0.00, 0.33, 0.67);

    for(int i=0; i<56; i++) {
        float d = sdScene(p);

        if (abs(d) < 0.001) {
            vec3 n = calcNormal(p);
            float diffValue = dot(n, light) / 10.;
            vec3 diff = vec3(0.6, 0.9, 1.0) * diffValue;
            // color = vec3(diff, 0.1, 0.1);
            color += palette(.65 + (1. - length(p)) * 0.5, c_a, c_b, c_c, c_d) + diff;
            break;
        }

        color += 0.15 * glowPalette(p, c_a, c_b, c_c, c_d);

        p += ray * d;
    }

    gl_FragColor = vec4(color, 1.);
}
