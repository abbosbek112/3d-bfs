import { Queue } from './Queue.js';

export const BFS_EVENT_TYPES = Object.freeze({
  START: 'START',
  DEQUEUE: 'DEQUEUE',
  DISCOVER: 'DISCOVER',
  GOAL_FOUND: 'GOAL_FOUND',
  NO_PATH: 'NO_PATH'
});

/**
 * Encodes row and column into string key "r,c"
 */
export function coordKey(r, c) {
  return `${r},${c}`;
}

/**
 * Reconstructs shortest path backward from goal to start using parent pointers
 * @param {Map<string, {r: number, c: number}>} parentMap
 * @param {{r: number, c: number}} start
 * @param {{r: number, c: number}} goal
 * @returns {Array<{r: number, c: number}> | null}
 */
export function reconstructPath(parentMap, start, goal) {
  if (!start || !goal) return null;
  const path = [];
  let curr = goal;
  const startKey = coordKey(start.r, start.c);

  while (curr) {
    path.push(Object.freeze({ r: curr.r, c: curr.c }));
    const currKey = coordKey(curr.r, curr.c);
    if (currKey === startKey) {
      break;
    }
    curr = parentMap.get(currKey) || null;
  }

  const last = path[path.length - 1];
  if (!last || last.r !== start.r || last.c !== start.c) {
    return null; // Start was never reached
  }

  // Reverse to get path from start to goal
  return path.reverse();
}

/**
 * Executes Breadth-First Search on the given Grid.
 * Emits complete event sequence for real-time visualization & inspection.
 *
 * @param {import('./Grid.js').Grid} grid
 * @returns {{
 *   found: boolean,
 *   shortestPath: Array<{r: number, c: number}> | null,
 *   events: Array<object>,
 *   visitedOrder: Array<{r: number, c: number}>,
 *   parentMap: Map<string, {r: number, c: number}>,
 *   totalVisited: number,
 *   pathLength: number
 * }}
 */
export function runBFS(grid) {
  const start = grid.start;
  const goal = grid.goal;

  if (!start || !goal) {
    return {
      found: false,
      shortestPath: null,
      events: [{ type: BFS_EVENT_TYPES.NO_PATH, reason: 'Missing start or goal', totalSteps: 0, visitedCount: 0 }],
      visitedOrder: [],
      parentMap: new Map(),
      totalVisited: 0,
      pathLength: 0
    };
  }

  const events = [];
  const queue = new Queue();
  const visited = new Set();
  const parentMap = new Map();
  const visitedOrder = [];

  const startKey = coordKey(start.r, start.c);
  const goalKey = coordKey(goal.r, goal.c);

  // Phase 1: Initialize
  queue.enqueue(start);
  visited.add(startKey);
  visitedOrder.push(start);

  events.push({
    type: BFS_EVENT_TYPES.START,
    start,
    goal,
    queueSnapshot: queue.toArray(),
    totalCells: grid.rows * grid.cols
  });

  // Trivial case: Start is already Goal
  if (start.r === goal.r && start.c === goal.c) {
    const shortestPath = [start];
    events.push({
      type: BFS_EVENT_TYPES.GOAL_FOUND,
      current: start,
      shortestPath,
      totalSteps: 1,
      visitedCount: 1
    });
    return {
      found: true,
      shortestPath,
      events,
      visitedOrder,
      parentMap,
      totalVisited: 1,
      pathLength: 1
    };
  }

  let stepCounter = 0;
  let targetFound = false;

  // Phase 2: Exploration
  while (!queue.isEmpty()) {
    stepCounter++;
    const current = queue.dequeue();

    events.push({
      type: BFS_EVENT_TYPES.DEQUEUE,
      step: stepCounter,
      current,
      queueSnapshot: queue.toArray()
    });

    const neighbors = grid.getWalkableNeighbors(current.r, current.c);
    const discoveredThisStep = [];

    for (const neighbor of neighbors) {
      const nKey = coordKey(neighbor.r, neighbor.c);
      if (!visited.has(nKey)) {
        visited.add(nKey);
        parentMap.set(nKey, current);
        queue.enqueue(neighbor);
        visitedOrder.push(neighbor);
        discoveredThisStep.push(neighbor);

        events.push({
          type: BFS_EVENT_TYPES.DISCOVER,
          step: stepCounter,
          neighbor,
          parent: current,
          queueSnapshot: queue.toArray()
        });

        if (nKey === goalKey) {
          targetFound = true;
          break;
        }
      }
    }

    if (targetFound) {
      break;
    }
  }

  // Phase 3 & 4: Resolution & Reconstruction
  if (targetFound) {
    const shortestPath = reconstructPath(parentMap, start, goal);
    events.push({
      type: BFS_EVENT_TYPES.GOAL_FOUND,
      current: goal,
      shortestPath,
      totalSteps: stepCounter,
      visitedCount: visited.size
    });

    return {
      found: true,
      shortestPath,
      events,
      visitedOrder,
      parentMap,
      totalVisited: visited.size,
      pathLength: shortestPath ? shortestPath.length : 0
    };
  }

  // Unsolvable maze
  events.push({
    type: BFS_EVENT_TYPES.NO_PATH,
    totalSteps: stepCounter,
    visitedCount: visited.size
  });

  return {
    found: false,
    shortestPath: null,
    events,
    visitedOrder,
    parentMap,
    totalVisited: visited.size,
    pathLength: 0
  };
}
