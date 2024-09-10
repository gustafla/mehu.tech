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

#define EPSILON 0.001
#define PI 3.14159265
#define FOV 90.
#define RADIUS 10.

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
mat3 viewMatrix(vec3 target, vec3 origin) {
    vec3 f = normalize(target - origin);
    vec3 s = normalize(cross(f, vec3(0., 1., 0.)));
    vec3 u = cross(s, f);
    return mat3(s, u, f);
}
vec3 cameraRay() {
    float c = tan((90. - FOV / 2.) * (PI / 180.));
    return normalize(vec3(FragCoord * vec2(aspectRatio(), 1.), c));
}
float pattern(vec2 uv, float bias) {
    return clamp((cos(uv.x) * cos(uv.y) + bias) * 3., 0., 1.);
}
vec3 texture(vec2 uv) {
    uv = rotation(sine(u_Time, 0.12, 0.) * 2.) * uv;
    uv += vec2(sin(FragCoord.y + u_Time * 0.3), sin(FragCoord.x * 0.5 + u_Time * 0.2)) * 0.2;
    uv += vec2(sin(FragCoord.y * 2.22 + u_Time * 0.4), sin(FragCoord.x * 1.11 + u_Time * 0.4)) * 0.1;
    uv *= sine(u_Time, 0.1, u_Time * 0.2) * 50. + 140.;

    vec2 st = vec2(FragCoord.x * aspectRatio(), FragCoord.y) * 1.4;
    st += vec2(sin(FragCoord.y * 0.6 + u_Time * 0.7), sin(FragCoord.x * 0.3 + u_Time * 0.3)) * 0.6;
    st += vec2(sin(FragCoord.y * 2.6 + u_Time * 0.7), sin(FragCoord.x * 4.3 + u_Time * 0.3)) * sine(u_Time, 0.75, 0.) * 2.3;
    float bias = cos(st.x + u_Time) * 0.4 + sin(st.y - u_Time * 0.3) * 0.4 + cos(st.y + u_Time * 0.5) * 0.2;
    bias *= 4.14 * (sine(u_Time, 0.03, 3.14) + 0.2);
    bias = sin(bias);

    vec3 pattern = vec3(pattern(uv, bias));

    vec3 bg = vec3(sin(u_Time + FragCoord.x) * 0.25 + 0.7, 0.5, 1.) * 1.1;
    return mix(bg, pattern, 0.13);
}
float tunnel(vec3 origin, vec3 direction) {
    float a = direction.x * direction.x + direction.y * direction.y;
    float b = 2.0 * (origin.x * direction.x + origin.y * direction.y);
    float c = origin.x * origin.x + origin.y * origin.y - RADIUS * RADIUS;
    float disc = b * b - 4.0 * a * c;
    float t = 0.0;
    if (disc < 0.0)
        return 1000000.0;
    else if (disc < EPSILON)
        return -b / (2.0 * a);
    else
        return min((-b + sqrt(disc)) / (2.0 * a), (-b - sqrt(disc)) / (2.0 * a));
}
float point_light(vec3 pos, vec3 light_pos, vec3 nml, float intensity) {
    float light_dist = distance(light_pos, pos);
    return max(dot(nml, -normalize(pos - light_pos)), 0.) * (intensity / (light_dist * light_dist));
}
void main() {
    vec3 cam_pos = vec3(sin(u_Time * 0.2), sin(u_Time * 0.3), sin(u_Time * 0.4));
    vec3 cam_target = vec3(sin(u_Time * 0.54), sin(u_Time * 0.31), sin(u_Time * 0.14)) / 3. + vec3(0., 0., 3.);

    vec3 ray = viewMatrix(cam_target, cam_pos) * cameraRay();

    vec3 pos = cam_pos + ray * tunnel(cam_pos, ray);
    vec3 nml = normalize(vec3(vec2(0.), pos.z) - pos);
    vec2 uv = vec2(atan(pos.y, pos.x), pos.z / RADIUS);
    uv.x += PI;
    uv.x /= 2. * PI;

    vec4 plights[6] = vec4[](
    vec4(sine(u_Time, 0.23, 0.) * RADIUS * 0.5, sine(u_Time, 0.43, 0.) * RADIUS * 0.5, -sine(u_Time, 0.33, 0.) * 4. - 10., 20.),
    vec4(sine(u_Time, 0.82, 0.) * RADIUS * 0.5, sine(u_Time, 0.53, 0.) * RADIUS * 0.5, -sine(u_Time, 0.35, 0.) * 6. - 16., 40.),
    vec4(sine(u_Time, 0.34, 0.) * RADIUS * 0.5, sine(u_Time, 0.49, 0.) * RADIUS * 0.5, -sine(u_Time, 0.13, 0.) * 80. - 20., 60.),
    vec4(sine(u_Time, 0.19, 0.) * RADIUS * 0.5, sine(u_Time, 0.44, 0.) * RADIUS * 0.5, -sine(u_Time, 0.21, 0.) * 100. - 20., 100.),
    vec4(sine(u_Time, 0.10, 0.) * RADIUS * 0.5, sine(u_Time, 0.53, 0.) * RADIUS * 0.5, -sine(u_Time, 0.54, 0.) * 45. - 20., 60.),
    vec4(sine(u_Time, 0.15, 0.) * RADIUS * 0.5, sine(u_Time, 0.13, 0.) * RADIUS * 0.5, -sine(u_Time, 0.09, 0.) * 43. - 20., 50.)
    );

    float light = 0.;
    for (int i = 0; i < 6; i++) {
        light += point_light(pos, plights[i].xyz, nml, plights[i].w);
    }

    vec3 texture = texture(uv) * sine(uv.x, 2. * PI, PI) + texture(vec2(mod(uv.x + 0.5, 1.), uv.y)) * sine(uv.x, 2. * PI, 0.);
    FragColor = vec4(light * texture, 1.);
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
