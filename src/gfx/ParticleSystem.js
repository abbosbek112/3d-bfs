import * as THREE from 'three';

/**
 * Reusable Particle System for Cybernetic Effects
 */
export class ParticleSystem {
  #scene;
  #thrusterParticles;
  #thrusterGeo;
  #thrusterData = [];
  #burstParticles;
  #burstGeo;
  #burstData = [];

  constructor(scene) {
    this.#scene = scene;
    this.#initThrusterSystem();
    this.#initBurstSystem();
  }

  #initThrusterSystem() {
    const maxParticles = 200;
    this.#thrusterGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const alphas = new Float32Array(maxParticles);

    this.#thrusterGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.#thrusterGeo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    const material = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.#thrusterParticles = new THREE.Points(this.#thrusterGeo, material);
    this.#scene.add(this.#thrusterParticles);

    for (let i = 0; i < maxParticles; i++) {
      this.#thrusterData.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 0.6
      });
    }
  }

  #initBurstSystem() {
    const maxBurst = 300;
    this.#burstGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxBurst * 3);

    this.#burstGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff0088,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.#burstParticles = new THREE.Points(this.#burstGeo, material);
    this.#scene.add(this.#burstParticles);

    for (let i = 0; i < maxBurst; i++) {
      this.#burstData.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1.5
      });
    }
  }

  emitThruster(pos) {
    const p = this.#thrusterData.find(item => !item.active);
    if (!p) return;

    p.active = true;
    p.x = pos.x + (Math.random() - 0.5) * 0.15;
    p.y = pos.y - 0.1;
    p.z = pos.z + (Math.random() - 0.5) * 0.15;
    p.vx = (Math.random() - 0.5) * 0.3;
    p.vy = -0.6 - Math.random() * 0.4;
    p.vz = (Math.random() - 0.5) * 0.3;
    p.life = 0;
    p.maxLife = 0.4 + Math.random() * 0.3;
  }

  emitVictoryBurst(pos, colorHex = 0x00f0ff) {
    this.#burstParticles.material.color.setHex(colorHex);

    for (let i = 0; i < 150; i++) {
      const p = this.#burstData.find(item => !item.active);
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.0;
      const vY = 2.0 + Math.random() * 5.0;

      p.active = true;
      p.x = pos.x;
      p.y = pos.y + 0.5;
      p.z = pos.z;
      p.vx = Math.cos(angle) * speed;
      p.vy = vY;
      p.vz = Math.sin(angle) * speed;
      p.life = 0;
      p.maxLife = 1.0 + Math.random() * 0.8;
    }
  }

  update(deltaTime) {
    // 1. Update Thrusters
    const tPosAttr = this.#thrusterGeo.attributes.position;
    let tNeedsUpdate = false;

    this.#thrusterData.forEach((p, i) => {
      if (!p.active) {
        tPosAttr.setXYZ(i, 0, -9999, 0);
        return;
      }
      p.life += deltaTime;
      if (p.life >= p.maxLife) {
        p.active = false;
        tPosAttr.setXYZ(i, 0, -9999, 0);
      } else {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.z += p.vz * deltaTime;
        tPosAttr.setXYZ(i, p.x, p.y, p.z);
      }
      tNeedsUpdate = true;
    });

    if (tNeedsUpdate) {
      tPosAttr.needsUpdate = true;
    }

    // 2. Update Bursts
    const bPosAttr = this.#burstGeo.attributes.position;
    let bNeedsUpdate = false;

    this.#burstData.forEach((p, i) => {
      if (!p.active) {
        bPosAttr.setXYZ(i, 0, -9999, 0);
        return;
      }
      p.life += deltaTime;
      if (p.life >= p.maxLife) {
        p.active = false;
        bPosAttr.setXYZ(i, 0, -9999, 0);
      } else {
        p.vy -= 9.8 * deltaTime * 0.5; // Gravity
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.z += p.vz * deltaTime;
        bPosAttr.setXYZ(i, p.x, p.y, p.z);
      }
      bNeedsUpdate = true;
    });

    if (bNeedsUpdate) {
      bPosAttr.needsUpdate = true;
    }
  }

  dispose() {
    this.#scene.remove(this.#thrusterParticles);
    this.#thrusterGeo.dispose();
    this.#thrusterParticles.material.dispose();

    this.#scene.remove(this.#burstParticles);
    this.#burstGeo.dispose();
    this.#burstParticles.material.dispose();
  }
}
