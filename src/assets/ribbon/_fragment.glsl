varying vec2 v_uv;
varying vec3 v_normal;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec3 n = normalize(v_normal);

    vec3 finalColor = vec3(0, 0.75, 0);
    vec3 shadowColor = vec3(0, 0, 0);
    float shadowPower = 0.5;

    gl_FragColor = vec4(v_uv.x, v_uv.y, 1.0, 1.0);
    gl_FragColor = vec4(0., 0., .0, 1.0);
    gl_FragColor = vec4(n, 1.0);

    //gl_FragColor = texture2D(u_t1, v_uv);

    gl_FragColor = vec4( mix(finalColor, shadowColor, (1.0 - getShadowMask() ) * shadowPower), 1.0);
}
