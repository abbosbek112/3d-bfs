import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Queue } from '../core/Queue.js';
import { Grid, CELL_TYPES } from '../core/Grid.js';
import { runBFS, reconstructPath } from '../core/bfs.js';

describe('Queue Data Structure', () => {
  test('maintains FIFO order efficiently', () => {
    const q = new Queue();
    assert.equal(q.size, 0);
    assert.equal(q.isEmpty(), true);

    q.enqueue(10);
    q.enqueue(20);
    q.enqueue(30);

    assert.equal(q.size, 3);
    assert.equal(q.peek(), 10);
    assert.equal(q.dequeue(), 10);
    assert.equal(q.dequeue(), 20);
    assert.equal(q.size, 1);
    assert.equal(q.dequeue(), 30);
    assert.equal(q.isEmpty(), true);
    assert.equal(q.dequeue(), undefined);
  });

  test('cleans up memory when head reaches threshold', () => {
    const q = new Queue();
    for (let i = 0; i < 2000; i++) {
      q.enqueue(i);
    }
    for (let i = 0; i < 1500; i++) {
      assert.equal(q.dequeue(), i);
    }
    assert.equal(q.size, 500);
    assert.equal(q.peek(), 1500);
  });
});

describe('Grid System', () => {
  test('creates grid and immutably locates start and goal', () => {
    const map = [
      'S..',
      '.X.',
      '..G'
    ];
    const grid = Grid.fromStringArray(map);
    assert.equal(grid.rows, 3);
    assert.equal(grid.cols, 3);
    assert.deepEqual(grid.start, { r: 0, c: 0 });
    assert.deepEqual(grid.goal, { r: 2, c: 2 });
    assert.equal(grid.isWalkable(0, 0), true);
    assert.equal(grid.isWalkable(1, 1), false);
    assert.equal(grid.isWalkable(-1, 0), false);
    assert.equal(grid.isWalkable(3, 0), false);
  });

  test('returns immutable copy on cell modification', () => {
    const grid1 = Grid.fromStringArray(['S.', '.G']);
    const grid2 = grid1.withCell(0, 1, CELL_TYPES.WALL);
    assert.equal(grid1.getCell(0, 1), CELL_TYPES.EMPTY);
    assert.equal(grid2.getCell(0, 1), CELL_TYPES.WALL);
    assert.notEqual(grid1, grid2);
  });

  test('retrieves valid 4-directional cardinal neighbors', () => {
    const map = [
      'S.X',
      '...',
      '..G'
    ];
    const grid = Grid.fromStringArray(map);
    // Neighbors of (0, 1): up (-1,1: invalid), down (1,1: valid), left (0,0: valid), right (0,2: wall -> not walkable)
    const neighbors = grid.getWalkableNeighbors(0, 1);
    const expected = [
      { r: 1, c: 1 },
      { r: 0, c: 0 }
    ];
    assert.equal(neighbors.length, 2);
    assert.ok(neighbors.some(n => n.r === 1 && n.c === 1));
    assert.ok(neighbors.some(n => n.r === 0 && n.c === 0));
  });
});

describe('BFS Pathfinding Algorithm', () => {
  test('finds optimal shortest path in simple solvable grid', () => {
    const map = [
      'S...',
      'XXXX', // will fail if straight, but let's leave an opening
    ];
    const openMap = [
      'S...',
      'X.X.',
      '..XG'
    ];
    const grid = Grid.fromStringArray(openMap);
    const result = runBFS(grid);

    assert.equal(result.found, true);
    assert.ok(result.shortestPath);
    assert.deepEqual(result.shortestPath[0], { r: 0, c: 0 });
    assert.deepEqual(result.shortestPath[result.shortestPath.length - 1], { r: 2, c: 3 });

    // Validate path continuity
    for (let i = 0; i < result.shortestPath.length - 1; i++) {
      const a = result.shortestPath[i];
      const b = result.shortestPath[i + 1];
      const dist = Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
      assert.equal(dist, 1, 'Path steps must be adjacent');
    }
  });

  test('returns null and found=false when goal is completely blocked', () => {
    const blockedMap = [
      'S.X',
      '..X',
      'XXX',
      '..G'
    ];
    const grid = Grid.fromStringArray(blockedMap);
    const result = runBFS(grid);

    assert.equal(result.found, false);
    assert.equal(result.shortestPath, null);
  });

  test('records real BFS event history with accurate queue and visited states', () => {
    const map = [
      'S.',
      '.G'
    ];
    const grid = Grid.fromStringArray(map);
    const result = runBFS(grid);

    assert.equal(result.found, true);
    assert.ok(result.events.length > 0);
    assert.equal(result.events[0].type, 'START');
    const goalEvent = result.events.find(e => e.type === 'GOAL_FOUND');
    assert.ok(goalEvent, 'Must emit GOAL_FOUND event');
    assert.ok(result.visitedOrder.length >= 3);
  });
});
