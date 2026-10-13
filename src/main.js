import * as THREE from 'three';
import { SceneManager } from './gfx/SceneManager.js';
import { MazeRenderer } from './gfx/MazeRenderer.js';
import { RobotNEX } from './gfx/RobotNEX.js';
import { CameraController } from './gfx/CameraController.js';
import { ParticleSystem } from './gfx/ParticleSystem.js';
import { SoundManager } from './audio/SoundManager.js';
import { GameController } from './game/GameController.js';
import { UIManager } from './ui/UIManager.js';

function checkWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

function initGame() {
  if (!checkWebGL()) {
    const container = document.getElementById('canvas-container');
    container.innerHTML = `
      <div style="color: #ff0055; padding: 40px; font-family: monospace; text-align: center;">
        <h2>[XATOLIK] WebGL qo'llab-quvvatlanmadi</h2>
        <p>Iltimos, zamonaviy brauzer yoki apparat tezlatkichini yoqing.</p>
      </div>
    `;
    return;
  }

  const container = document.getElementById('canvas-container');
  const clock = new THREE.Clock();

  // 1. Core Systems
  const sceneMgr = new SceneManager(container);
  const soundMgr = new SoundManager();
  const particleSys = new ParticleSystem(sceneMgr.scene);
  const mazeRenderer = new MazeRenderer(sceneMgr.scene);
  const robotNEX = new RobotNEX(particleSys);

  sceneMgr.scene.add(robotNEX.mesh);

  // 2. Camera Controller
  const camCtrl = new CameraController(sceneMgr.camera, sceneMgr.renderer.domElement);
  camCtrl.setRobot(robotNEX);

  // 3. Game Controller & UI
  const gameCtrl = new GameController({
    sceneMgr,
    mazeRenderer,
    robot: robotNEX,
    camCtrl,
    sound: soundMgr,
    particles: particleSys
  });

  const uiMgr = new UIManager(gameCtrl, soundMgr, camCtrl);
  gameCtrl.setUI(uiMgr);

  // 4. Main Game Loop
  function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1); // Cap delta to prevent tunneling

    sceneMgr.update(deltaTime);
    mazeRenderer.update(deltaTime);
    robotNEX.update(deltaTime);
    particleSys.update(deltaTime);
    camCtrl.update(deltaTime);

    sceneMgr.render();
  }

  animate();
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    initGame();
  } catch (err) {
    console.error('Initialization error:', err);
  }
});
