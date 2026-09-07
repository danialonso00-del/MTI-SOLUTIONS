import * as THREE from 'three';

/**
 * Monitor en vivo: una segunda cámara colocada en el punto de la cámara CCTV
 * que renderiza la escena a una textura y se muestra como una pantalla flotante
 * junto al panel de datos.
 *
 * Es literalmente "lo que ve la cámara": los peatones, el tráfico y los
 * recuadros de detección aparecen dentro porque son objetos de la escena.
 */

const RT_W = 640;
const RT_H = 360;

export class PovMonitor {
  /**
   * @param {object} opts
   * @param {string} opts.accent  color del marco
   * @param {string} opts.label   rótulo de la pantalla
   */
  constructor({ accent = '#38bdf8', label = 'CÁM 042 · EN VIVO' } = {}) {
    this.accent = accent;
    this.label = label;

    this.target = new THREE.WebGLRenderTarget(RT_W, RT_H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
    this.target.texture.colorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(58, RT_W / RT_H, 0.6, 620);

    this.group = new THREE.Group();
    this.group.renderOrder = 29;

    // marco
    const frameW = 100;
    const frameH = (frameW * RT_H) / RT_W;
    this.baseWidth = frameW;

    const frameMat = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    this.frame = new THREE.Mesh(new THREE.PlaneGeometry(frameW + 2.4, frameH + 2.4), frameMat);
    this.frame.renderOrder = 28;
    this.group.add(this.frame);

    this.screenMat = new THREE.MeshBasicMaterial({
      map: this.target.texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(frameW, frameH), this.screenMat);
    this.screen.renderOrder = 29;
    this.group.add(this.screen);

    // capa de interfaz de la pantalla (rótulo, marcas de esquina, barrido)
    this.hud = document.createElement('canvas');
    this.hud.width = RT_W;
    this.hud.height = RT_H;
    this.hudCtx = this.hud.getContext('2d');
    this.hudTex = new THREE.CanvasTexture(this.hud);
    this.hudTex.colorSpace = THREE.SRGBColorSpace;
    this.hudMat = new THREE.MeshBasicMaterial({
      map: this.hudTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    this.hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(frameW, frameH), this.hudMat);
    this.hudMesh.renderOrder = 30;
    this.group.add(this.hudMesh);

    this.opacity = 0;
    this.target_ = 0;
    this.redrawIn = 0;

    // se coloca justo debajo del panel de datos
    this.anchor = { dist: 130, right: -0.16, up: -0.055, widthFraction: 0.22 };
  }

  show() {
    this.target_ = 1;
  }
  hide() {
    this.target_ = 0;
  }

  /** Coloca la cámara del CCTV. `yaw` es el barrido actual. */
  aim(x, y, z, yaw, pitch = -0.34) {
    this.camera.position.set(x, y, z);
    const dx = Math.sin(yaw);
    const dz = Math.cos(yaw);
    this.camera.lookAt(x + dx * 30, y + Math.tan(pitch) * 30, z + dz * 30);
  }

  /** Renderiza la vista de la cámara. Se llama antes del render principal. */
  renderView(gl, scene, hideDuring = []) {
    if (this.opacity < 0.02) return;
    const prevTarget = gl.getRenderTarget();
    const restore = hideDuring.map((o) => [o, o.visible]);
    hideDuring.forEach((o) => (o.visible = false));
    this.group.visible = false;

    gl.setRenderTarget(this.target);
    gl.render(scene, this.camera);
    gl.setRenderTarget(prevTarget);

    this.group.visible = true;
    restore.forEach(([o, v]) => (o.visible = v));
  }

  update(t, dt, camera) {
    this.opacity += (this.target_ - this.opacity) * Math.min(1, dt * 3.5);
    this.frame.material.opacity = this.opacity * 0.55;
    this.screenMat.opacity = this.opacity;
    this.hudMat.opacity = this.opacity;
    this.group.visible = this.opacity > 0.02;
    if (!this.group.visible) return;

    if (camera) {
      this.group.quaternion.copy(camera.quaternion);
      const { dist, right, up, widthFraction } = this.anchor;
      const halfW = Math.tan((camera.fov * Math.PI) / 360) * dist * camera.aspect;
      this.group.scale.setScalar((halfW * 2 * widthFraction) / this.baseWidth);
      const q = camera.quaternion;
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
      const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
      const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
      this.group.position
        .copy(camera.position)
        .addScaledVector(fwd, dist)
        .addScaledVector(rgt, right * dist)
        .addScaledVector(upv, up * dist);
    }

    this.redrawIn -= dt;
    if (this.redrawIn <= 0) {
      this.redrawIn = 0.12;
      this.drawHud(t);
      this.hudTex.needsUpdate = true;
    }
  }

  drawHud(t) {
    const ctx = this.hudCtx;
    const c = this.accent;
    ctx.clearRect(0, 0, RT_W, RT_H);

    // marcas de esquina
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    const L = 26;
    const m = 14;
    for (const [x, y, sx, sy] of [
      [m, m, 1, 1],
      [RT_W - m, m, -1, 1],
      [m, RT_H - m, 1, -1],
      [RT_W - m, RT_H - m, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * L, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + sy * L);
      ctx.stroke();
    }

    // rótulo
    ctx.fillStyle = 'rgba(4, 10, 18, 0.72)';
    ctx.fillRect(m, m, 216, 30);
    ctx.fillStyle = '#e8f4ff';
    ctx.font = "700 16px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, m + 28, m + 16);
    // testigo de grabación
    const blink = Math.sin(t * 3.2) > -0.1;
    ctx.fillStyle = blink ? '#f43f5e' : 'rgba(244,63,94,0.25)';
    ctx.beginPath();
    ctx.arc(m + 14, m + 15, 6, 0, Math.PI * 2);
    ctx.fill();

    // reloj
    ctx.fillStyle = 'rgba(232,244,255,0.85)';
    ctx.font = "600 14px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = 'right';
    const secs = Math.floor(t) % 60;
    const mins = Math.floor(t / 60) % 60;
    ctx.fillText(`08:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, RT_W - m - 4, m + 16);
    ctx.textAlign = 'left';

    // línea de barrido, muy sutil
    const scan = ((t * 0.35) % 1) * RT_H;
    const grad = ctx.createLinearGradient(0, scan - 30, 0, scan + 30);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.07)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scan - 30, RT_W, 60);
  }

  dispose() {
    this.target.dispose();
    this.hudTex.dispose();
    [this.frame, this.screen, this.hudMesh].forEach((m) => {
      m.geometry.dispose();
      m.material.dispose();
    });
  }
}
