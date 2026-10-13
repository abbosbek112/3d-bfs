import * as THREE from 'three';

/**
 * Manages Three.js Scene, Renderer, Lighting and Background Starfield
 */
export class SceneManager {
  #container;
  #scene;
  #renderer;
  #camera;
  #starfield;
  #ambientLight;
  #dirLight;
  #themePointLight;
  #onResizeBound;

  constructor(container) {
    this.#container = container;
    this.#initScene();
    this.#initRenderer();
    this.#initCamera();
    this.#initLights();
    this.#initStarfield();
    this.#initResizeHandler();
  }

  #initScene() {
    this.#scene = new THREE.Scene();
    this.#scene.background = new THREE.Color(0x02040a);
    this.#scene.fog = new THREE.FogExp2(0x02040a, 0.015);
  }

  #initRenderer() {
    this.#renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.#renderer.setSize(this.#container.clientWidth, this.#container.clientHeight);
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.#renderer.toneMappingExposure = 1.2;
    this.#renderer.shadowMap.enabled = true;
    this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.#container.appendChild(this.#renderer.domElement);
  }

  #initCamera() {
    const aspect = this.#container.clientWidth / this.#container.clientHeight;
    this.#camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    this.#camera.position.set(0, 20, 20);
    this.#camera.lookAt(0, 0, 0);
  }

  #initLights() {
    // Soft dark-blue ambient space illumination
    this.#ambientLight = new THREE.AmbientLight(0x1a2638, 1.2);
    this.#scene.add(this.#ambientLight);

    // Directional key light with soft shadow
    this.#dirLight = new THREE.DirectionalLight(0xddeeff, 1.8);
    this.#dirLight.position.set(15, 30, 20);
    this.#dirLight.castShadow = true;
    this.#dirLight.shadow.mapSize.width = 1024;
    this.#dirLight.shadow.mapSize.height = 1024;
    this.#dirLight.shadow.camera.near = 0.5;
    this.#dirLight.shadow.camera.far = 100;
    const d = 25;
    this.#dirLight.shadow.camera.left = -d;
    this.#dirLight.shadow.camera.right = d;
    this.#dirLight.shadow.camera.top = d;
    this.#dirLight.shadow.camera.bottom = -d;
    this.#scene.add(this.#dirLight);

    // Dynamic accent point light for level theme
    this.#themePointLight = new THREE.PointLight(0x00f0ff, 2.5, 45);
    this.#themePointLight.position.set(0, 10, 0);
    this.#scene.add(this.#themePointLight);
  }

  #initStarfield() {
    const starCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorA = new THREE.Color(0x00f0ff);
    const colorB = new THREE.Color(0x8a2be2);
    const colorC = new THREE.Color(0xffffff);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      positions[idx] = (Math.random() - 0.5) * 200;
      positions[idx + 1] = Math.random() * 80 + 10;
      positions[idx + 2] = (Math.random() - 0.5) * 200;

      const choice = Math.random();
      const col = choice < 0.4 ? colorA : choice < 0.7 ? colorB : colorC;
      colors[idx] = col.r;
      colors[idx + 1] = col.g;
      colors[idx + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.7,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    this.#starfield = new THREE.Points(geometry, material);
    this.#scene.add(this.#starfield);
  }

  #initResizeHandler() {
    this.#onResizeBound = () => this.handleResize();
    window.addEventListener('resize', this.#onResizeBound);
  }

  handleResize() {
    if (!this.#container || !this.#renderer || !this.#camera) return;
    const width = this.#container.clientWidth;
    const height = this.#container.clientHeight;
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(width, height);
  }

  setThemeColor(hexColor) {
    if (this.#themePointLight) {
      this.#themePointLight.color.setHex(hexColor);
    }
  }

  update(deltaTime) {
    if (this.#starfield) {
      this.#starfield.rotation.y += deltaTime * 0.015;
    }
  }

  render() {
    this.#renderer.render(this.#scene, this.#camera);
  }

  get scene() {
    return this.#scene;
  }

  get camera() {
    return this.#camera;
  }

  get renderer() {
    return this.#renderer;
  }

  get container() {
    return this.#container;
  }

  dispose() {
    window.removeEventListener('resize', this.#onResizeBound);
    if (this.#starfield) {
      this.#starfield.geometry.dispose();
      this.#starfield.material.dispose();
    }
    this.#renderer.dispose();
  }
}
