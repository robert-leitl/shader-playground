#define ITEM_COUNT 19

uniform vec2 u_itemPositions[ITEM_COUNT];

varying vec2 v_uv;

void main() {
    v_uv = uv;
    vec3 pos = position;

    float m_dist = 1.;  // minimum distance
    // Iterate through the points positions
    for (int i = 0; i < ITEM_COUNT; i++) {
        float dist = distance(uv, u_itemPositions[i]);
        // Keep the closer distance
        m_dist = min(m_dist, dist);
    }
    pos.z += 1. - m_dist;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
