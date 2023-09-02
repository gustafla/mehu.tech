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
void main() {
  FragColor = vec4(sin(u_Time + FragCoord.x), 0., 1., 1.);
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

window.onload = () => {
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
};
