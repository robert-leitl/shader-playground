varying vec2 v_uv;
varying float vNoise;
varying vec3 vNormal;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float noise = -vNoise * .5 + .5;

    vec3 lightDirection = normalize(vec3(-.5, 1., .3));
    float diffuse = dot(lightDirection, vNormal);

    float line = sin(noise * 200.);
    float thickness = 0.8;
    line = smoothstep(0.5 - thickness / 2., 0.5 - thickness / 2., line) - smoothstep(0.5 + thickness / 2., 0.5 + thickness / 2., line);

    float fog = length(v_uv * 2. - 1.);

    vec3 color = vec3(1., noise * .4, 0.) * (diffuse + 0.5);
    color = mix(color, vec3(1.), 1. - line);
    color = mix(color, vec3(1.), fog);

    gl_FragColor = vec4(color, 1.);
}

