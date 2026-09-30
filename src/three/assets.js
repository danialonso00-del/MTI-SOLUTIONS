import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

/**
 * Biblioteca de modelos 3D (glTF/GLB) descargados de poly.pizza — CC0 y CC-BY.
 * La atribución completa está en CREDITS.md y en el panel de créditos de la app.
 *
 * Cada entrada declara el tamaño real que debe tener dentro de la ciudad
 * (`length` en unidades de mundo, medido sobre el eje mayor horizontal), para
 * que modelos de orígenes distintos convivan a la misma escala.
 */
export const MODELS = {
  'car-hatchback': { url: '/models/car-hatchback.glb', length: 4.4 },
  'car-sedan': { url: '/models/car-sedan.glb', length: 4.6 },
  'car-taxi': { url: '/models/car-taxi.glb', length: 4.5 },
  'car-van': { url: '/models/car-van.glb', length: 5.2 },
  'car-police': { url: '/models/car-police.glb', length: 4.7 },
  'car-ambulance': { url: '/models/car-ambulance.glb', length: 5.4 },
  bus: { url: '/models/bus.glb', length: 11 },
  'truck-waste': { url: '/models/truck-waste.glb', length: 7.4 },
  'cctv-camera': { url: '/models/cctv-camera.glb', length: 1.6 },
  'traffic-light': { url: '/models/traffic-light.glb', length: 1.2, height: 5.2 },
  'street-lamp': { url: '/models/street-lamp.glb', height: 7 },
  'crane-tower': { url: '/models/crane-tower.glb', height: 46 },
  bench: { url: '/models/bench.glb', length: 2.2 },
  'container-a': { url: '/models/container-a.glb', length: 6.4 },
  'container-b': { url: '/models/container-b.glb', length: 6.4 },
  'tree-round': { url: '/models/tree-round.glb', height: 6.5 },
  'tree-pine': { url: '/models/tree-pine.glb', height: 8 },
  'person-man': { url: '/models/person-man.glb', height: 1.75, skinned: true, faceOffset: 0 },
  'person-woman': { url: '/models/person-woman.glb', height: 1.72, skinned: true, faceOffset: Math.PI / 2 },
  'building-block': { url: '/models/building-block.glb', height: 16 },
  'building-office': { url: '/models/building-office.glb', height: 13 },
  'building-tower': { url: '/models/building-tower.glb', height: 30 },
};

const box = new THREE.Box3();
const size = new THREE.Vector3();
const center = new THREE.Vector3();

/**
 * Escala y orienta un modelo: lo apoya en el suelo, lo centra en XZ y alinea su
 * eje mayor con +Z (la dirección de avance que usa el tráfico).
 */
function normalize(object, spec) {
  object.updateWorldMatrix(true, true);
  box.setFromObject(object);
  box.getSize(size);

  // orientar: el lado largo debe quedar sobre Z
  if (!spec.skinned && size.x > size.z * 1.15) {
    object.rotation.y = Math.PI / 2;
    object.updateWorldMatrix(true, true);
    box.setFromObject(object);
    box.getSize(size);
  }

  const scale = spec.height ? spec.height / size.y : spec.length / Math.max(size.z, 0.0001);
  object.scale.multiplyScalar(scale);
  object.updateWorldMatrix(true, true);

  box.setFromObject(object);
  box.getCenter(center);
  object.position.x -= center.x;
  object.position.z -= center.z;
  object.position.y -= box.min.y;
  object.updateWorldMatrix(true, true);
  return object;
}

/** Limpia atributos que impiden fusionar geometrías de orígenes distintos. */
function tidy(geometry, keepUv) {
  for (const name of Object.keys(geometry.attributes)) {
    if (name === 'position' || name === 'normal' || name === 'color') continue;
    if (name === 'uv' && keepUv) continue;
    geometry.deleteAttribute(name);
  }
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  if (keepUv && !geometry.attributes.uv) {
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
  }
  return geometry;
}

