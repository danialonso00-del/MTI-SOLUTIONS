import * as THREE from 'three';

/**
 * Interpolación día → noche.
 * Cada "target" declara qué propiedad de material debe moverse:
 *   { mat, day, night }                  → color
 *   { mat, emissiveDay, emissiveNight }  → emissiveIntensity
 *   { mat, opacityDay, opacityNight }    → opacity
 */
const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

export function applyDayNight(targets, k) {
  for (const t of targets) {
    // grupos de materiales que comparten tinte (ortofoto de suelo y cubiertas)
    if (t.mats) {
      tmpA.setHex(t.colorDay);
      tmpB.setHex(t.colorNight);
      tmpA.lerp(tmpB, k);
      for (const m of t.mats) m.color.copy(tmpA);
      continue;
    }
    if (t.day !== undefined) {
      tmpA.setHex(t.day);
      tmpB.setHex(t.night);
      t.mat.color.copy(tmpA).lerp(tmpB, k);
    }
    if (t.emissiveDay !== undefined) {
      t.mat.emissiveIntensity = THREE.MathUtils.lerp(t.emissiveDay, t.emissiveNight, k);
    }
    if (t.opacityDay !== undefined) {
      t.mat.opacity = THREE.MathUtils.lerp(t.opacityDay, t.opacityNight, k);
    }
  }
}

export const PALETTE = {
  skyDay: new THREE.Color('#7ba7cc'),
  skyNight: new THREE.Color('#050810'),
  fogDay: new THREE.Color('#93b0cc'),
  fogNight: new THREE.Color('#070c18'),
  sunDay: new THREE.Color('#fff4dd'),
  sunNight: new THREE.Color('#5b73b8'),
  hemiSkyDay: new THREE.Color('#bcd6f2'),
  hemiSkyNight: new THREE.Color('#16233f'),
  hemiGroundDay: new THREE.Color('#5b6272'),
  hemiGroundNight: new THREE.Color('#080d18'),
};
