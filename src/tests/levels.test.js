import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, getLevelGrid } from '../core/levels.js';
import { runBFS } from '../core/bfs.js';

describe('Handcrafted Game Levels', () => {
  test('all 5 levels have valid grids and guaranteed BFS shortest path solutions', () => {
    assert.equal(LEVELS.length, 5);

    LEVELS.forEach((lvl, index) => {
      const grid = getLevelGrid(index);
      assert.ok(grid.start, `Level ${lvl.id} must have a start cell`);
      assert.ok(grid.goal, `Level ${lvl.id} must have a goal cell`);

      const result = runBFS(grid);
      assert.equal(result.found, true, `Level ${lvl.id} (${lvl.name}) must be solvable`);
      assert.ok(result.shortestPath.length >= 5, `Level ${lvl.id} path should have substantial length`);
    });
  });
});
