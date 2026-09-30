import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Small, locally generated materials; no external image requests. */
export function makeModernFacadeTextures() {
  const canvas = document.createElement('canvas');
  const glow = document.createElement('canvas');
  canvas.width = canvas.height = glow.width = glow.height = 256;
  const ctx = canvas.getContext('2d');
  const lights = glow.getContext('2d');
  ctx.fillStyle = '#d8ded8';
  ctx.fillRect(0, 0, 256, 256);
  lights.fillStyle = '#000000';
  lights.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const px = x * 64;
      const py = y * 64;
      ctx.fillStyle = '#f1efe4';
      ctx.fillRect(px, py + 59, 64, 5);
      ctx.fillStyle = '#a6b4b3';
      ctx.fillRect(px + 10, py + 9, 44, 44);
      const glass = ctx.createLinearGradient(0, py + 10, 0, py + 51);
      glass.addColorStop(0, '#8da9ad');
      glass.addColorStop(0.5, '#afc4c1');
      glass.addColorStop(1, '#758e94');
      ctx.fillStyle = glass;
      ctx.fillRect(px + 12, py + 11, 40, 40);
      ctx.fillStyle = '#cbd4cb';
      ctx.fillRect(px + 31, py + 11, 2, 40);
      if ((x * 7 + y * 3) % 5 < 3) {
        lights.fillStyle = (x + y) % 3 ? '#ffcb80' : '#a9d9ea';
        lights.fillRect(px + 12, py + 11, 18, 40);
        lights.fillRect(px + 33, py + 11, 19, 40);
      }
    }
  }
  const texture = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return { map: texture(canvas), emissiveMap: texture(glow) };
}