/** Hornea el color de cada material en los vértices para poder fusionar todo en una malla. */
function bakeVertexColors(mesh) {
  const g = mesh.geometry.clone();
  g.applyMatrix4(mesh.matrixWorld);
  const count = g.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const groups = g.groups.length ? g.groups : [{ start: 0, count: g.index ? g.index.count : count, materialIndex: 0 }];
  for (const grp of groups) {
    const m = mats[grp.materialIndex] ?? mats[0];
    const c = m?.color ?? new THREE.Color(1, 1, 1);
    const emissive = m?.emissive;
    const r = emissive ? Math.min(1, c.r + emissive.r * 0.6) : c.r;
    const gg = emissive ? Math.min(1, c.g + emissive.g * 0.6) : c.g;
    const b = emissive ? Math.min(1, c.b + emissive.b * 0.6) : c.b;
    const end = grp.start + grp.count;
    for (let i = grp.start; i < end; i++) {
      const v = g.index ? g.index.getX(i) : i;
      colors[v * 3] = r;
      colors[v * 3 + 1] = gg;
      colors[v * 3 + 2] = b;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.clearGroups();
  return tidy(g, false);
}

/**
 * Convierte un modelo cargado en algo instanciable: una única geometría y un
 * único material, para que 60 coches cuesten una sola draw call.
 */
export function toInstanceable(object) {
  const meshes = [];
  object.updateWorldMatrix(true, true);
  object.traverse((o) => {
    if (o.isMesh && o.geometry) meshes.push(o);
  });
  if (!meshes.length) return null;

  const single =
    meshes.length === 1 && !Array.isArray(meshes[0].material) && meshes[0].material?.map;

  if (single) {
    // modelo con atlas de textura: se conserva tal cual
    const m = meshes[0];
    const geometry = tidy(m.geometry.clone().applyMatrix4(m.matrixWorld), true);
    const material = m.material.clone();
    material.side = THREE.FrontSide;
    return { geometry, material };
  }

  const baked = meshes.map(bakeVertexColors);
  const geometry = baked.length === 1 ? baked[0] : mergeGeometries(baked, false);
  const source = meshes[0].material;
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: Array.isArray(source) ? 0.75 : (source?.roughness ?? 0.75),
    metalness: Array.isArray(source) ? 0.05 : (source?.metalness ?? 0.05),
  });
  if (baked.length > 1) baked.forEach((g) => g.dispose?.());
  return { geometry, material };
}

/** InstancedMesh listo para usar a partir de un modelo cargado. */
export function instancedFromModel(model, count) {
  const parts = toInstanceable(model.scene.clone(true));
  if (!parts) return null;
  const mesh = new THREE.InstancedMesh(parts.geometry, parts.material, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

/** Copia animable de un personaje (esqueleto propio, geometría compartida). */
export function spawnCharacter(model) {
  const root = cloneSkinned(model.scene);
  root.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
      o.castShadow = true;
      o.frustumCulled = false;
    }
  });
  const mixer = new THREE.AnimationMixer(root);
  return { root, mixer, animations: model.animations, faceOffset: model.spec?.faceOffset ?? 0 };
}

/** Busca un clip por nombre aproximado ("walk", "idle"…). */
export function findClip(animations, ...names) {
  for (const n of names) {
    const clip = animations.find((a) => a.name.toLowerCase().includes(n.toLowerCase()));
    if (clip) return clip;
  }
  return animations[0] ?? null;
}

/**
 * Carga toda la biblioteca. Nunca lanza: si un modelo falla, la ciudad se
 * dibuja igual con su versión primitiva (la app no se queda en negro en una demo).
 */
/**
 * La última biblioteca cargada. El recorrido corporativo la reutiliza para sus
 * escenas 3D en vez de descargar y procesar los modelos otra vez.
 */
export let sharedLibrary = null;

export async function loadModels(onProgress) {
  const loader = new GLTFLoader();
  const entries = Object.entries(MODELS);
  const library = {};
  let done = 0;

  await Promise.all(
    entries.map(async ([key, spec]) => {
      try {
        const gltf = await loader.loadAsync(spec.url);
        normalize(gltf.scene, spec);
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            if (o.material?.map) o.material.map.anisotropy = 4;
          }
        });
        library[key] = { scene: gltf.scene, animations: gltf.animations, spec };
      } catch (err) {
        console.warn(`[assets] no se pudo cargar ${key}:`, err.message);
        library[key] = null;
      } finally {
        onProgress?.(++done / entries.length);
      }
    })
  );

  sharedLibrary = library;
  return library;
}
