#version 310 es
const vec2 pos[3] = vec2[3](vec2(-1.0f, -1.0f), vec2(-1.0f, 2.0f), vec2(2.0f, -1.0f));
void main() {
  gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
}
