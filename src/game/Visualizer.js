import { BFS_EVENT_TYPES } from '../core/bfs.js';

export const VISUALIZER_STATUS = Object.freeze({
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  WALKING: 'WALKING'
});

/**
 * Event-driven BFS Visualizer Engine
 */
export class Visualizer {
  #mazeRenderer;
  #robot;
  #sound;
  #onInspectorUpdate;
  #onComplete;

  #bfsResult = null;
  #eventIndex = 0;
  #status = VISUALIZER_STATUS.IDLE;
  #speed = 1.0; // Multiplier: 0.5x, 1x, 2x, 5x, 10x
  #stepIntervalMs = 80;
  #timerId = null;

  // Path walking state
  #pathWalkIndex = 0;

  constructor({ mazeRenderer, robot, sound, onInspectorUpdate, onComplete }) {
    this.#mazeRenderer = mazeRenderer;
    this.#robot = robot;
    this.#sound = sound;
    this.#onInspectorUpdate = onInspectorUpdate || (() => {});
    this.#onComplete = onComplete || (() => {});
  }

  loadBFS(bfsResult) {
    this.reset();
    this.#bfsResult = bfsResult;
  }

  start() {
    if (!this.#bfsResult || this.#status === VISUALIZER_STATUS.RUNNING) return;
    this.#status = VISUALIZER_STATUS.RUNNING;
    this.#scheduleNextStep();
  }

  pause() {
    if (this.#status === VISUALIZER_STATUS.RUNNING) {
      this.#status = VISUALIZER_STATUS.PAUSED;
      clearTimeout(this.#timerId);
      this.#timerId = null;
    }
  }

  resume() {
    if (this.#status === VISUALIZER_STATUS.PAUSED) {
      this.#status = VISUALIZER_STATUS.RUNNING;
      this.#scheduleNextStep();
    }
  }

  stepForward() {
    if (this.#status === VISUALIZER_STATUS.RUNNING) {
      this.pause();
    }
    if (this.#bfsResult && this.#eventIndex < this.#bfsResult.events.length) {
      this.#processEvent(this.#bfsResult.events[this.#eventIndex]);
      this.#eventIndex++;
    }
  }

  reset() {
    clearTimeout(this.#timerId);
    this.#timerId = null;
    this.#status = VISUALIZER_STATUS.IDLE;
    this.#eventIndex = 0;
    this.#pathWalkIndex = 0;
    this.#mazeRenderer.resetExplorationHighlights();
  }

  setSpeed(multiplier) {
    this.#speed = Math.max(0.2, Math.min(20, multiplier));
  }

  get status() {
    return this.#status;
  }

  get currentEventIndex() {
    return this.#eventIndex;
  }

  get totalEvents() {
    return this.#bfsResult?.events?.length || 0;
  }

  #scheduleNextStep() {
    if (this.#status !== VISUALIZER_STATUS.RUNNING) return;

    if (this.#eventIndex >= this.#bfsResult.events.length) {
      this.#finishExploration();
      return;
    }

    const event = this.#bfsResult.events[this.#eventIndex];
    this.#processEvent(event);
    this.#eventIndex++;

    const delay = Math.max(8, this.#stepIntervalMs / this.#speed);
    this.#timerId = setTimeout(() => {
      this.#scheduleNextStep();
    }, delay);
  }

  #processEvent(event) {
    switch (event.type) {
      case BFS_EVENT_TYPES.START: {
        this.#sound.playClick();
        break;
      }

      case BFS_EVENT_TYPES.DEQUEUE: {
        this.#mazeRenderer.highlightActiveCell(event.current.r, event.current.c);
        break;
      }

      case BFS_EVENT_TYPES.DISCOVER: {
        this.#mazeRenderer.highlightVisitedCell(event.neighbor.r, event.neighbor.c);
        if (Math.random() < 0.6) {
          this.#sound.playCellScan(event.step);
        }
        break;
      }

      case BFS_EVENT_TYPES.GOAL_FOUND: {
        this.#sound.playTargetFound();
        this.#mazeRenderer.highlightActiveCell(event.current.r, event.current.c);
        break;
      }

      case BFS_EVENT_TYPES.NO_PATH: {
        this.#sound.playError();
        break;
      }
    }

    this.#onInspectorUpdate(event, {
      totalVisited: this.#bfsResult.totalVisited,
      found: this.#bfsResult.found,
      shortestPath: this.#bfsResult.shortestPath
    });
  }

  #finishExploration() {
    if (!this.#bfsResult) return;

    if (this.#bfsResult.found && this.#bfsResult.shortestPath) {
      // Phase 4: Path Reconstruction
      this.#sound.playPathPulse();
      this.#mazeRenderer.renderShortestPath(this.#bfsResult.shortestPath);

      // Phase 5: Robot physical walk
      this.#status = VISUALIZER_STATUS.WALKING;
      this.#pathWalkIndex = 0;
      this.#startRobotWalk();
    } else {
      this.#status = VISUALIZER_STATUS.COMPLETED;
      this.#onComplete({ success: false });
    }
  }

  #startRobotWalk() {
    const path = this.#bfsResult.shortestPath;
    if (!path || this.#pathWalkIndex >= path.length) {
      this.#status = VISUALIZER_STATUS.COMPLETED;
      this.#sound.playVictory();
      this.#robot.triggerVictory();
      this.#onComplete({ success: true, steps: path ? path.length - 1 : 0 });
      return;
    }

    const nextCell = path[this.#pathWalkIndex];
    this.#sound.playStep();
    this.#robot.moveToCell(
      nextCell.r,
      nextCell.c,
      this.#mazeRenderer.cellSize,
      this.#mazeRenderer.gridOffset,
      () => {
        this.#pathWalkIndex++;
        this.#startRobotWalk();
      }
    );
  }
}
