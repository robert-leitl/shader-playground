varying vec2 v_uv;
varying vec3 v_normal;

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

void main() {
    #include <begin_vertex>
    #include <project_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>

    v_uv = uv;
    v_normal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    //gl_Position = vec4(position, 1.0);
}