const flowVertex = `
  attribute float distanceAlong;
  attribute float routeSeed;
  varying float vDistance;
  varying float vSeed;
  void main() {
    vDistance = distanceAlong;
    vSeed = routeSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const flowFragment = `
  uniform float time;
  uniform float opacity;
  uniform vec3 color;
  varying float vDistance;
  varying float vSeed;
  void main() {
    float phase = fract(vDistance / 160.0 - time * 0.18 + vSeed);
    float trail = smoothstep(0.64, 0.91, phase) * (1.0 - smoothstep(0.96, 1.0, phase));
    gl_FragColor = vec4(color * (1.0 + trail * 0.5), opacity * (0.09 + trail * 0.91));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Batched roof outlines, lane markings, water and animated street flows. */
export function buildCityDetails(data) {
  const root = new THREE.Group();
  root.name = 'city-details';
  const edges = [];
  for (const b of data.buildings) {
    if (b.r.length < 3 || b.h < 8) continue;
    const y = Math.max(b.h, (b.m ?? 0) + 3) + 0.16;
    for (let i = 0; i < b.r.length; i++) {
      const a = b.r[i], c = b.r[(i + 1) % b.r.length];
      edges.push(a[0], y, a[1], c[0], y, c[1]);
    }
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: '#759693', transparent: true, opacity: 0.24, depthWrite: false });
  const outlines = new THREE.LineSegments(edgeGeo, edgeMat);
  root.add(outlines);

  const stripes = [], positions = [], distances = [], seeds = [];
  const mainRoads = data.roads.filter((r) => ['primary', 'secondary', 'tertiary', 'trunk'].includes(r.k));
  mainRoads.forEach((road, index) => {
    let distance = 0;
    for (let i = 1; i < road.p.length; i++) {
      const a = road.p[i - 1], b = road.p[i];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.1) continue;
      const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
      // Carry dash spacing through the complete polyline.
      for (let d = Math.ceil(distance / 12) * 12 - distance; d + 4 < len; d += 12) {
        stripes.push(a[0] + dx * d, 0.24, a[1] + dz * d, a[0] + dx * (d + 4), 0.24, a[1] + dz * (d + 4));
      }
      const width = 0.65;
      const lane = Math.min((road.w ?? 10) * 0.26, 3.4);
      const point = (p, side) => [p[0] - dz * (lane + side * width), 0.32, p[1] + dx * (lane + side * width)];
      const vertices = [point(a, -1), point(a, 1), point(b, -1), point(a, 1), point(b, 1), point(b, -1)];
      vertices.forEach((p, j) => {
        positions.push(...p);
        distances.push(distance + ([2, 4, 5].includes(j) ? len : 0));
        seeds.push((index * 0.618034) % 1);
      });
      distance += len;
    }
  });
  const stripeGeo = new THREE.BufferGeometry();
  stripeGeo.setAttribute('position', new THREE.Float32BufferAttribute(stripes, 3));
  const stripeMat = new THREE.LineBasicMaterial({ color: '#e5e8cf', transparent: true, opacity: 0.38, depthWrite: false });
  const markings = new THREE.LineSegments(stripeGeo, stripeMat);
  root.add(markings);
  const flowGeo = new THREE.BufferGeometry();
  flowGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  flowGeo.setAttribute('distanceAlong', new THREE.Float32BufferAttribute(distances, 1));
  flowGeo.setAttribute('routeSeed', new THREE.Float32BufferAttribute(seeds, 1));
  const flowMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, opacity: { value: 0.6 }, color: { value: new THREE.Color('#65e4d0') } },
    vertexShader: flowVertex, fragmentShader: flowFragment, transparent: true,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const flows = new THREE.Mesh(flowGeo, flowMat);
  root.add(flows);
  const waterGeometries = [];
  for (const area of data.water ?? []) {
    if (area.r.length < 3) continue;
    const shape = new THREE.Shape(area.r.map(([x, z]) => new THREE.Vector2(x, -z)));
    shape.closePath();
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    // Roads crossing water remain visible above the surface.
    geometry.translate(0, 0.03, 0);
    waterGeometries.push(geometry);
  }
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, night: { value: 0 } },
    vertexShader: `
      varying vec2 vWorld;
      void main() {
        vWorld = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vWorld;
      uniform float time;
      uniform float night;
      void main() {
        float ripple = sin(vWorld.x * 0.17 + vWorld.y * 0.11 + time * 0.65)
                     * sin(vWorld.y * 0.09 - vWorld.x * 0.08 + time * 0.4);
        vec3 tint = mix(vec3(0.09, 0.36, 0.38), vec3(0.015, 0.07, 0.12), night);
        tint += smoothstep(0.65, 1.0, ripple) * (1.0 - night * 0.65) * 0.07;
        gl_FragColor = vec4(tint, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const water = waterGeometries.length ? new THREE.Mesh(mergeGeometries(waterGeometries, false), waterMat) : null;
  waterGeometries.forEach((g) => g.dispose());
  if (water) { water.name = 'water-surfaces'; root.add(water); }
  return {
    root,
    update(t, night, state) {
      root.visible = !state.photoMode;
      outlines.visible = state.cityDetails && state.cityStyle !== 'foto';
      markings.visible = state.cityDetails && state.cityStyle !== 'foto';
      flows.visible = state.streetFlow && !state.activeId;
      edgeMat.color.set(state.cityStyle === 'tecnico' ? '#6acfd8' : '#668880');
      edgeMat.opacity = state.cityStyle === 'tecnico' ? 0.3 : 0.18 + night * 0.1;
      flowMat.uniforms.time.value = t;
      flowMat.uniforms.opacity.value = 0.46 + night * 0.3;
      if (water) water.visible = state.cityStyle !== 'foto';
      waterMat.uniforms.time.value = t;
      waterMat.uniforms.night.value = night;
    },
    dispose() {
      [edgeGeo, stripeGeo, flowGeo, edgeMat, stripeMat, flowMat, waterMat].forEach((o) => o.dispose());
      water?.geometry.dispose();
    },
  };
}
