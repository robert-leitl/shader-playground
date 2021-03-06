uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_lightPos;

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_worldPosition;

float getScatter(vec3 cameraPos, vec3 dir, vec3 lightPos, float d) {
    vec3 q = cameraPos - lightPos;
    float b = dot(dir, q);
    float c = dot(q, q);
    float t = c - b * b;
    float s = 1. / sqrt(max(0.0001, t));
    float l = s * (atan( (d + b) * s) - atan( b * s));

    return pow(max(0., l / 180.), 0.4);
}

void main() {

    // scatter lighting
    vec3 cameraToWorld = v_worldPosition - cameraPosition;
    vec3 cameraToWorldDir = normalize(cameraToWorld);
    float cameraToWorldDist = length(cameraToWorld);
    float scatter = getScatter(cameraPosition, cameraToWorldDir, u_lightPos, cameraToWorldDist);

    // diffuse lighting
    vec3 lightDirection = normalize(u_lightPos - v_worldPosition);
    float diffusion = max(0., dot(v_normal, lightDirection));


    float combined = scatter;

    gl_FragColor = vec4(combined, .0, .0, 1.0);
}
