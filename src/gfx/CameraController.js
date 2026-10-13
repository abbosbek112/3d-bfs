import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const CAMERA_MODES = Object.freeze({
  ORBIT: 'ORBIT',
  FOLLOW: 'FOLLOW',
  TOPDOWN: 'TOPDOWN',
  FIRSTPERSON: 'FIRSTPERSON'
});

/**
 * Multi-mode Camera Controller
 */
export class CameraController {
  #camera;
  #domElement;
  #orbitControls;
  #mode = CAMERA_MODES.ORBIT;
  #targetRobot = null;
  #mazeCenter = new THREE.Vector3(0, 0, 0);
  #mazeRadius = 15;

  constructor(camera, domElement) {
    this.#camera = camera;
    this.#domElement = domElement;
    this.#initOrbitControls();
  }

  #initOrbitControls() {
    this.#orbitControls = new OrbitControls(this.#camera, this.#domElement);
    this.#orbitControls.enableDamping = true;
    this.#orbitControls.dampingFactor = 0.05;
    this.#orbitControls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below floor
    this.#orbitControls.minDistance = 3;
    this.#orbitControls.maxDistance = 60;
  }

  setRobot(robot) {
    this.#targetRobot = robot;
  }

  setMazeCenter(center, radius = 15) {
    this.#mazeCenter.copy(center);
    this.#mazeRadius = radius;
    this.#orbitControls.target.copy(center);
  }

  setMode(newMode) {
    if (!Object.values(CAMERA_MODES).includes(newMode)) {
      console.warn('Unknown camera mode:', newMode);
      return;
    }
    this.#mode = newMode;

    if (this.#mode === CAMERA_MODES.ORBIT) {
      this.#orbitControls.enabled = true;
      this.#orbitControls.target.copy(this.#mazeCenter);
    } else {
      this.#orbitControls.enabled = false;
    }

    if (this.#mode === CAMERA_MODES.TOPDOWN) {
      this.#camera.position.set(this.#mazeCenter.x, this.#mazeRadius * 1.8, this.#mazeCenter.z + 0.01);
      this.#camera.lookAt(this.#mazeCenter);
    }
  }

  get mode() {
    return this.#mode;
  }

  update(deltaTime) {
    if (this.#mode === CAMERA_MODES.ORBIT) {
      this.#orbitControls.update();
      return;
    }

    if (!this.#targetRobot) return;
    const robotPos = this.#targetRobot.position;

    if (this.#mode === CAMERA_MODES.FOLLOW) {
      // Third-person smooth follow
      const followOffset = new THREE.Vector3(0, 4.5, 6.0);
      const targetCamPos = robotPos.clone().add(followOffset);

      this.#camera.position.lerp(targetCamPos, Math.min(1, deltaTime * 5.0));
      const lookTarget = robotPos.clone().add(new THREE.Vector3(0, 0.5, 0));
      this.#camera.lookAt(lookTarget);
    } else if (this.#mode === CAMERA_MODES.TOPDOWN) {
      // Overhead tactical view
      const targetCamPos = new THREE.Vector3(
        this.#mazeCenter.x,
        this.#mazeRadius * 1.8,
        this.#mazeCenter.z + 0.001
      );
      this.#camera.position.lerp(targetCamPos, Math.min(1, deltaTime * 4.0));
      this.#camera.lookAt(this.#mazeCenter);
    } else if (this.#mode === CAMERA_MODES.FIRSTPERSON) {
      // First person view through NEX visor
      const eyeHeight = 0.65 + 0.1;
      const headPos = new THREE.Vector3(robotPos.x, eyeHeight, robotPos.z);
      this.#camera.position.copy(headPos);

      const forwardVector = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.#targetRobot.rotation.y
      );
      const lookTarget = headPos.clone().add(forwardVector);
      this.#camera.lookAt(lookTarget);
    }
  }

  dispose() {
    this.#orbitControls.dispose();
  }
}
