varying vec2 v_uv;
varying vec3 v_position;

uniform vec2 u_resolution;
uniform vec3 u_planePoint;
uniform float u_time;
uniform float u_progress;
uniform sampler2D u_t1;
uniform sampler2D u_tDisplace;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
    return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {
    vec2 uv = v_uv;

    float dist = distance(u_planePoint, v_position);
    dist = 1. - map(dist, .0, .5, 0., 1.);
    dist = clamp(dist, .0, 1.);
    vec3 dir = normalize(v_position - u_planePoint);

    vec2 displace = mix(uv, u_planePoint.xy + vec2(.5), dist * 0.2);

    vec4 color = texture2D(u_t1, displace);
    gl_FragColor = color;
}
