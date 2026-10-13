import { Grid } from './Grid.js';

export const LEVELS = [
  {
    id: 1,
    name: 'FIRST CONTACT',
    subtitle: 'Training Facility Alpha',
    briefing: 'NEX AI core activated. Learn basic navigational protocols and locate extraction portal Alpha.',
    difficulty: 'EASY',
    theme: {
      primaryColor: 0x00f0ff, // Electric Cyan
      wallColor: 0x0088aa,
      floorColor: 0x081520,
      glowColor: '#00f0ff',
      name: 'CYAN'
    },
    map: [
      'S......',
      '.XXXX..',
      '...X...',
      '.X.X.X.',
      '.X...X.',
      '.XXXXX.',
      '......G'
    ]
  },
  {
    id: 2,
    name: 'LOST SIGNAL',
    subtitle: 'Corrupted Relay Sector',
    briefing: 'Communication relays damaged. Multiple dead-ends detected. Find the optimal route through the interference.',
    difficulty: 'NORMAL',
    theme: {
      primaryColor: 0xffaa00, // Amber / Solar Gold
      wallColor: 0x995500,
      floorColor: 0x1f1406,
      glowColor: '#ffaa00',
      name: 'AMBER'
    },
    map: [
      'S..X.....X.',
      '.X.X.XXX.X.',
      '.X...X...X.',
      'XXX.XXX.XXX',
      '....X......',
      '.XXXXX.XXX.',
      '.X...X...X.',
      '.X.X.XXX.X.',
      '...X...X.X.',
      '.XXXXX.X...',
      '.......X..G'
    ]
  },
  {
    id: 3,
    name: 'NEURAL NETWORK',
    subtitle: 'Synaptic Processing Core',
    briefing: 'High-density computational chamber. Watch the BFS wave front branch across wide open hubs and interconnects.',
    difficulty: 'MEDIUM',
    theme: {
      primaryColor: 0xbf00ff, // Neon Violet / Purple
      wallColor: 0x7700aa,
      floorColor: 0x150820,
      glowColor: '#bf00ff',
      name: 'VIOLET'
    },
    map: [
      'S..............',
      '.XXXXX.XXXXXXX.',
      '.....X.X.....X.',
      '.XXX.X.X.XXX.X.',
      '.X...X.....X...',
      '.X.XXXXXXX.XXX.',
      '.X.X.....X...X.',
      '...X.XXX.XXX.X.',
      '.XXX...X...X...',
      '...XXXXXXX.XXX.',
      '.X.....X.....X.',
      '.XXXXX.X.XXX.X.',
      '.....X...X...X.',
      '.XXXXXXXXX.XXX.',
      '..............G'
    ]
  },
  {
    id: 4,
    name: 'QUANTUM LABYRINTH',
    subtitle: 'Sub-Atomic Dimensional Grid',
    briefing: 'Intricate matrix of quantum barriers. The shortest path requires navigating intricate branching chambers.',
    difficulty: 'HARD',
    theme: {
      primaryColor: 0x00ff88, // Emerald / Electric Green
      wallColor: 0x009944,
      floorColor: 0x051a10,
      glowColor: '#00ff88',
      name: 'EMERALD'
    },
    map: [
      'XXXXXXXXXXXXXXXXX',
      'XS......X.......X',
      'XX.X.XX.X.XXX.X.X',
      'X.......X.X...X.X',
      'X.X.XXXXXXX.X.X.X',
      'X.....X.........X',
      'X.X...X.XXXXX...X',
      'X.X...X.......X.X',
      'X.X.X.X.X.XXX.X.X',
      'X.......X.....X.X',
      'XXX.XXX.X.X.XXX.X',
      'X.....X.X.X.....X',
      'XXX.X.X.X.XXX.XXX',
      'X...X...X.......X',
      'X.XXXX.XXXXXX.X.X',
      'X..............GX',
      'XXXXXXXXXXXXXXXXX'
    ]
  },
  {
    id: 5,
    name: 'THE LAST SIGNAL',
    subtitle: 'Deep Void Core Portal',
    briefing: 'The heart of the cyber lab. Extraction portal coordinates locked. Reach the portal before energy depletion.',
    difficulty: 'EXPERT',
    theme: {
      primaryColor: 0xff0055, // Crimson Neon / Hot Pink
      wallColor: 0xaa0033,
      floorColor: 0x1a050f,
      glowColor: '#ff0055',
      name: 'CRIMSON'
    },
    map: [
      'S......X...........',
      '.XXXXX.X.XXXXXXXXX.',
      '.....X...X.......X.',
      '.XXX.XXXXX.XXXXX.X.',
      '.X...X.....X...X.X.',
      '.X.XXXXXXX.X.X.X.X.',
      '.X.X.....X.X.X.X.X.',
      '.X.X.XXX.X.X.X.X.X.',
      '.X...X.X...X.X.X.X.',
      '.XXXXX.XXXXX.X.X.X.',
      '.....X.......X.X.X.',
      '.XXX.XXXXXXXXX.X.X.',
      '.X...X.........X.X.',
      '.X.XXXXXXX.XXXXX.X.',
      '.X.......X.....X.X.',
      '.XXXXXXX.XXXXX.X.X.',
      '.......X.....X...X.',
      '.XXXXX.XXXXX.XXXXX.',
      '..................G'
    ]
  }
];

export function getLevelGrid(levelIndex) {
  const level = LEVELS[levelIndex] || LEVELS[0];
  return Grid.fromStringArray(level.map);
}
