import * as THREE from 'three';

/**
 * Procedural AI Robot NEX
 * Complete procedural geometry, animations, and movement interpolation
 */
export class RobotNEX {
  #group;
  #body;
  #visor;
  #thrusterLight;
  #leftArm;
  #rightArm;
  #particleSystem;

  #currentGridPos = { r: 0, c: 0 };
  #targetGridPos = { r: 0, c: 0 };
  #worldTarget = new THREE.Vector3();
  #isMoving = false;
  #moveSpeed = 4.5;
  #onMoveComplete = null;

  #animTime = 0;
  #state = 'IDLE'; // 'IDLE', 'MOVING', 'VICTORY', 'BUMP'
  #bumpTime = 0;
  #victorySpin = 0;

  constructor(particleSystem) {
    this.#particleSystem = particleSystem;
    this.#buildRobot();
  }

  #buildRobot() {
    this.#group = new THREE.Group();

    // 1. Armor Materials
    const armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2433,
      metalness: 0.85,
      roughness: 0.25
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e3d52,
      metalness: 0.9,
      roughness: 0.15
    });

    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });

    const thrusterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 3.0
    });

    // 2. Main Torso / Head (Spherical capsule shape)
    const bodyGeo = new THREE.SphereGeometry(0.35, 24, 24);
    this.#body = new THREE.Mesh(bodyGeo, armorMaterial);
    this.#body.scale.set(1.0, 1.15, 0.95);
    this.#body.castShadow = true;
    this.#group.add(this.#body);

    // 3. Cybernetic Visor / Eye
    const visorGeo = new THREE.BoxGeometry(0.42, 0.12, 0.18);
    this.#visor = new THREE.Mesh(visorGeo, visorMaterial);
    this.#visor.position.set(0, 0.08, 0.28);
    this.#body.add(this.#visor);

    // Subtle visor eyebrow ridge
    const ridgeGeo = new THREE.BoxGeometry(0.46, 0.04, 0.2);
    const ridge = new THREE.Mesh(ridgeGeo, trimMaterial);
    ridge.position.set(0, 0.16, 0.27);
    this.#body.add(ridge);

    // 4. Robotic Side Arms
    const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
    this.#leftArm = new THREE.Mesh(armGeo, trimMaterial);
    this.#leftArm.position.set(-0.42, -0.05, 0);
    this.#leftArm.rotation.z = Math.PI / 8;
    this.#body.add(this.#leftArm);

    this.#rightArm = new THREE.Mesh(armGeo, trimMaterial);
    this.#rightArm.position.set(0.42, -0.05, 0);
    this.#rightArm.rotation.z = -Math.PI / 8;
    this.#body.add(this.#rightArm);

    // 5. Thruster Base & Light
    const thrusterCone = new THREE.ConeGeometry(0.18, 0.2, 16);
    thrusterCone.rotateX(Math.PI);
    const thrusterMesh = new THREE.Mesh(thrusterCone, thrusterMaterial);
    thrusterMesh.position.set(0, -0.38, 0);
    this.#body.add(thrusterMesh);

    this.#thrusterLight = new THREE.PointLight(0x00f0ff, 2.0, 2.5);
    this.#thrusterLight.position.set(0, -0.5, 0);
    this.#group.add(this.#thrusterLight);

    // Base elevation above ground
    this.#group.position.y = 0.65;
  }

  setWorldPosition(x, z) {
    this.#group.position.x = x;
    this.#group.position.z = z;
    this.#worldTarget.set(x, this.#group.position.y, z);
  }

  teleportToCell(r, c, cellSize = 1.2, gridOffset = { x: 0, z: 0 }) {
    this.#currentGridPos = { r, c };
    this.#targetGridPos = { r, c };
    this.#isMoving = false;
    const x = c * cellSize + gridOffset.x;
    const z = r * cellSize + gridOffset.z;
    this.setWorldPosition(x, z);
    this.#state = 'IDLE';
  }

  moveToCell(r, c, cellSize = 1.2, gridOffset = { x: 0, z: 0 }, onComplete = null) {
    this.#targetGridPos = { r, c };
    const targetX = c * cellSize + gridOffset.x;
    const targetZ = r * cellSize + gridOffset.z;
    this.#worldTarget.set(targetX, 0.65, targetZ);
    this.#isMoving = true;
    this.#state = 'MOVING';
    this.#onMoveComplete = onComplete;
  }

  triggerVictory() {
    this.#state = 'VICTORY';
    this.#victorySpin = 0;
    if (this.#particleSystem) {
      this.#particleSystem.emitVictoryBurst(this.#group.position);
    }
  }

  triggerBump() {
    this.#state = 'BUMP';
    this.#bumpTime = 0.25;
  }

  get gridPos() {
    return { ...this.#currentGridPos };
  }

  get isMoving() {
    return this.#isMoving;
  }

  get mesh() {
    return this.#group;
  }

  get position() {
    return this.#group.position;
  }

  get rotation() {
    return this.#group.rotation;
  }

  update(deltaTime) {
    this.#animTime += deltaTime;

    // Movement interpolation
    if (this.#isMoving) {
      const currentPos = this.#group.position;
      const dx = this.#worldTarget.x - currentPos.x;
      const dz = this.#worldTarget.z - currentPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.05) {
        currentPos.x = this.#worldTarget.x;
        currentPos.z = this.#worldTarget.z;
        this.#currentGridPos = { ...this.#targetGridPos };
        this.#isMoving = false;
        this.#state = 'IDLE';
        if (this.#onMoveComplete) {
          const cb = this.#onMoveComplete;
          this.#onMoveComplete = null;
          cb();
        }
      } else {
        const step = Math.min(dist, this.#moveSpeed * deltaTime);
        currentPos.x += (dx / dist) * step;
        currentPos.z += (dz / dist) * step;

        // Smooth rotation towards movement angle
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - this.#group.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.#group.rotation.y += diff * Math.min(1, deltaTime * 12);

        // Banking tilt during motion
        this.#body.rotation.z = -Math.sin(diff) * 0.25;
        this.#body.rotation.x = 0.15; // Lean forward

        // Thruster sparks
        if (this.#particleSystem && Math.random() < 0.6) {
          this.#particleSystem.emitThruster(this.#group.position);
        }
      }
    }

    // Procedural state animations
    if (this.#state === 'IDLE') {
      const hoverOffset = Math.sin(this.#animTime * 3.5) * 0.08;
      this.#group.position.y = 0.65 + hoverOffset;
      this.#body.rotation.z *= 0.85; // Reset bank
      this.#body.rotation.x = Math.sin(this.#animTime * 2.0) * 0.04;
      this.#leftArm.rotation.x = Math.sin(this.#animTime * 3.0) * 0.1;
      this.#rightArm.rotation.x = -Math.sin(this.#animTime * 3.0) * 0.1;
    } else if (this.#state === 'VICTORY') {
      this.#victorySpin += deltaTime * 8.0;
      this.#group.rotation.y += deltaTime * 8.0;
      this.#group.position.y = 0.8 + Math.abs(Math.sin(this.#animTime * 6.0)) * 0.4;
      this.#body.rotation.z = Math.sin(this.#animTime * 10.0) * 0.2;
    } else if (this.#state === 'BUMP') {
      this.#bumpTime -= deltaTime;
      this.#body.rotation.x = -0.3;
      this.#group.position.y = 0.6 + (Math.random() - 0.5) * 0.05;
      if (this.#bumpTime <= 0) {
        this.#state = 'IDLE';
      }
    }

    // Visor subtle pulsation
    const visorPulse = 1.8 + Math.sin(this.#animTime * 5.0) * 0.5;
    this.#visor.material.emissiveIntensity = visorPulse;
  }

  dispose() {
    this.#body.geometry.dispose();
    this.#body.material.dispose();
    this.#visor.geometry.dispose();
    this.#visor.material.dispose();
  }
}
