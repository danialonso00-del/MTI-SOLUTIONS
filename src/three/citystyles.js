import * as THREE from 'three';
import { makeModernFacadeTextures } from './moderncity.js';

export const CITY_STYLES = {
  moderno: { id: 'moderno', label: 'Moderno', hint: 'Piedra clara, cristal y jardines urbanos', icon: 'city' },
  foto: { id: 'foto', label: 'Foto aérea', hint: 'Ortofoto real del ICGC', icon: 'camera' },
  maqueta: { id: 'maqueta', label: 'Maqueta', hint: 'Volúmenes limpios, sin fotografía', icon: 'building' },
  tecnico: { id: 'tecnico', label: 'Técnico', hint: 'Plano oscuro de sala de control', icon: 'command' },
};

// Keep each style's palette throughout the lighting transition.
const PALETTES = {
  moderno: { ground: ['#a9b9b9', '#182b38'], roof: ['#c1cbc7', '#4b606d'], wall: ['#f7f3e9', '#718a9d'], road: ['#40535a', '#152a39'], walk: ['#acbbb7', '#344c59'], park: ['#54987f', '#194f46'] },
  foto: { ground: ['#2d3340', '#101a29'], roof: ['#ffffff', '#6a7a8e'], wall: ['#ffffff', '#98a9be'], road: ['#40535a', '#152a39'], walk: ['#acbbb7', '#344c59'], park: ['#54987f', '#194f46'] },
  maqueta: { ground: ['#9caaa9', '#253646'], roof: ['#c4cdcb', '#607181'], wall: ['#dfded5', '#8796a6'], road: ['#58676d', '#253a49'], walk: ['#929f9f', '#475c69'], park: ['#78a78b', '#2a584c'] },
  tecnico: { ground: ['#080f1c', '#080f1c'], roof: ['#1d3147', '#1d3147'], wall: ['#183047', '#183047'], road: ['#0d263c', '#0d263c'], walk: ['#102132', '#102132'], park: ['#113c37', '#113c37'] },
};
Object.values(PALETTES).forEach((p) => Object.keys(p).forEach((key) => { p[key] = p[key].map((c) => new THREE.Color(c)); }));

export function createStyleSwitch(parts) {
  const { groundMats = [], roofMats = [], facadeMat, baseMat, orthoMeshes = [],
    roadsGroup, parksGroup, detailGroup, facadeTextures, roofTextures = [] } = parts;
  const modern = makeModernFacadeTextures();
  const roadMaterials = [];
  roadsGroup?.traverse((o) => { if (o.isMesh) roadMaterials.push({ mat: o.material, road: o.userData.kind === 'asphalt' }); });
  const parkMaterials = [];
  parksGroup?.traverse((o) => { if (o.isMesh) parkMaterials.push(o.material); });
  let current = 'foto';
  let night = 0;
  const white = new THREE.Color('#ffffff');
  const photoNight = new THREE.Color('#65788e');
  const tint = (mat, pair) => mat.color.copy(pair[0]).lerp(pair[1], night);
  const update = (k) => {
    night = k;
    const p = PALETTES[current];
    tint(baseMat, p.ground);
    roofMats.forEach((m) => tint(m, p.roof));
    tint(facadeMat, p.wall);
    groundMats.forEach((m) => m.color.copy(white).lerp(photoNight, k));
    roadMaterials.forEach(({ mat, road }) => tint(mat, road ? p.road : p.walk));
    parkMaterials.forEach((m) => tint(m, p.park));
  };
  const apply = (style) => {
    if (!CITY_STYLES[style]) return current;
    current = style;
    const photo = style === 'foto';
    const technical = style === 'tecnico';
    const textured = photo || style === 'moderno';
    orthoMeshes.forEach((m) => { m.visible = photo; });
    if (detailGroup) detailGroup.visible = Boolean(detailGroup.userData.wanted && photo);
    if (roadsGroup) roadsGroup.visible = !photo;
    if (parksGroup) parksGroup.visible = !photo;
    roofMats.forEach((m, i) => {
      m.map = photo ? roofTextures[i] ?? null : null;
      m.roughness = style === 'moderno' ? 0.72 : 0.9;
      m.metalness = technical ? 0.18 : 0.04;
      m.needsUpdate = true;
    });
    facadeMat.map = style === 'moderno' ? modern.map : photo ? facadeTextures.map : null;
    facadeMat.emissiveMap = style === 'moderno' ? modern.emissiveMap : facadeTextures.emissiveMap;
    facadeMat.emissive.set(style === 'maqueta' ? '#8498af' : '#ffffff');
    facadeMat.roughness = textured ? 0.68 : 0.8;
    facadeMat.metalness = style === 'moderno' ? 0.12 : technical ? 0.22 : 0.02;
    facadeMat.needsUpdate = true;
    roadMaterials.forEach(({ mat, road }) => {
      mat.emissive.set(technical ? (road ? '#298bb2' : '#163f57') : '#000000');
      mat.emissiveIntensity = technical ? (road ? 0.4 : 0.12) : 0;
    });
    update(night);
    return current;
  };
  return { apply, update, get current() { return current; } };
}
