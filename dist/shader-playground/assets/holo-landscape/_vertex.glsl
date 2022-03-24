uniform float u_time;

varying vec2 v_uv;
varying vec3 vNormal;
varying float vNoise;

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);

    float res = mix(
    mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
    mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

#define NUM_OCTAVES 3

float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(vec2(x.x, x.y + u_time * 0.05 - float(i)));
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

vec3 distort(vec3 pos) {
    vec3 res = vec3(pos);
    float noise = fbm(vec2(res.x, res.y) * .3);
    res.z = noise * 4.;
    return res;
}


void main() {
    v_uv = uv;


    float noise = fbm(vec2(position.x, position.y) * .3);
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // correct the normals with the distortion
    float tangentFactor = 0.01;
    vec3 tangent1 = vec3(0., 1., 0.);
    vec3 tangent2 = vec3(1., 0., 0.);
    vec3 nearby1 = position + tangent1 * tangentFactor;
    vec3 nearby2 = position + tangent2 * tangentFactor;
    vec3 distorted1 = distort(nearby1);
    vec3 distorted2 = distort(nearby2);
    vec3 distortedPosition = vec3(position.x, position.y, position.z + noise * 4.);

    modelPosition.y = noise * 4.;
    vec3 distortedNormal = normalize(cross(distorted1 - distortedPosition, distorted2 - distortedPosition));


    vNormal = distortedNormal;
    vNoise = noise;



    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;
}
