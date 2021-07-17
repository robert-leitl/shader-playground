#define CELL_COUNT 12

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;
uniform sampler2D u_t2;
uniform sampler2D u_t3;
uniform sampler2D u_t4;
uniform sampler2D u_t5;
uniform sampler2D u_t6;
uniform vec2 u_itemPositions[CELL_COUNT];

// see https://www.shadertoy.com/view/ll3GRM
vec4 Voronoi(in vec2 p){
    vec3 d = vec3(1.);
    float r = 0.;
    float min_r = 1.;
    vec2 item = vec2(0., 0.);
    int itemIndex = 0;

    for (int i = 0; i < CELL_COUNT; i++) {
        vec2 o = u_itemPositions[i] - p;
        r = dot(o, o);

        // 1st, 2nd and 3rd nearest squared distances.
        d.z = max(d.x, max(d.y, min(d.z, r))); // 3rd.
        d.y = max(d.x, min(d.y, r)); // 2nd.
        d.x = min(d.x, r); // Closest.

        if (r < min_r) {
            min_r = r;
            item = vec2(u_itemPositions[i]);
            itemIndex = i;
        }
    }

    d = sqrt(d);
    float h = min(2./(1./max(d.y - d.x, .001) + 1./max(d.z - d.x, .001)), 1.);
    return vec4(h, item, float(itemIndex));
}

void main() {
    vec2 st = gl_FragCoord.xy / max(u_resolution.x, u_resolution.y);
    vec2 uv = v_uv;

    // create the circle mask
    vec2 aspect = u_resolution / max(u_resolution.x, u_resolution.y);
    float centerDistance = length(st * 2. - aspect);
    float radius = 0.55;
    float mask = smoothstep(radius, radius - fwidth(st.x) *  4., centerDistance);

    // get the voronoi color
    vec4 h = Voronoi(st);
    float c = smoothstep(0., fwidth(h.x)*2., h.x - .015);
    vec4 color = vec4(vec3(c), 1.);

    // get the texture from the center of the voronoi
    vec2 textureUv = (st - vec2(h.yz)) * 2.8 + 0.5;
    int textureIndex = int(h.w) % 6;
    vec4 texColor;
    if (textureIndex == 0) {
        texColor = texture2D(u_t1, textureUv);
    } else if (textureIndex == 1) {
        texColor = texture2D(u_t2, textureUv);
    } else if (textureIndex == 2) {
        texColor = texture2D(u_t3, textureUv);
    } else if (textureIndex == 3) {
        texColor = texture2D(u_t4, textureUv);
    } else if (textureIndex == 4) {
        texColor = texture2D(u_t5, textureUv);
    } else if (textureIndex == 5) {
        texColor = texture2D(u_t6, textureUv);
    }
    float glow = 1. + (1. - smoothstep(0., .06, h.x)) * .4;
    color *= texColor * glow;

    color *= mask;
    gl_FragColor = color;
}
