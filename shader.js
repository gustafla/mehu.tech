let canvas = null;
let gl = null;
let program = null;
let timeUniformLocation = null;
let resolutionUniformLocation = null;
let vao = null;

const vertexSrc =
  `#version 300 es
precision highp float;
out vec2 FragCoord;
void main() {
    vec2 c = vec2(-1, 1);
    vec4 coords[4] = vec4[4](c.xxyy, c.yxyy, c.xyyy, c.yyyy);
    FragCoord = coords[gl_VertexID].xy;
    gl_Position = coords[gl_VertexID];
}
`;

const fragmentSrc =
  `#version 300 es
precision highp float;
in vec2 FragCoord;
out vec4 FragColor;
uniform float u_Time;
uniform vec2 u_Resolution;
mat2 rotation(float a) {
  return mat2(
    cos(a), -sin(a),
    sin(a), cos(a)
  );
}
float sine(float x, float f, float t) {
  return cos(x * f + t) * 0.5 + 0.5;
}
float aspectRatio() {
  return u_Resolution.x / u_Resolution.y;
}
float pattern(vec2 uv, float bias) {
  return clamp((cos(uv.x) * cos(uv.y) + bias) * 3., 0., 1.);
}
void main() {
  vec2 uv = vec2(FragCoord.x * aspectRatio(), FragCoord.y);
  uv = rotation(sine(u_Time, 0.12, 0.) * 2.) * uv;
  uv += vec2(sin(FragCoord.y + u_Time * 0.3), sin(FragCoord.x * 0.5 + u_Time * 0.2)) * 0.2;
  uv += vec2(sin(FragCoord.y * 2.22 + u_Time * 0.4), sin(FragCoord.x * 1.11 + u_Time * 0.4)) * 0.1;
  uv *= sine(u_Time, 0.1, u_Time * 0.2) * 50. + 140.;

  vec2 st = vec2(FragCoord.x * aspectRatio(), FragCoord.y) * 1.4;
  st += vec2(sin(FragCoord.y * 0.6 + u_Time * 0.7), sin(FragCoord.x * 0.3 + u_Time * 0.3)) * 0.6;
  st += vec2(sin(FragCoord.y * 2.6 + u_Time * 0.7), sin(FragCoord.x * 4.3 + u_Time * 0.3)) * sine(u_Time, 0.75, 0.) * 2.3;
  float bias = cos(st.x + u_Time) * 0.4 + sin(st.y-u_Time * 0.3) * 0.4 + cos(st.y + u_Time * 0.5) * 0.2;

  vec3 pattern = vec3(pattern(uv, bias));

  vec3 bg = vec3(sin(u_Time + FragCoord.x) * 0.5 + 0.5, 0., 1.);
  FragColor = vec4(mix(bg, pattern, sine(u_Time, 0.9, 2.) * 0.2 + 0.6), 1.);
}
`;

const render = (time) => {
  const second = time * 0.001;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.visibility = 'visible';

  gl.viewport(0, 0, window.innerWidth, window.innerHeight);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform1f(timeUniformLocation, second);
  gl.uniform2f(resolutionUniformLocation, window.innerWidth, window.innerHeight);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindVertexArray(null);

  requestAnimationFrame(render);
}

document.addEventListener("DOMContentLoaded", () => {
  let success = false;

  canvas = document.querySelector("#bgcanvas");
  gl = canvas.getContext("webgl2");
  if (gl === null) {
    return;
  }

  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vert, vertexSrc);
  gl.compileShader(vert);
  success = gl.getShaderParameter(vert, gl.COMPILE_STATUS);
  if (!success) {
    console.error(gl.getShaderInfoLog(vert));
    return;
  }

  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(frag, fragmentSrc);
  gl.compileShader(frag);
  success = gl.getShaderParameter(frag, gl.COMPILE_STATUS);
  if (!success) {
    console.error(gl.getShaderInfoLog(frag));
    return;
  }

  program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  timeUniformLocation = gl.getUniformLocation(program, "u_Time");
  resolutionUniformLocation = gl.getUniformLocation(program, "u_Resolution");

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  requestAnimationFrame(render);
});
