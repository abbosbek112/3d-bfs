/**
 * Immutable 2D Grid representation for NEON PATHFINDER
 */
export const CELL_TYPES = Object.freeze({
  EMPTY: '.',
  WALL: 'X',
  START: 'S',
  GOAL: 'G'
});

export class Grid {
  #cells;
  #rows;
  #cols;
  #start;
  #goal;

  constructor(cells, start = null, goal = null) {
    if (!Array.isArray(cells) || cells.length === 0 || !Array.isArray(cells[0])) {
      throw new Error('Invalid grid cells: Expected non-empty 2D array');
    }

    this.#rows = cells.length;
    this.#cols = cells[0].length;
    // Deep clone rows to guarantee immutability
    this.#cells = cells.map(row => Object.freeze([...row]));
    Object.freeze(this.#cells);

    // Locate start and goal if not provided
    let foundStart = start;
    let foundGoal = goal;

    for (let r = 0; r < this.#rows; r++) {
      for (let c = 0; c < this.#cols; c++) {
        const val = this.#cells[r][c];
        if (val === CELL_TYPES.START) {
          foundStart = { r, c };
        } else if (val === CELL_TYPES.GOAL) {
          foundGoal = { r, c };
        }
      }
    }

    this.#start = foundStart ? Object.freeze({ ...foundStart }) : null;
    this.#goal = foundGoal ? Object.freeze({ ...foundGoal }) : null;
  }

  get rows() {
    return this.#rows;
  }

  get cols() {
    return this.#cols;
  }

  get start() {
    return this.#start;
  }

  get goal() {
    return this.#goal;
  }

  getCell(r, c) {
    if (!this.isValid(r, c)) {
      return null;
    }
    return this.#cells[r][c];
  }

  isValid(r, c) {
    return r >= 0 && r < this.#rows && c >= 0 && c < this.#cols;
  }

  isWalkable(r, c) {
    if (!this.isValid(r, c)) return false;
    const cell = this.#cells[r][c];
    return cell !== CELL_TYPES.WALL;
  }

  /**
   * Returns cardinal walkable neighbors in standard direction order:
   * Up, Down, Left, Right
   */
  getWalkableNeighbors(r, c) {
    const directions = [
      { r: r - 1, c: c }, // UP
      { r: r + 1, c: c }, // DOWN
      { r: r, c: c - 1 }, // LEFT
      { r: r, c: c + 1 }  // RIGHT
    ];

    const result = [];
    for (const pos of directions) {
      if (this.isWalkable(pos.r, pos.c)) {
        result.push(Object.freeze({ r: pos.r, c: pos.c }));
      }
    }
    return result;
  }

  /**
   * Immutably creates a new Grid with cell replaced
   */
  withCell(r, c, type) {
    if (!this.isValid(r, c)) {
      throw new Error(`Coordinate out of bounds: (${r}, ${c})`);
    }

    const newCells = this.#cells.map((row, rowIdx) => {
      if (rowIdx !== r) return row;
      const updatedRow = [...row];
      updatedRow[c] = type;
      return updatedRow;
    });

    let newStart = this.#start;
    let newGoal = this.#goal;

    if (type === CELL_TYPES.START) {
      newStart = { r, c };
    } else if (this.#start && this.#start.r === r && this.#start.c === c) {
      newStart = null;
    }

    if (type === CELL_TYPES.GOAL) {
      newGoal = { r, c };
    } else if (this.#goal && this.#goal.r === r && this.#goal.c === c) {
      newGoal = null;
    }

    return new Grid(newCells, newStart, newGoal);
  }

  withStart(r, c) {
    if (!this.isValid(r, c)) throw new Error(`Invalid start position (${r}, ${c})`);
    const newCells = this.#cells.map((row, rowIdx) =>
      row.map((cell, colIdx) => {
        if (cell === CELL_TYPES.START) return CELL_TYPES.EMPTY;
        if (rowIdx === r && colIdx === c) return CELL_TYPES.START;
        return cell;
      })
    );
    return new Grid(newCells, { r, c }, this.#goal);
  }

  withGoal(r, c) {
    if (!this.isValid(r, c)) throw new Error(`Invalid goal position (${r}, ${c})`);
    const newCells = this.#cells.map((row, rowIdx) =>
      row.map((cell, colIdx) => {
        if (cell === CELL_TYPES.GOAL) return CELL_TYPES.EMPTY;
        if (rowIdx === r && colIdx === c) return CELL_TYPES.GOAL;
        return cell;
      })
    );
    return new Grid(newCells, this.#start, { r, c });
  }

  static fromStringArray(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Input must be a non-empty array of strings');
    }
    const cells = rows.map(r => r.split(''));
    return new Grid(cells);
  }

  static from2DArray(matrix) {
    return new Grid(matrix);
  }

  to2DArray() {
    return this.#cells.map(row => [...row]);
  }
}
