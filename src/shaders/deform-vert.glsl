#version 300 es
precision highp float;

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform float u_Time;
uniform float u_Deformation;
in vec4 vs_Pos;
in vec4 vs_Nor;
out vec3 fs_ObjectPos;
out vec3 fs_WorldPos;
out vec3 fs_Normal;

vec3 deform(vec3 p) {
    // Different heights twist by different amounts: a non-uniform deformation.
    float twist = u_Deformation * 0.55 * sin(1.3 * u_Time + 1.6 * p.y);
    float c = cos(twist);
    float s = sin(twist);
    vec3 q = vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
    q.xz *= 1.0 + 0.14 * u_Deformation * sin(2.5 * p.y - 1.7 * u_Time);
    q.y += 0.12 * u_Deformation * sin(2.2 * p.x + u_Time) * cos(2.2 * p.z - u_Time);
    return q;
}

void main() {
    vec3 p = vs_Pos.xyz;
    vec3 normal = normalize(vs_Nor.xyz);
    vec3 reference = abs(normal.y) < 0.9 ? vec3(0, 1, 0) : vec3(1, 0, 0);
    vec3 tangent = normalize(cross(reference, normal));
    vec3 bitangent = cross(normal, tangent);
    // Differentiate the deformation to keep lighting attached to the bent surface.
    const float epsilon = 0.002;
    vec3 dt = deform(p + epsilon * tangent) - deform(p - epsilon * tangent);
    vec3 db = deform(p + epsilon * bitangent) - deform(p - epsilon * bitangent);
    vec3 deformedNormal = normalize(cross(dt, db));
    vec4 world = u_Model * vec4(deform(p), 1.0);
    fs_ObjectPos = p;
    fs_WorldPos = world.xyz;
    fs_Normal = normalize(mat3(u_ModelInvTr) * deformedNormal);
    gl_Position = u_ViewProj * world;
}
