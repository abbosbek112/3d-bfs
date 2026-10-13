import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateRandomMaze, createEmptyGrid } from '../core/mazeGenerator.js';
import { runBFS } from '../core/bfs.js';
import { CELL_TYPES } from '../core/Grid.js';

describe('Maze Generator', () => {
  test('generates valid, guaranteed solvable random mazes', () => {
    for (let i = 0; i < 5; i++) {
      const grid = generateRandomMaze(11, 11);
      assert.equal(grid.rows, 11);
      assert.equal(grid.cols, 11);
      assert.ok(grid.start);
      assert.ok(grid.goal);
      assert.equal(grid.getCell(grid.start.r, grid.start.c), CELL_TYPES.START);
      assert.equal(grid.getCell(grid.goal.r, grid.goal.c), CELL_TYPES.GOAL);

      // Must be solvable
      const bfsResult = runBFS(grid);
      assert.equal(bfsResult.found, true, 'Generated maze must have a valid path');
      assert.ok(bfsResult.shortestPath.length > 2);
    }
  });

  test('creates empty grid with start and goal at boundaries', () => {
    const grid = createEmptyGrid(9, 9);
    assert.equal(grid.rows, 9);
    assert.equal(grid.cols, 9);
    const bfsResult = runBFS(grid);
    assert.equal(bfsResult.found, true);
  });
});
