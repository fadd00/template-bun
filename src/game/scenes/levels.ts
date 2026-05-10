export type CommandKey = 'cmd_move' | 'cmd_turn_left' | 'cmd_turn_right' | 'cmd_jump' | 'cmd_wait' | 'cmd_repeat';
export type Direction = 'right' | 'down' | 'left' | 'up';

export interface LevelDef {
  title: string;
  hint: string;
  grid: number[][];
  goal: { row: number, col: number };
  playerStart: { col: number, row: number, facing: Direction };
  slots: number;
  availableCommands: CommandKey[];
}

export const LEVELS: LevelDef[] = [
  {
    title: 'Move The Dot',
    hint: 'Use the MOVE command to reach the goal.',
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    playerStart: { col: 1, row: 2, facing: 'right' },
    goal: { col: 4, row: 2 },
    slots: 3,
    availableCommands: ['cmd_move']
  },
  {
    title: 'Corner Turn',
    hint: 'You must TURN to face the right direction.',
    grid: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
    playerStart: { col: 1, row: 1, facing: 'right' },
    goal: { col: 3, row: 2 },
    slots: 5,
    availableCommands: ['cmd_move', 'cmd_turn_right', 'cmd_turn_left']
  },
  {
    title: 'Jump The Gap',
    hint: 'Use JUMP to hurdle over the holes!',
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 2, 0, 2, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ],
    playerStart: { col: 1, row: 1, facing: 'right' },
    goal: { col: 5, row: 1 },
    slots: 2,
    availableCommands: ['cmd_move', 'cmd_jump']
  }
];
