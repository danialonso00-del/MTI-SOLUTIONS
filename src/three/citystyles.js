import * as THREE from 'three';

/**
 * Estilos de ciudad.
 *
 * La misma geometría real, tres lecturas distintas:
 *
 *  · foto     — ortofoto aérea en suelo y cubiertas (el más realista)
 *  · maqueta  — sin fotografía: volúmenes claros sobre calles dibujadas, como
 *               una maqueta de arquitectura. Se lee mejor al señalar cosas y va
 *               mucho más suelto en equipos flojos.
 *  · tecnico  — plano oscuro de sala de control: calles luminosas, edificios
 *               apagados y ventanas encendidas
 *
 * Cambiar de estilo no reconstruye nada: solo intercambia materiales.
 */

export const CITY_STYLES = {
  foto: {
    id: 'foto',
    label: 'Foto aérea',
    hint: 'Ortofoto real del ICGC',
    icon: 'camera',
  },
  maqueta: {
    id: 'maqueta',
    label: 'Maqueta',
    hint: 'Volúmenes limpios, sin fotografía',
    icon: 'building',
  },
  tecnico: {
    id: 'tecnico',
    label: 'Técnico',
    hint: 'Plano oscuro de sala de control',
    icon: 'command',
  },
};

const C = (hex) => new THREE.Color(hex);

/**
 * Crea el conmutador de estilos sobre los materiales ya construidos.
 * @param {object} parts materiales y grupos de la ciudad
 */
export function createStyleSwitch(parts) {
  const {
    groundMats = [],
    roofMats = [],
    facadeMat,
    baseMat,
    orthoMeshes = [],
    roadsGroup,
    parksGroup,
    detailGroup,
    facadeTextures,
    roofTextures,
  } = parts;

  let current = 'foto';

  const setMap = (mat, map) => {
    if (mat.map === map) return;
    mat.map = map;
    mat.needsUpdate = true;
  };

  const apply = (style) => {
    if (!CITY_STYLES[style]) return current;
    current = style;
    const photo = style === 'foto';

    // suelo fotográfico
    orthoMeshes.forEach((m) => (m.visible = photo));
    if (detailGroup) detailGroup.visible = detailGroup.userData.wanted && photo;

    // calles y zonas verdes dibujadas: solo cuando no hay foto
    if (roadsGroup) roadsGroup.visible = !photo;
    if (parksGroup) parksGroup.visible = !photo;

    if (style === 'foto') {
      groundMats.forEach((m) => m.color.set('#ffffff'));
      roofMats.forEach((m, i) => {
        setMap(m, roofTextures[i] ?? null);
        m.color.set('#ffffff');
        m.roughness = 0.94;
        m.metalness = 0;
      });
      setMap(facadeMat, facadeTextures.map);
      facadeMat.color.set('#ffffff');
      facadeMat.emissiveMap = facadeTextures.emissiveMap;
      facadeMat.emissive.set('#ffffff');
      facadeMat.needsUpdate = true;
      facadeMat.roughness = 0.85;
      facadeMat.metalness = 0.02;
      baseMat.color.set('#2d3340');
    }

    if (style === 'maqueta') {
      // el suelo dejaba de ser blanco puro: si no, la maqueta se quema con la
      // luz del sol y se pierde el contraste entre calle y manzana
      groundMats.forEach((m) => m.color.set('#c3cad3'));
      roofMats.forEach((m) => {
        setMap(m, null);
        m.color.set('#bcc3cd');
        m.roughness = 0.92;
        m.metalness = 0;
      });
      setMap(facadeMat, null);
      facadeMat.color.set('#dcd8d0');
      // sin mapa de ventanas, el brillo nocturno se aplicaría a TODA la
      // fachada y la maqueta se quema: se deja un emisivo casi negro
      facadeMat.emissiveMap = null;
      facadeMat.emissive.set('#151a24');
      facadeMat.needsUpdate = true;
      facadeMat.roughness = 0.9;
      facadeMat.metalness = 0;
      baseMat.color.set('#8b93a1');
    }

    if (style === 'tecnico') {
      groundMats.forEach((m) => m.color.set('#070c14'));
      roofMats.forEach((m) => {
        setMap(m, null);
        m.color.set('#16202f');
        m.roughness = 0.6;
        m.metalness = 0.25;
      });
      setMap(facadeMat, null);
      facadeMat.color.set('#0f1826');
      facadeMat.emissiveMap = facadeTextures.emissiveMap;
      facadeMat.emissive.set('#ffffff');
      facadeMat.needsUpdate = true;
      facadeMat.roughness = 0.45;
      facadeMat.metalness = 0.3;
      baseMat.color.set('#070b13');
    }

    // las calles cambian de aspecto con el estilo
    if (roadsGroup) {
      roadsGroup.traverse((o) => {
        if (!o.isMesh) return;
        const road = o.userData.kind === 'asphalt';
        if (style === 'maqueta') {
          o.material.color.copy(C(road ? '#5b6172' : '#8f95a3'));
          o.material.emissive?.set('#000000');
        } else {
          o.material.color.copy(C(road ? '#0a1b2c' : '#0a1420'));
          o.material.emissive?.set(road ? '#0ea5e9' : '#0c4a6e');
          o.material.emissiveIntensity = road ? 1.15 : 0.35;
        }
      });
    }
    if (parksGroup) {
      parksGroup.traverse((o) => {
        if (o.isMesh) o.material.color.copy(C(style === 'maqueta' ? '#7fa98a' : '#0f2a22'));
      });
    }

    return current;
  };

  return { apply, get current() { return current; } };
}
