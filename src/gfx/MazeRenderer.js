import * as THREE from 'three';
import { CELL_TYPES } from '../core/Grid.js';

/**
 * 3D Sci-Fi Maze Renderer for NEON PATHFINDER
 */
export class MazeRenderer {
  #scene;
  #gridGroup;
  #wallsGroup;
  #pathGroup;
  #portalGroup;
  #startPlatform;

  #cellSize = 1.2;
  #gridOffset = { x: 0, z: 0 };
  #currentGrid = null;
  #themeColor = 0x00f0ff;

  // Reusable materials & geometries
  #wallGeo;
  #wallMat;
  #wallTrimMat;
  #floorTiles = new Map(); // "r,c" -> Mesh

  // Portal elements
  #portalOuterRing;
  #portalInnerRing;
  #portalCore;

  // Shortest path line
  #pathLine = null;

  constructor(scene) {
    this.#scene = scene;
    this.#gridGroup = new THREE.Group();
    this.#wallsGroup = new THREE.Group();
    this.#pathGroup = new THREE.Group();
    this.#portalGroup = new THREE.Group();

    this.#scene.add(this.#gridGroup);
    this.#scene.add(this.#wallsGroup);
    this.#scene.add(this.#pathGroup);
    this.#scene.add(this.#portalGroup);

    this.#initSharedMaterials();
  }

  #initSharedMaterials() {
    this.#wallGeo = new THREE.BoxGeometry(this.#cellSize * 0.95, 1.8, this.#cellSize * 0.95);

