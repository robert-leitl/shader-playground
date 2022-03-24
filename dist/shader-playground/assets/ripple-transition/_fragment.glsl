varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;
uniform vec2 u_t1Scale;
uniform sampler2D u_v1;
uniform vec2 u_v1Scale;
uniform float u_progress;
uniform float u_noiseProgress;

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
float rand(float n){return fract(sin(n) * 43758.5453123);}
float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(float p){
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
}

float noise(vec2 n) {
    const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

#define NUM_OCTAVES 5

float fbm(float x) {
    float v = 0.0;
    float a = 0.5;
    float shift = float(100);
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x - u_time * 0.5);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float fbm(float x, float time) {
    float v = 0.0;
    float a = 0.5;
    float shift = float(100);
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x + time);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}


float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}


float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(x);
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}









float circle(vec2 uv, float radius, float sharpness) {
    return smoothstep(radius - radius * sharpness, radius + radius * sharpness, length(uv));
}

void main() {
    vec2 centeredUv = v_uv - vec2(.5);
    float maxRes = max(u_resolution.x, u_resolution.y);
    vec2 aspectRatio = vec2(u_resolution.x / maxRes, u_resolution.y / maxRes);
    vec2 centeredPropUv = centeredUv * aspectRatio;


    // mask

    float minSharpness = 0.3;
    float maxRadius = length(aspectRatio) + minSharpness + .1;
    float radius = (u_progress * maxRadius) / 2.;
    float mask = circle(centeredPropUv, radius, .1 + u_progress * minSharpness);



    // noise

    float noiseDisplacement = fbm((centeredPropUv * 20.) * (fbm(length(centeredPropUv) * 15., u_time * -3.5)));
    noiseDisplacement = (noiseDisplacement - .5) * 2.;
    noiseDisplacement *= 0.04;
    noiseDisplacement *= u_noiseProgress * 2.;



    // textures

    // scale the video proportionally
    vec2 videoUv = centeredUv / (.5 + u_progress * 0.5) + vec2(.5);
    videoUv = (videoUv - vec2(.5)) * u_v1Scale + vec2(.5);
    // flip each second repitition of the texture
    vec2 videoFlip = mod(floor(videoUv), vec2(2.));
    videoUv = abs(videoFlip * vec2(1.) - fract(videoUv));
    vec4 video = texture2D(u_v1, videoUv);

    // scale the image proportionally
    vec2 imageUv = (centeredUv) / (1. + u_progress * 2.) + vec2(.5);
    imageUv = (imageUv - vec2(.5)) * u_t1Scale + vec2(.5);
    imageUv *= mask;
    imageUv += noiseDisplacement;
    vec4 image = texture2D(u_t1, imageUv);




    gl_FragColor = mix(video, image, mask);
}
