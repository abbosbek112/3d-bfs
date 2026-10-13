import * as THREE from 'three';
import { runBFS } from '../core/bfs.js';
import { CELL_TYPES } from '../core/Grid.js';
import { LEVELS, getLevelGrid } from '../core/levels.js';
import { generateRandomMaze, createEmptyGrid } from '../core/mazeGenerator.js';
import { Visualizer } from './Visualizer.js';
import { CAMERA_MODES } from '../gfx/CameraController.js';

export const GAME_MODES = Object.freeze({
  CHALLENGE: 'CHALLENGE',
  OBSERVE: 'OBSERVE',
  MANUAL: 'MANUAL',
  EDITOR: 'EDITOR'
});

export class GameController {
  #sceneMgr;
  #mazeRenderer;
  #robot;
  #camCtrl;
  #sound;
  #particles;
  #ui;
  #visualizer;

  #currentMode = GAME_MODES.CHALLENGE;
  #currentLevelIndex = 0;
  #grid = null;
  #editorTool = 'WALL'; // 'WALL', 'START', 'GOAL', 'EMPTY'

  // Gameplay metrics
  #movesCount = 0;
  #elapsedSeconds = 0;
  #timerActive = false;
  #timerInterval = null;

  // Raycasting for editor
  #raycaster = new THREE.Raycaster();
  #mouse = new THREE.Vector2();
  #onKeyDownBound;
  #onPointerDownBound;

