export interface RigPart {
  name: string;
  parent: string | null;
  defaultZIndex: number;
}

export const HUMANOID_RIG: RigPart[] = [
  { name: 'torso', parent: null, defaultZIndex: 5 },
  { name: 'head', parent: 'torso', defaultZIndex: 10 },
  { name: 'left_upper_arm', parent: 'torso', defaultZIndex: -1 },
  { name: 'left_lower_arm', parent: 'left_upper_arm', defaultZIndex: -1 },
  { name: 'right_upper_arm', parent: 'torso', defaultZIndex: 15 },
  { name: 'right_lower_arm', parent: 'right_upper_arm', defaultZIndex: 15 },
  { name: 'left_thigh', parent: 'torso', defaultZIndex: 0 },
  { name: 'left_calf', parent: 'left_thigh', defaultZIndex: 0 },
  { name: 'right_thigh', parent: 'torso', defaultZIndex: 0 },
  { name: 'right_calf', parent: 'right_thigh', defaultZIndex: 0 },
];
