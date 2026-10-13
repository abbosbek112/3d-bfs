import { GAME_MODES } from '../game/GameController.js';
import { CAMERA_MODES } from '../gfx/CameraController.js';
import { LEVELS } from '../core/levels.js';
import { BFS_EVENT_TYPES } from '../core/bfs.js';

export class UIManager {
  #game;
  #sound;
  #camCtrl;

  // Cache DOM elements
  #hudLevelTag = document.getElementById('hud-level-tag');
  #hudLevelName = document.getElementById('hud-level-name');
  #hudObjective = document.getElementById('hud-objective');
  #hudTime = document.getElementById('hud-stat-time');
  #hudMoves = document.getElementById('hud-stat-moves');
  #hudOptimal = document.getElementById('hud-stat-optimal');

  #mainMenu = document.getElementById('main-menu-overlay');
  #modalLevels = document.getElementById('modal-levels');
  #modalVictory = document.getElementById('modal-victory');
  #modalHelp = document.getElementById('modal-help');

  #inspectorPanel = document.getElementById('inspector-panel');
  #inspBadge = document.getElementById('inspector-badge');
  #inspStep = document.getElementById('insp-step');
  #inspCurrCell = document.getElementById('insp-curr-cell');
  #inspQueueSize = document.getElementById('insp-queue-size');
  #inspVisitedCount = document.getElementById('insp-visited-count');
  #inspPathLen = document.getElementById('insp-path-len');
  #inspQueuePreview = document.getElementById('insp-queue-preview');
  #inspNeighborsPreview = document.getElementById('insp-neighbors-preview');

  #editorToolbar = document.getElementById('editor-toolbar');
  #visualizerBar = document.getElementById('visualizer-bar');

  #btnCamCycle = document.getElementById('btn-cam-cycle');
  #btnAudioMute = document.getElementById('btn-audio-mute');

  constructor(game, sound, camCtrl) {
    this.#game = game;
    this.#sound = sound;
    this.#camCtrl = camCtrl;

    this.#initMenuButtons();
    this.#initModeButtons();
    this.#initVisualizerButtons();
    this.#initEditorButtons();
    this.#initUtilityButtons();
    this.#buildLevelSelectCards();
  }

  #initMenuButtons() {
    document.getElementById('menu-btn-play').addEventListener('click', () => {
      this.#sound.playClick();
      this.#mainMenu.classList.add('hidden');
      this.#game.setMode(GAME_MODES.CHALLENGE);
    });

    document.getElementById('menu-btn-observe').addEventListener('click', () => {
      this.#sound.playClick();
      this.#mainMenu.classList.add('hidden');
      this.#game.setMode(GAME_MODES.OBSERVE);
    });

    document.getElementById('menu-btn-editor').addEventListener('click', () => {
      this.#sound.playClick();
      this.#mainMenu.classList.add('hidden');
      this.#game.setMode(GAME_MODES.EDITOR);
    });

    document.getElementById('menu-btn-levels').addEventListener('click', () => {
      this.#sound.playClick();
      this.#modalLevels.classList.remove('hidden');
    });

    document.getElementById('menu-btn-help').addEventListener('click', () => {
      this.#sound.playClick();
      this.#modalHelp.classList.remove('hidden');
    });

    document.getElementById('btn-open-menu').addEventListener('click', () => {
      this.#sound.playClick();
      this.#mainMenu.classList.remove('hidden');
    });

    document.getElementById('btn-close-levels').addEventListener('click', () => {
      this.#sound.playClick();
      this.#modalLevels.classList.add('hidden');
    });

