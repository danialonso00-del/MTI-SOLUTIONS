import * as THREE from 'three';

const C = (s) => new THREE.Color(s);
const colors = {
  sky: C('#94b9cd'), horizon: C('#dce4dc'), sun: C('#fff5df'),
  duskSky: C('#7c9daf'), duskHorizon: C('#e7bfa0'), duskSun: C('#ffc38c'),
  nightSky: C('#071426'), nightHorizon: C('#23364b'), moon: C('#94b7ed'),
};
export function lightAtHour(hour) {
  const day = THREE.MathUtils.smoothstep(hour, 6.2, 8.3) * (1 - THREE.MathUtils.smoothstep(hour, 19, 21.2));
  const golden = Math.max(Math.exp(-(((hour - 7.4) / 1.5) ** 2)), Math.exp(-(((hour - 19) / 1.9) ** 2)));
  return { night: 1 - day, golden };
}

export function buildAtmosphere() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      zenith: { value: colors.sky.clone() }, horizon: { value: colors.horizon.clone() },
      sunColor: { value: colors.sun.clone() }, sunDirection: { value: new THREE.Vector3(0.4, 0.5, -0.5).normalize() },
      daylight: { value: 1 },
    },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDirection;
      uniform vec3 zenith;
      uniform vec3 horizon;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;
      uniform float daylight;
      void main() {
        vec3 dir = normalize(vDirection);
        float height = pow(max(dir.y, 0.0), 0.48);
        vec3 sky = mix(horizon, zenith, height);
        float sun = max(dot(dir, sunDirection), 0.0);
        sky += sunColor * (pow(sun, 28.0) * 0.11 + pow(sun, 500.0) * 0.32) * daylight;
        gl_FragColor = vec4(sky, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(7000, 24, 12), material);
  mesh.name = 'atmosphere';
  mesh.renderOrder = -20;
  mesh.frustumCulled = false;
  const sky = new THREE.Color(), horizon = new THREE.Color(), sunColor = new THREE.Color();
  return {
    mesh,
    update(camera, hour, night, golden, dt, fog, sunlight) {
      mesh.position.copy(camera.position);
      const alpha = 1 - Math.exp(-dt * 1.8);
      sky.copy(colors.sky).lerp(colors.duskSky, golden).lerp(colors.nightSky, night);
      horizon.copy(colors.horizon).lerp(colors.duskHorizon, golden).lerp(colors.nightHorizon, night);
      sunColor.copy(colors.sun).lerp(colors.duskSun, golden).lerp(colors.moon, night);
      material.uniforms.zenith.value.lerp(sky, alpha);
      material.uniforms.horizon.value.lerp(horizon, alpha);
      material.uniforms.sunColor.value.lerp(sunColor, alpha);
      material.uniforms.daylight.value = 1 - night;
      const azimuth = ((hour - 7) / 13.5) * Math.PI;
      material.uniforms.sunDirection.value.set(Math.cos(azimuth), Math.max(0.08, Math.sin(azimuth)), -0.65).normalize();
      fog.color.copy(material.uniforms.horizon.value);
      if (sunlight) sunlight.color.lerp(sunColor, alpha);
    },
    dispose() { mesh.geometry.dispose(); material.dispose(); },
  };
}
