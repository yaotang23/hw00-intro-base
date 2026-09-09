#version 300 es
precision highp float;

uniform vec4 u_Color;
uniform float u_Time;
uniform float u_NoiseScale;
in vec3 fs_ObjectPos;
in vec3 fs_WorldPos;
in vec3 fs_Normal;
out vec4 out_Col;

vec3 gradient(vec3 lattice) {
    // Hash all three lattice coordinates into a repeatable gradient direction.
    vec3 h = vec3(dot(lattice, vec3(127.1, 311.7, 74.7)),
                  dot(lattice, vec3(269.5, 183.3, 246.1)),
                  dot(lattice, vec3(113.5, 271.9, 124.6)));
    vec3 g = 2.0 * fract(sin(h) * 43758.5453) - 1.0;
    return g / max(length(g), 0.0001);
}

float perlin3D(vec3 p) {
    vec3 cell = floor(p);
    vec3 f = fract(p);
    // Quintic fade has zero first and second derivatives at lattice boundaries.
    vec3 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float n000 = dot(gradient(cell + vec3(0, 0, 0)), f - vec3(0, 0, 0));
    float n100 = dot(gradient(cell + vec3(1, 0, 0)), f - vec3(1, 0, 0));
    float n010 = dot(gradient(cell + vec3(0, 1, 0)), f - vec3(0, 1, 0));
    float n110 = dot(gradient(cell + vec3(1, 1, 0)), f - vec3(1, 1, 0));
    float n001 = dot(gradient(cell + vec3(0, 0, 1)), f - vec3(0, 0, 1));
    float n101 = dot(gradient(cell + vec3(1, 0, 1)), f - vec3(1, 0, 1));
    float n011 = dot(gradient(cell + vec3(0, 1, 1)), f - vec3(0, 1, 1));
    float n111 = dot(gradient(cell + vec3(1, 1, 1)), f - vec3(1, 1, 1));
    return mix(mix(mix(n000, n100, w.x), mix(n010, n110, w.x), w.y),
               mix(mix(n001, n101, w.x), mix(n011, n111, w.x), w.y), w.z);
}

float fbm(vec3 p) {
    float sum = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave++) {
        sum += amplitude * perlin3D(p);
        p = p * 2.03 + vec3(17.1, 9.2, 13.7);
        amplitude *= 0.5;
    }
    return sum;
}

void main() {
    // Object-space xyz makes a solid texture continuous across cube faces.
    vec3 p = fs_ObjectPos * u_NoiseScale;
    p += vec3(0.0, 0.045 * u_Time, 0.025 * u_Time);
    float warp = fbm(p + vec3(1.7, 4.6, 8.2));
    float clouds = fbm(p + 1.5 * warp);
    float bands = 0.5 + 0.5 * sin(4.0 * p.y + 9.0 * clouds + 3.0 * warp);
    vec3 ink = u_Color.rgb * 0.19 + vec3(0.012, 0.025, 0.04);
    vec3 stone = mix(ink, u_Color.rgb, smoothstep(0.12, 0.75, bands));
    stone = mix(stone, vec3(0.88, 0.92, 0.79), 0.8 * smoothstep(0.78, 0.97, bands));
    float veinWidth = max(0.035, 1.5 * fwidth(bands));
    float vein = 1.0 - smoothstep(0.025, 0.025 + veinWidth, abs(bands - 0.63));
    stone = mix(stone, vec3(0.95, 0.49, 0.30), 0.8 * vein);

    vec3 normal = normalize(fs_Normal);
    vec3 light = normalize(vec3(-3.0, 6.0, 5.0) - fs_WorldPos);
    float diffuse = max(dot(normal, light), 0.0);
    float fill = max(dot(normal, normalize(vec3(2.0, 1.0, -3.0))), 0.0);
    vec3 color = stone * (0.36 + 0.72 * diffuse) + u_Color.rgb * 0.12 * fill;
    out_Col = vec4(color, u_Color.a);
}