  constructor({ sceneMgr, mazeRenderer, robot, camCtrl, sound, particles }) {
    this.#sceneMgr = sceneMgr;
    this.#mazeRenderer = mazeRenderer;
    this.#robot = robot;
    this.#camCtrl = camCtrl;
    this.#sound = sound;
    this.#particles = particles;

    this.#visualizer = new Visualizer({
      mazeRenderer: this.#mazeRenderer,
      robot: this.#robot,
      sound: this.#sound,
      onInspectorUpdate: (event, stats) => this.#onInspectorUpdate(event, stats),
      onComplete: (result) => this.#onVisualizerComplete(result)
    });

    this.#initInputs();
    this.loadLevel(0);
  }

  setUI(ui) {
    this.#ui = ui;
    this.#syncUI();
  }

  #initInputs() {
    this.#onKeyDownBound = (e) => this.#handleKeyDown(e);
    window.addEventListener('keydown', this.#onKeyDownBound);

    this.#onPointerDownBound = (e) => this.#handlePointerDown(e);
    this.#sceneMgr.container.addEventListener('pointerdown', this.#onPointerDownBound);
  }

  loadLevel(levelIndex) {
    this.#currentLevelIndex = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
    const lvl = LEVELS[this.#currentLevelIndex];

    this.#grid = getLevelGrid(this.#currentLevelIndex);
    this.#sceneMgr.setThemeColor(lvl.theme.primaryColor);
    this.#mazeRenderer.build(this.#grid, lvl.theme);
    this.#camCtrl.setMazeCenter(this.#mazeRenderer.center, this.#mazeRenderer.boundsRadius);

    if (this.#grid.start) {
      this.#robot.teleportToCell(
        this.#grid.start.r,
        this.#grid.start.c,
        this.#mazeRenderer.cellSize,
        this.#mazeRenderer.gridOffset
      );
    }

    this.#resetMetrics();
    this.#visualizer.reset();

    // Pre-calculate BFS for stats preview
    const bfs = runBFS(this.#grid);
    this.#visualizer.loadBFS(bfs);

    if (this.#ui) {
      this.#syncUI();
    }
  }

  setMode(mode) {
    if (!Object.values(GAME_MODES).includes(mode)) return;
    this.#currentMode = mode;
    this.#visualizer.reset();
    this.#resetMetrics();

    if (mode === GAME_MODES.MANUAL || mode === GAME_MODES.CHALLENGE) {
      this.#timerActive = true;
    } else {
      this.#timerActive = false;
    }

    // Default camera per mode
    if (mode === GAME_MODES.EDITOR) {
      this.#camCtrl.setMode(CAMERA_MODES.TOPDOWN);
    } else if (mode === GAME_MODES.MANUAL) {
      this.#camCtrl.setMode(CAMERA_MODES.FOLLOW);
    } else {
      this.#camCtrl.setMode(CAMERA_MODES.ORBIT);
    }

    if (this.#ui) {
      this.#syncUI();
    }
  }

  setEditorTool(tool) {
    this.#editorTool = tool;
  }

  generateCustomMaze() {
    this.#grid = generateRandomMaze(13, 13, 0.2);
    this.#mazeRenderer.build(this.#grid, LEVELS[0].theme);
    this.#camCtrl.setMazeCenter(this.#mazeRenderer.center, this.#mazeRenderer.boundsRadius);
    if (this.#grid.start) {
      this.#robot.teleportToCell(
        this.#grid.start.r,
        this.#grid.start.c,
        this.#mazeRenderer.cellSize,
        this.#mazeRenderer.gridOffset
      );
    }
    const bfs = runBFS(this.#grid);
    this.#visualizer.loadBFS(bfs);
    this.#syncUI();
  }

  clearCustomMaze() {
    this.#grid = createEmptyGrid(11, 11);
    this.#mazeRenderer.build(this.#grid, LEVELS[0].theme);
    if (this.#grid.start) {
      this.#robot.teleportToCell(
        this.#grid.start.r,
        this.#grid.start.c,
        this.#mazeRenderer.cellSize,
        this.#mazeRenderer.gridOffset
      );
    }
    const bfs = runBFS(this.#grid);
    this.#visualizer.loadBFS(bfs);
    this.#syncUI();
  }

  startBFS() {
    if (!this.#grid) return;
    const bfs = runBFS(this.#grid);
    this.#visualizer.loadBFS(bfs);
    this.#visualizer.start();
  }

  pauseBFS() {
    this.#visualizer.pause();
  }

  resumeBFS() {
    this.#visualizer.resume();
  }

  stepBFS() {
    this.#visualizer.stepForward();
  }

  setSpeed(speed) {
    this.#visualizer.setSpeed(speed);
  }

  resetCurrent() {
    this.loadLevel(this.#currentLevelIndex);
  }

  #handleKeyDown(e) {
    this.#sound.unlock();

    // Ignore if not in manual/challenge mode or if robot is currently animating move
    if (this.#currentMode !== GAME_MODES.MANUAL && this.#currentMode !== GAME_MODES.CHALLENGE) {
      return;
    }
    if (this.#robot.isMoving) return;

    let dr = 0;
    let dc = 0;

    switch (e.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        dr = -1;
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        dr = 1;
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        dc = -1;
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        dc = 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.#moveRobotManual(dr, dc);
  }

  #moveRobotManual(dr, dc) {
    const curr = this.#robot.gridPos;
    const targetR = curr.r + dr;
    const targetC = curr.c + dc;

    if (!this.#grid.isWalkable(targetR, targetC)) {
      this.#sound.playError();
      this.#robot.triggerBump();
      return;
    }

    this.#movesCount++;
    this.#sound.playStep();

    this.#robot.moveToCell(
      targetR,
      targetC,
      this.#mazeRenderer.cellSize,
      this.#mazeRenderer.gridOffset,
      () => {
        // Check goal reached
        if (this.#grid.goal && targetR === this.#grid.goal.r && targetC === this.#grid.goal.c) {
          this.#onManualVictory();
        }
      }
    );

    if (this.#ui) {
      this.#ui.updateGameplayStats({
        moves: this.#movesCount,
        elapsedSeconds: this.#elapsedSeconds
      });
    }
  }

  #onManualVictory() {
    this.#timerActive = false;
    this.#sound.playVictory();
    this.#robot.triggerVictory();

    const bfs = runBFS(this.#grid);
    const optimalSteps = bfs.shortestPath ? bfs.shortestPath.length - 1 : this.#movesCount;

    if (this.#ui) {
      this.#ui.showVictoryModal({
        level: LEVELS[this.#currentLevelIndex],
        playerMoves: this.#movesCount,
        optimalMoves: optimalSteps,
        elapsedSeconds: this.#elapsedSeconds,
        hasNextLevel: this.#currentLevelIndex < LEVELS.length - 1
      });
    }
  }

  #handlePointerDown(e) {
    this.#sound.unlock();

    if (this.#currentMode !== GAME_MODES.EDITOR) return;
    if (e.button !== 0) return; // Left click only

    const rect = this.#sceneMgr.container.getBoundingClientRect();
    this.#mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.#mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.#raycaster.setFromCamera(this.#mouse, this.#sceneMgr.camera);
    const tileData = this.#mazeRenderer.getTileAtRay(this.#raycaster);

    if (tileData) {
      const { r, c } = tileData;
      let newGrid;

      if (this.#editorTool === 'WALL') {
        const currentType = this.#grid.getCell(r, c);
        const nextType = currentType === CELL_TYPES.WALL ? CELL_TYPES.EMPTY : CELL_TYPES.WALL;
        newGrid = this.#grid.withCell(r, c, nextType);
      } else if (this.#editorTool === 'START') {
        newGrid = this.#grid.withStart(r, c);
      } else if (this.#editorTool === 'GOAL') {
        newGrid = this.#grid.withGoal(r, c);
      } else if (this.#editorTool === 'EMPTY') {
        newGrid = this.#grid.withCell(r, c, CELL_TYPES.EMPTY);
      }

      if (newGrid) {
        this.#sound.playClick();
        this.#grid = newGrid;
        this.#mazeRenderer.build(this.#grid, LEVELS[0].theme);
        if (this.#grid.start) {
          this.#robot.teleportToCell(
            this.#grid.start.r,
            this.#grid.start.c,
            this.#mazeRenderer.cellSize,
            this.#mazeRenderer.gridOffset
          );
        }
        const bfs = runBFS(this.#grid);
        this.#visualizer.loadBFS(bfs);
        this.#syncUI();
      }
    }
  }

  #resetMetrics() {
    this.#movesCount = 0;
    this.#elapsedSeconds = 0;
    clearInterval(this.#timerInterval);
    this.#timerInterval = setInterval(() => {
      if (this.#timerActive) {
        this.#elapsedSeconds++;
        if (this.#ui) {
          this.#ui.updateGameplayStats({
            moves: this.#movesCount,
            elapsedSeconds: this.#elapsedSeconds
          });
        }
      }
    }, 1000);
  }

  #onInspectorUpdate(event, stats) {
    if (this.#ui) {
      this.#ui.updateInspector(event, stats);
    }
  }

  #onVisualizerComplete(result) {
    if (result.success && this.#currentMode === GAME_MODES.CHALLENGE) {
      this.#onManualVictory();
    }
  }

  #syncUI() {
    if (!this.#ui) return;
    const lvl = LEVELS[this.#currentLevelIndex];
    const bfs = runBFS(this.#grid);

    this.#ui.updateHeader({
      level: lvl,
      mode: this.#currentMode,
      totalCells: this.#grid.rows * this.#grid.cols,
      start: this.#grid.start,
      goal: this.#grid.goal,
      pathLength: bfs.shortestPath ? bfs.shortestPath.length : 0
    });
  }

  nextLevel() {
    if (this.#currentLevelIndex < LEVELS.length - 1) {
      this.loadLevel(this.#currentLevelIndex + 1);
    }
  }

  get mode() {
    return this.#currentMode;
  }

  get levelIndex() {
    return this.#currentLevelIndex;
  }

  dispose() {
    window.removeEventListener('keydown', this.#onKeyDownBound);
    this.#sceneMgr.container.removeEventListener('pointerdown', this.#onPointerDownBound);
    clearInterval(this.#timerInterval);
  }
}