    this.#wallMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.85,
      roughness: 0.3
    });

    this.#wallTrimMat = new THREE.MeshStandardMaterial({
      color: this.#themeColor,
      emissive: this.#themeColor,
      emissiveIntensity: 1.5,
      metalness: 0.5,
      roughness: 0.2
    });
  }

  build(grid, theme) {
    this.clear();
    this.#currentGrid = grid;
    this.#themeColor = theme?.primaryColor || 0x00f0ff;
    this.#wallTrimMat.color.setHex(this.#themeColor);
    this.#wallTrimMat.emissive.setHex(this.#themeColor);

    const rows = grid.rows;
    const cols = grid.cols;

    this.#gridOffset = {
      x: -((cols - 1) * this.#cellSize) / 2,
      z: -((rows - 1) * this.#cellSize) / 2
    };

    const tileGeo = new THREE.BoxGeometry(this.#cellSize * 0.92, 0.1, this.#cellSize * 0.92);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = grid.getCell(r, c);
        const posX = c * this.#cellSize + this.#gridOffset.x;
        const posZ = r * this.#cellSize + this.#gridOffset.z;

        // 1. Floor Tile
        const tileMat = new THREE.MeshStandardMaterial({
          color: 0x0a101d,
          metalness: 0.7,
          roughness: 0.4
        });
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.position.set(posX, -0.05, posZ);
        tile.receiveShadow = true;
        tile.userData = { r, c, type };
        this.#gridGroup.add(tile);
        this.#floorTiles.set(`${r},${c}`, tile);

        // 2. Wall
        if (type === CELL_TYPES.WALL) {
          this.#buildWallBlock(posX, posZ);
        }
      }
    }

    // 3. Start Platform
    if (grid.start) {
      this.#buildStartPlatform(grid.start.r, grid.start.c);
    }

    // 4. Goal Extraction Portal
    if (grid.goal) {
      this.#buildGoalPortal(grid.goal.r, grid.goal.c);
    }
  }

  #buildWallBlock(x, z) {
    const wallMesh = new THREE.Mesh(this.#wallGeo, this.#wallMat);
    wallMesh.position.set(x, 0.9, z);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;

    // Emissive glowing top trim
    const topTrimGeo = new THREE.BoxGeometry(this.#cellSize * 0.96, 0.08, this.#cellSize * 0.96);
    const topTrim = new THREE.Mesh(topTrimGeo, this.#wallTrimMat);
    topTrim.position.set(0, 0.94, 0);
    wallMesh.add(topTrim);

    this.#wallsGroup.add(wallMesh);
  }

  #buildStartPlatform(r, c) {
    const x = c * this.#cellSize + this.#gridOffset.x;
    const z = r * this.#cellSize + this.#gridOffset.z;

    const ringGeo = new THREE.RingGeometry(0.2, 0.45, 32);
    ringGeo.rotateX(-Math.PI / 2);

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      side: THREE.DoubleSide
    });

    this.#startPlatform = new THREE.Mesh(ringGeo, ringMat);
    this.#startPlatform.position.set(x, 0.02, z);
    this.#gridGroup.add(this.#startPlatform);
  }

  #buildGoalPortal(r, c) {
    const x = c * this.#cellSize + this.#gridOffset.x;
    const z = r * this.#cellSize + this.#gridOffset.z;

    this.#portalGroup.position.set(x, 1.0, z);

    // Outer Gyroscope Ring
    const outerGeo = new THREE.TorusGeometry(0.65, 0.04, 16, 32);
    const portalMat = new THREE.MeshStandardMaterial({
      color: this.#themeColor,
      emissive: this.#themeColor,
      emissiveIntensity: 3.0,
      metalness: 0.9
    });
    this.#portalOuterRing = new THREE.Mesh(outerGeo, portalMat);
    this.#portalGroup.add(this.#portalOuterRing);

    // Inner Gyroscope Ring
    const innerGeo = new THREE.TorusGeometry(0.45, 0.03, 16, 32);
    this.#portalInnerRing = new THREE.Mesh(innerGeo, portalMat);
    this.#portalGroup.add(this.#portalInnerRing);

    // Swirling Energy Core
    const coreGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true
    });
    this.#portalCore = new THREE.Mesh(coreGeo, coreMat);
    this.#portalGroup.add(this.#portalCore);

    // Vertical Extraction Beacon Beam
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.4, 4.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: this.#themeColor,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 1.5, 0);
    this.#portalGroup.add(beam);
  }

  /**
   * Visually highlights a cell visited during BFS exploration
   */
  highlightVisitedCell(r, c) {
    const tile = this.#floorTiles.get(`${r},${c}`);
    if (tile) {
      tile.material.color.setHex(0x004466);
      tile.material.emissive.setHex(0x0099cc);
      tile.material.emissiveIntensity = 0.8;
    }
  }

  /**
   * Pulses active cell being processed by BFS
   */
  highlightActiveCell(r, c) {
    const tile = this.#floorTiles.get(`${r},${c}`);
    if (tile) {
      tile.material.emissive.setHex(0xffffff);
      tile.material.emissiveIntensity = 2.0;
    }
  }

  /**
   * Builds glowing path conduit for the final shortest path
   */
  renderShortestPath(path) {
    this.clearPath();
    if (!path || path.length < 2) return;

    const points = [];
    path.forEach(({ r, c }) => {
      const x = c * this.#cellSize + this.#gridOffset.x;
      const z = r * this.#cellSize + this.#gridOffset.z;
      points.push(new THREE.Vector3(x, 0.12, z));

      // Light up path floor tiles
      const tile = this.#floorTiles.get(`${r},${c}`);
      if (tile) {
        tile.material.color.setHex(0x002244);
        tile.material.emissive.setHex(0x00f0ff);
        tile.material.emissiveIntensity = 1.6;
      }
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, path.length * 4, 0.06, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });

    this.#pathLine = new THREE.Mesh(tubeGeo, tubeMat);
    this.#pathGroup.add(this.#pathLine);
  }

  clearPath() {
    if (this.#pathLine) {
      this.#pathGroup.remove(this.#pathLine);
      this.#pathLine.geometry.dispose();
      this.#pathLine.material.dispose();
      this.#pathLine = null;
    }
  }

  resetExplorationHighlights() {
    this.clearPath();
    this.#floorTiles.forEach((tile) => {
      tile.material.color.setHex(0x0a101d);
      tile.material.emissive.setHex(0x000000);
      tile.material.emissiveIntensity = 0;
    });
  }

  getTileAtRay(raycaster) {
    const tiles = Array.from(this.#floorTiles.values());
    const intersects = raycaster.intersectObjects(tiles, false);
    if (intersects.length > 0) {
      return intersects[0].object.userData; // { r, c, type }
    }
    return null;
  }

  get cellSize() {
    return this.#cellSize;
  }

  get gridOffset() {
    return { ...this.#gridOffset };
  }

  get center() {
    return new THREE.Vector3(0, 0, 0);
  }

  get boundsRadius() {
    if (!this.#currentGrid) return 15;
    return Math.max(this.#currentGrid.rows, this.#currentGrid.cols) * this.#cellSize * 0.7;
  }

  update(deltaTime) {
    // Portal animation
    if (this.#portalOuterRing) {
      this.#portalOuterRing.rotation.x += deltaTime * 1.5;
      this.#portalOuterRing.rotation.y += deltaTime * 2.0;
    }
    if (this.#portalInnerRing) {
      this.#portalInnerRing.rotation.z += deltaTime * -2.2;
      this.#portalInnerRing.rotation.x += deltaTime * -1.8;
    }
    if (this.#portalCore) {
      this.#portalCore.rotation.y += deltaTime * 3.0;
    }
    if (this.#startPlatform) {
      this.#startPlatform.rotation.z += deltaTime * 0.8;
    }
  }

  clear() {
    this.clearPath();

    // Clear floor tiles
    this.#floorTiles.forEach(tile => {
      this.#gridGroup.remove(tile);
      tile.geometry.dispose();
      tile.material.dispose();
    });
    this.#floorTiles.clear();

    // Clear walls
    while (this.#wallsGroup.children.length > 0) {
      const obj = this.#wallsGroup.children[0];
      this.#wallsGroup.remove(obj);
    }

    // Clear portal
    while (this.#portalGroup.children.length > 0) {
      const obj = this.#portalGroup.children[0];
      this.#portalGroup.remove(obj);
    }
  }
}
