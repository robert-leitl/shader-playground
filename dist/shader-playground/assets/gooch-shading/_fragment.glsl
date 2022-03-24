varying vec2 v_uv;
varying vec3 v_normal;
varying vec4 v_world_position;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;



void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;

    // varying normals may not be of unit length --> renormalize
    vec3 n = normalize(v_normal);

    // direction to the light source
    vec3 l = normalize(vec3(1., 1., 1.));

    // colors
    vec4 colorSurface = vec4(1., 0., 0.1, 1.);
    vec4 colorHighlight = vec4(1., 1., 1., 1.);
    vec4 colorWarm = vec4(.3, .3, 0., 1.) + .45 * colorSurface;
    vec4 colorCool = vec4(0.1, 0., 0.1, 1.) + .45 * colorSurface;

    // the direction from the coordinate to the eye (cameraPosition is provided by threejs)
    // vectors pointing to specific locations are always calculated within the pixel shader
    // - cameraPosition must be in world coordinates
    vec3 v = normalize(cameraPosition - v_world_position.xyz);

    // reflection vector
    vec3 r = 2. * dot(n, l) * n - l;
    //r = -1. * reflect(l, n);

    // the warmer to cooler color mix value
    float t = (dot(n, l) + 1.) / 2.;

    // the highlight mix factor
    float s = max(0., (1. * dot(r, v) - .93) * 15.);

    vec4 c = mix(colorCool, colorWarm, t);
    c += mix(c, colorHighlight, s);

    gl_FragColor = vec4(v_normal.x, v_normal.y, v_normal.z, 1.0);
    gl_FragColor = c;
}
