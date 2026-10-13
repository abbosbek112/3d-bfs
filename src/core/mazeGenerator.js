import { Grid, CELL_TYPES } from './Grid.js';
import { runBFS } from './bfs.js';

/**
 * Creates an empty open grid with S at top-left and G at bottom-right
 * @param {number} rows
 * @param {number} cols
 * @returns {Grid}
 */
export function createEmptyGrid(rows = 11, cols = 11) {
  const safeRows = Math.max(3, rows);
  const safeCols = Math.max(3, cols);

  const cells = Array.from({ length: safeRows }, () =>
    Array.from({ length: safeCols }, () => CELL_TYPES.EMPTY)
  );

  cells[0][0] = CELL_TYPES.START;
  cells[safeRows - 1][safeCols - 1] = CELL_TYPES.GOAL;

  return Grid.from2DArray(cells);
}

/**
 * Generates a guaranteed solvable maze using randomized DFS carving
 * and braiding (removing select walls to create alternate routes).
 *
 * @param {number} rows - preferably odd number >= 5
 * @param {number} cols - preferably odd number >= 5
 * @param {number} braidRatio - fraction of dead ends to remove (0.0 to 0.4)
 * @returns {Grid}
 */
export function generateRandomMaze(rows = 11, cols = 11, braidRatio = 0.25) {
  // Ensure odd dimensions for proper wall-corridor grid
  const rCount = rows % 2 === 0 ? rows + 1 : Math.max(5, rows);
  const cCount = cols % 2 === 0 ? cols + 1 : Math.max(5, cols);

  // 1. Initialize all cells as WALL
  const cells = Array.from({ length: rCount }, () =>
    Array.from({ length: cCount }, () => CELL_TYPES.WALL)
  );

  // 2. Randomized Recursive Backtracker (Iterative with stack)
  const stack = [];
  const startR = 1;
  const startC = 1;
  cells[startR][startC] = CELL_TYPES.EMPTY;
  stack.push({ r: startR, c: startC });

  const deltas = [
    { dr: -2, dc: 0, wallR: -1, wallC: 0 }, // Up
    { dr: 2, dc: 0, wallR: 1, wallC: 0 },   // Down
    { dr: 0, dc: -2, wallR: 0, wallC: -1 }, // Left
    { dr: 0, dc: 2, wallR: 0, wallC: 1 }    // Right
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [];

    for (const d of deltas) {
      const nr = current.r + d.dr;
      const nc = current.c + d.dc;
      if (nr > 0 && nr < rCount - 1 && nc > 0 && nc < cCount - 1) {
        if (cells[nr][nc] === CELL_TYPES.WALL) {
          neighbors.push({ nr, nc, wr: current.r + d.wallR, wc: current.c + d.wallC });
        }
      }
    }

    if (neighbors.length > 0) {
      // Pick random unvisited neighbor
      const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
      cells[chosen.wr][chosen.wc] = CELL_TYPES.EMPTY;
      cells[chosen.nr][chosen.nc] = CELL_TYPES.EMPTY;
      stack.push({ r: chosen.nr, c: chosen.nc });
    } else {
      stack.pop();
    }
  }

  // 3. Braiding: randomly open some internal walls to create loops / multiple paths
  if (braidRatio > 0) {
    for (let r = 2; r < rCount - 2; r++) {
      for (let c = 2; c < cCount - 2; c++) {
        if (cells[r][c] === CELL_TYPES.WALL && Math.random() < braidRatio) {
          // Only remove if it connects two corridors
          const horizOpen = cells[r][c - 1] === CELL_TYPES.EMPTY && cells[r][c + 1] === CELL_TYPES.EMPTY;
          const vertOpen = cells[r - 1][c] === CELL_TYPES.EMPTY && cells[r + 1][c] === CELL_TYPES.EMPTY;
          if (horizOpen || vertOpen) {
            cells[r][c] = CELL_TYPES.EMPTY;
          }
        }
      }
    }
  }

  // 4. Place Start and Goal
  const sPos = { r: 1, c: 1 };
  const gPos = { r: rCount - 2, c: cCount - 2 };

  cells[sPos.r][sPos.c] = CELL_TYPES.START;
  cells[gPos.r][gPos.c] = CELL_TYPES.GOAL;

  const candidateGrid = Grid.from2DArray(cells);

  // 5. Verification step: guarantee solvability
  const testBfs = runBFS(candidateGrid);
  if (testBfs.found) {
    return candidateGrid;
  }

  // Fallback: If somehow disconnected, carve a direct line or return open grid
  cells[gPos.r][gPos.c - 1] = CELL_TYPES.EMPTY;
  cells[gPos.r - 1][gPos.c] = CELL_TYPES.EMPTY;
  return Grid.from2DArray(cells);
}
