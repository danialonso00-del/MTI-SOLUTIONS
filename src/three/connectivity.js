import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Illustrative links between sampled street nodes, not measured connectivity. */
export function buildConnectivity(city) {
  const root = new THREE.Group();
  root.name = 'connectivity-layer';
  root.visible = false;
  const { extent } = city.bounds;
  const source = city.streetPoints ?? [];
  const nodes = [];
  const width = (extent.maxX - extent.minX) / 7;
  const depth = (extent.maxZ - extent.minZ) / 5;
  const spacing = Math.min(width, depth) * 0.45;
  // Sample every district, including the eastern neighborhoods in the opening view.
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      const x = extent.minX + (col + 0.5) * width;
      const z = extent.minZ + (row + 0.5) * depth;
      let nearest = null, distance = Infinity;
      for (let i = 0; i < source.length; i += 3) {
        const p = source[i];
        const d = (p.x - x) ** 2 + (p.z - z) ** 2;
        if (d < distance) { nearest = p; distance = d; }
      }
      if (!nearest || nodes.some((n) => Math.hypot(n.x - nearest.x, n.z - nearest.z) < spacing)) continue;
      nodes.push(new THREE.Vector3(nearest.x, 8, nearest.z));
    }
  }
  const geoms = [];
  for (let i = 1; i < nodes.length; i++) {
    let nearest = 0;
    for (let j = 1; j < i; j++) {
      if (nodes[j].distanceToSquared(nodes[i]) < nodes[nearest].distanceToSquared(nodes[i])) nearest = j;
    }
    const a = nodes[nearest], b = nodes[i];
    const middle = a.clone().lerp(b, 0.5);
    middle.y = Math.min(320, 80 + a.distanceTo(b) * 0.24);
    const curve = new THREE.QuadraticBezierCurve3(a, middle, b);
    const g = new THREE.TubeGeometry(curve, 48, 1.5, 4, false);
    const seed = new Float32Array(g.attributes.position.count).fill((i * 0.618034) % 1);
    g.setAttribute('routeSeed', new THREE.BufferAttribute(seed, 1));
    geoms.push(g);
  }
  const uniforms = { time: { value: 0 }, opacity: { value: 0 }, color: { value: new THREE.Color('#67e8f9') } };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `
      attribute float routeSeed;
      varying float vProgress;
      varying float vSeed;
      void main() {
        vProgress = uv.x; vSeed = routeSeed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float opacity;
      uniform vec3 color;
      varying float vProgress;
      varying float vSeed;
      void main() {
        float p = fract(vProgress - time * 0.15 + vSeed);
        float packet = smoothstep(0.76, 0.94, p) * (1.0 - smoothstep(0.96, 1.0, p));
        float ends = smoothstep(0.0, 0.05, vProgress) * (1.0 - smoothstep(0.95, 1.0, vProgress));
        gl_FragColor = vec4(color * (1.0 + packet), opacity * (0.18 + packet * 0.82) * ends);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  if (geoms.length) {
    root.add(new THREE.Mesh(mergeGeometries(geoms, false), material));
    geoms.forEach((g) => g.dispose());
  }
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: '#a5f3fc', transparent: true, opacity: 0, depthWrite: false });
  const nodeMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(4, 10, 6), nodeMaterial, nodes.length);
  const dummy = new THREE.Object3D();
  nodes.forEach((p, i) => { dummy.position.copy(p); dummy.updateMatrix(); nodeMesh.setMatrixAt(i, dummy.matrix); });
  nodeMesh.instanceMatrix.needsUpdate = true;
  nodeMesh.computeBoundingSphere();
  root.add(nodeMesh);
  let fade = 0;
  return {
    root,
    update(t, dt, active) {
      fade += ((active ? 1 : 0) - fade) * (1 - Math.exp(-dt * 3));
      root.visible = fade > 0.005;
      uniforms.opacity.value = fade * 0.85;
      uniforms.time.value = t;
      nodeMaterial.opacity = fade * (0.7 + Math.sin(t * 1.8) * 0.15);
    },
    dispose() {
      root.traverse((o) => { o.geometry?.dispose(); });
      material.dispose(); nodeMaterial.dispose();
    },
  };
}
