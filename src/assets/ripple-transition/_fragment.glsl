varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_t1;
uniform vec2 u_t1Scale;
uniform sampler2D u_v1;
uniform vec2 u_v1Scale;

void main() {

    // scale the video proportionally
    vec2 videoUv = (v_uv - vec2(.5)) * u_v1Scale + vec2(.5);
    // flip each second repitition of the texture
    vec2 videoFlip = mod(floor(videoUv), vec2(2.));
    videoUv = abs(videoFlip * vec2(1.) - fract(videoUv));
    vec4 video = texture2D(u_v1, videoUv);

    // scale the image proportionally
    vec2 imageUv = (v_uv - vec2(.5)) * u_t1Scale + vec2(.5);
    vec4 img = texture2D(u_t1, imageUv);

    gl_FragColor = video;
}
