import {mat4, vec3, vec4} from 'gl-matrix';
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import lambertVertSource from './shaders/lambert-vert.glsl?raw';
import lambertFragSource from './shaders/lambert-frag.glsl?raw';
import deformVertSource from './shaders/deform-vert.glsl?raw';
import noiseFragSource from './shaders/noise-frag.glsl?raw';
import './style.css';

const controls = {
  material: '3D marble',
  color: '#30aca3',
  noiseScale: 1.65,
  deformation: 0.85,
  speed: 1.0,
  paused: false,
  tessellations: 4,
  'Reload scene': loadScene,
};

let icosphere: Icosphere;
let cube: Cube;

function loadScene() {
  icosphere?.destroy();
  cube?.destroy();
  icosphere = new Icosphere(vec3.create(), 1.05, controls.tessellations);
  icosphere.create();
  cube = new Cube(vec3.create());
  cube.create();
}

function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const gl = canvas.getContext('webgl2', {antialias: true, alpha: false});
  if (!gl) throw new Error('WebGL 2 is required. Please open this page in a browser with hardware acceleration enabled.');
  setGL(gl);
  loadScene();

  const camera = new Camera(vec3.fromValues(3.5, 2.5, 8.5), vec3.create());
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.035, 0.055, 0.073, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, lambertVertSource),
    new Shader(gl.FRAGMENT_SHADER, lambertFragSource),
  ]);
  const marble = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, deformVertSource),
    new Shader(gl.FRAGMENT_SHADER, noiseFragSource),
  ]);
  const color = vec4.create();
  function updateColor(value: unknown) {
    // Text entry can change dat.GUI's value from RGB to hex (or vice versa).
    // Use its own parser so every format accepted by the picker stays valid.
    const parsed = new DAT.color.Color(value);
    vec4.set(color, parsed.r / 255, parsed.g / 255, parsed.b / 255, 1);
  }
  updateColor(controls.color);
  const gui = new DAT.GUI({width: 270, autoPlace: false});
  document.getElementById('controls').appendChild(gui.domElement);
  gui.add(controls, 'material', ['3D marble', 'Lambert']).name('Material');
  gui.addColor(controls, 'color').name('Surface color').onChange(updateColor);
  gui.add(controls, 'noiseScale', 0.5, 5, 0.05).name('Noise scale');
  gui.add(controls, 'deformation', 0, 1.5, 0.01).name('Cube deformation');
  gui.add(controls, 'speed', 0, 2, 0.05).name('Animation speed');
  gui.add(controls, 'paused').name('Pause animation');
  gui.add(controls, 'tessellations', 0, 6, 1).name('Sphere subdivisions').onFinishChange(loadScene);
  gui.add(controls, 'Reload scene');

  const cubeModel = mat4.fromTranslation(mat4.create(), vec3.fromValues(-1.5, 0, 0));
  mat4.rotateY(cubeModel, cubeModel, -0.3);
  const sphereModel = mat4.fromTranslation(mat4.create(), vec3.fromValues(1.5, 0, 0));
  let elapsed = 0;
  let previous = performance.now();

  function tick(now: number) {
    // Seconds, not frame count: speed is independent of the display refresh rate.
    const delta = Math.min((now - previous) / 1000, 0.1);
    previous = now;
    if (!controls.paused) elapsed += delta * controls.speed;
    camera.update();
    gl.viewport(0, 0, canvas.width, canvas.height);
    renderer.clear();
    const program = controls.material === 'Lambert' ? lambert : marble;
    program.setTime(elapsed);
    program.setNoiseScale(controls.noiseScale);
    program.setDeformation(controls.deformation);
    renderer.render(camera, program, [cube], color, cubeModel);
    program.setDeformation(0);
    renderer.render(camera, program, [icosphere], color, sphereModel);
    requestAnimationFrame(tick);
  }

  function resize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(Math.round(canvas.clientWidth * pixelRatio), Math.round(canvas.clientHeight * pixelRatio));
    camera.setAspectRatio(canvas.clientWidth / canvas.clientHeight);
    // Preserve horizontal room for both objects in a narrow window.
    camera.fovy = 2 * Math.atan(Math.tan(Math.PI / 8) * Math.max(1, 1.4 / camera.aspectRatio));
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(tick);
}

try {
  main();
} catch (error) {
  const message = document.getElementById('error');
  message.hidden = false;
  message.textContent = String(error);
  console.error(error);
}
