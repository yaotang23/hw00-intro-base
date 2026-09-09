import {vec3} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

// Each face has its own vertices for sharp edge normals. Subdivision lets
// the vertex shader bend the faces instead of just moving eight corners.
class Cube extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;

  constructor(public center: vec3, public size = 1.8, public subdivisions = 24) {
    super();
    if (!Number.isFinite(size) || size <= 0 || !Number.isInteger(subdivisions) || subdivisions < 1) {
      throw new Error('Cube size must be positive and subdivisions must be a positive integer.');
    }
  }

  create() {
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    // Outward normal and the horizontal direction of each face.
    const faces = [
      [[1, 0, 0], [0, 0, -1]], [[-1, 0, 0], [0, 0, 1]],
      [[0, 1, 0], [1, 0, 0]], [[0, -1, 0], [1, 0, 0]],
      [[0, 0, 1], [1, 0, 0]], [[0, 0, -1], [-1, 0, 0]],
    ];
    const n = this.subdivisions;
    for (const [normal, horizontal] of faces) {
      const vertical = vec3.cross(vec3.create(), normal as vec3, horizontal as vec3);
      const offset = positions.length / 4;
      for (let y = 0; y <= n; y++) {
        for (let x = 0; x <= n; x++) {
          for (let axis = 0; axis < 3; axis++) {
            positions.push(this.center[axis] + this.size * (
              0.5 * normal[axis] + (x / n - 0.5) * horizontal[axis] + (y / n - 0.5) * vertical[axis]
            ));
          }
          positions.push(1);
          normals.push(...normal, 0);
          if (x < n && y < n) {
            const a = offset + y * (n + 1) + x;
            const b = a + 1;
            const c = a + n + 1;
            indices.push(a, b, c, b, c + 1, c);
          }
        }
      }
    }
    this.positions = new Float32Array(positions);
    this.normals = new Float32Array(normals);
    this.indices = new Uint32Array(indices);
    this.count = this.indices.length;
    this.generateIdx();
    this.generatePos();
    this.generateNor();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
  }
}

export default Cube;