    document.getElementById('btn-close-help').addEventListener('click', () => {
      this.#sound.playClick();
      this.#modalHelp.classList.add('hidden');
    });
  }

  #initModeButtons() {
    const modeBtns = {
      [GAME_MODES.CHALLENGE]: document.getElementById('btn-mode-challenge'),
      [GAME_MODES.MANUAL]: document.getElementById('btn-mode-manual'),
      [GAME_MODES.OBSERVE]: document.getElementById('btn-mode-observe'),
      [GAME_MODES.EDITOR]: document.getElementById('btn-mode-editor')
    };

    Object.entries(modeBtns).forEach(([mode, btn]) => {
      btn.addEventListener('click', () => {
        this.#sound.playClick();
        Object.values(modeBtns).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.#game.setMode(mode);
        this.#updateToolbars(mode);
      });
    });
  }

  #updateToolbars(mode) {
    if (mode === GAME_MODES.EDITOR) {
      this.#editorToolbar.classList.remove('hidden');
      this.#visualizerBar.classList.add('hidden');
    } else if (mode === GAME_MODES.OBSERVE) {
      this.#editorToolbar.classList.add('hidden');
      this.#visualizerBar.classList.remove('hidden');
    } else {
      this.#editorToolbar.classList.add('hidden');
      this.#visualizerBar.classList.add('hidden');
    }
  }

  #initVisualizerButtons() {
    document.getElementById('btn-vis-init').addEventListener('click', () => {
      this.#game.startBFS();
      this.#inspBadge.textContent = 'RUNNING';
      this.#inspBadge.style.color = '#00f0ff';
    });

    document.getElementById('btn-vis-pause').addEventListener('click', () => {
      this.#game.pauseBFS();
      this.#inspBadge.textContent = 'PAUSED';
      this.#inspBadge.style.color = '#ffaa00';
    });

    document.getElementById('btn-vis-step').addEventListener('click', () => {
      this.#game.stepBFS();
      this.#inspBadge.textContent = 'STEPPING';
      this.#inspBadge.style.color = '#00ff88';
    });

    document.getElementById('btn-vis-reset').addEventListener('click', () => {
      this.#game.resetCurrent();
      this.#inspBadge.textContent = 'IDLE';
      this.#inspBadge.style.color = '#8b949e';
    });

    const speedInput = document.getElementById('vis-speed');
    const speedLabel = document.getElementById('vis-speed-label');
    speedInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      speedLabel.textContent = `${val}x`;
      this.#game.setSpeed(val);
    });
  }

  #initEditorButtons() {
    const toolBtns = [
      { id: 'btn-tool-wall', tool: 'WALL' },
      { id: 'btn-tool-empty', tool: 'EMPTY' },
      { id: 'btn-tool-start', tool: 'START' },
      { id: 'btn-tool-goal', tool: 'GOAL' }
    ];

    toolBtns.forEach(({ id, tool }) => {
      const btn = document.getElementById(id);
      btn.addEventListener('click', () => {
        this.#sound.playClick();
        toolBtns.forEach(t => document.getElementById(t.id).classList.remove('active'));
        btn.classList.add('active');
        this.#game.setEditorTool(tool);
      });
    });

    document.getElementById('btn-tool-random').addEventListener('click', () => {
      this.#sound.playClick();
      this.#game.generateCustomMaze();
    });

    document.getElementById('btn-tool-clear').addEventListener('click', () => {
      this.#sound.playClick();
      this.#game.clearCustomMaze();
    });

    document.getElementById('btn-tool-solve').addEventListener('click', () => {
      this.#sound.playClick();
      this.#game.setMode(GAME_MODES.OBSERVE);
      this.#updateToolbars(GAME_MODES.OBSERVE);
      document.getElementById('btn-mode-observe').classList.add('active');
      document.getElementById('btn-mode-editor').classList.remove('active');
      this.#game.startBFS();
    });
  }

  #initUtilityButtons() {
    // Camera cycle
    const camModes = [
      CAMERA_MODES.ORBIT,
      CAMERA_MODES.FOLLOW,
      CAMERA_MODES.TOPDOWN,
      CAMERA_MODES.FIRSTPERSON
    ];
    let camIdx = 0;

    this.#btnCamCycle.addEventListener('click', () => {
      this.#sound.playClick();
      camIdx = (camIdx + 1) % camModes.length;
      const nextMode = camModes[camIdx];
      this.#camCtrl.setMode(nextMode);
      this.#btnCamCycle.textContent = `CAM: ${nextMode}`;
    });

    // Inspector drawer toggle
    document.getElementById('btn-toggle-inspector').addEventListener('click', () => {
      this.#sound.playClick();
      this.#inspectorPanel.classList.toggle('hidden');
    });

    // Audio mute toggle
    this.#btnAudioMute.addEventListener('click', () => {
      const muted = this.#sound.toggleMute();
      this.#btnAudioMute.textContent = muted ? 'AUDIO: OFF' : 'AUDIO: ON';
      this.#btnAudioMute.style.color = muted ? '#ff4444' : '#00f0ff';
    });

    // Victory modal buttons
    document.getElementById('btn-vic-replay').addEventListener('click', () => {
      this.#sound.playClick();
      this.#modalVictory.classList.add('hidden');
      this.#game.resetCurrent();
    });

    document.getElementById('btn-vic-next').addEventListener('click', () => {
      this.#sound.playClick();
      this.#modalVictory.classList.add('hidden');
      this.#game.nextLevel();
    });
  }

  #buildLevelSelectCards() {
    const container = document.getElementById('levels-list-container');
    container.innerHTML = '';

    LEVELS.forEach((lvl, idx) => {
      const card = document.createElement('div');
      card.className = 'level-card';
      card.innerHTML = `
        <div>
          <div style="font-weight: 700; color: #fff;">${lvl.id}. ${lvl.name}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${lvl.subtitle}</div>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: ${lvl.theme.glowColor}; border: 1px solid ${lvl.theme.glowColor}; padding: 2px 6px; border-radius: 3px;">
          ${lvl.difficulty}
        </div>
      `;
      card.addEventListener('click', () => {
        this.#sound.playClick();
        this.#modalLevels.classList.add('hidden');
        this.#mainMenu.classList.add('hidden');
        this.#game.loadLevel(idx);
      });
      container.appendChild(card);
    });
  }

  updateHeader({ level, mode, start, goal, pathLength }) {
    this.#hudLevelTag.textContent = `LEVEL 0${level.id} // ${level.theme.name}`;
    this.#hudLevelName.textContent = level.name;
    this.#hudObjective.textContent = level.briefing;
    this.#hudOptimal.textContent = pathLength > 0 ? `${pathLength - 1}` : '--';
  }

  updateGameplayStats({ moves, elapsedSeconds }) {
    this.#hudMoves.textContent = String(moves);
    const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
    this.#hudTime.textContent = `${mins}:${secs}`;
  }

  updateInspector(event, stats) {
    if (event.step !== undefined) {
      this.#inspStep.textContent = String(event.step);
    }

    if (event.current) {
      this.#inspCurrCell.textContent = `(${event.current.r}, ${event.current.c})`;
    } else if (event.neighbor) {
      this.#inspCurrCell.textContent = `(${event.neighbor.r}, ${event.neighbor.c})`;
    }

    if (event.queueSnapshot) {
      this.#inspQueueSize.textContent = String(event.queueSnapshot.length);
      const preview = event.queueSnapshot.slice(0, 8).map(p => `(${p.r},${p.c})`).join(' ');
      this.#inspQueuePreview.textContent = `[${preview}${event.queueSnapshot.length > 8 ? '...' : ''}]`;
    }

    if (event.type === BFS_EVENT_TYPES.DISCOVER) {
      const prev = this.#inspNeighborsPreview.textContent;
      this.#inspNeighborsPreview.textContent = `(${event.neighbor.r},${event.neighbor.c}) <- from (${event.parent.r},${event.parent.c})`;
    }

    this.#inspVisitedCount.textContent = String(stats.totalVisited);
    this.#inspPathLen.textContent = stats.shortestPath ? String(stats.shortestPath.length - 1) : '--';

    if (event.type === BFS_EVENT_TYPES.GOAL_FOUND) {
      this.#inspBadge.textContent = 'GOAL FOUND';
      this.#inspBadge.style.color = '#00ff88';
    } else if (event.type === BFS_EVENT_TYPES.NO_PATH) {
      this.#inspBadge.textContent = 'NO PATH';
      this.#inspBadge.style.color = '#ff4444';
    }
  }

  showVictoryModal({ level, playerMoves, optimalMoves, elapsedSeconds, hasNextLevel }) {
    const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (elapsedSeconds % 60).toString().padStart(2, '0');

    document.getElementById('vic-time').textContent = `${mins}:${secs}`;
    document.getElementById('vic-moves').textContent = String(playerMoves);
    document.getElementById('vic-optimal').textContent = String(optimalMoves);

    const eff = optimalMoves > 0 ? Math.round((optimalMoves / Math.max(optimalMoves, playerMoves)) * 100) : 100;
    document.getElementById('vic-efficiency').textContent = `${eff}%`;

    const nextBtn = document.getElementById('btn-vic-next');
    if (hasNextLevel) {
      nextBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'none';
    }

    this.#modalVictory.classList.remove('hidden');
  }
}
