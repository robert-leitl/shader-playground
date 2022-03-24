#define ITEM_COUNT 19

uniform vec2 u_itemPositions[ITEM_COUNT];
uniform vec2 u_resolution;
uniform vec4 u_mouse;
uniform float u_time;

varying vec2 v_uv;

void main()	{
    vec2 uv = v_uv;
    vec3 color = vec3(.0);

    /*float m_dist = 1.;  // minimum distance

    // Iterate through the points positions
    for (int i = 0; i < ITEM_COUNT; i++) {
        float dist = distance(uv, u_itemPositions[i]);

        // Keep the closer distance
        m_dist = min(m_dist, dist);
    }

    // Draw the min distance (distance field)
    color += m_dist;*/

    //color -= step(.7,abs(sin(50.0*m_dist)))*.3;

    gl_FragColor = vec4(1., 0., 0., 1.);
}
