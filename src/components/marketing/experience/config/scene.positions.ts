import * as THREE from "three";

export const customerPositions: Array<[number, number, number]> = [
  [-1.75, 0.3, 0.35],
  [-0.6, 1.55, -0.5],
  [1.05, 1.55, -0.72],
  [2.45, 0.5, -0.4],
  [1.65, -1.15, -0.15],
  [-0.25, -1.45, -0.4],
];

export const signalPositions: Array<[number, number, number]> = [
  [-2.45, 1.2, -0.2],
  [-2.65, 0, 0.35],
  [-2.2, -1.25, -0.4],
  [2.25, 1.2, -0.45],
  [2.65, 0.05, 0.3],
  [2.15, -1.2, -0.25],
];

export const workflowPositions: Array<[number, number, number]> = [
  [-2.8, 0.22, 0.48],
  [-1.45, 0.04, -0.22],
  [0, 0.2, 0.16],
  [1.45, -0.02, -0.3],
  [2.8, 0.18, 0.34],
];

export const customerVectors = customerPositions.map(
  (position) => new THREE.Vector3(...position),
);
export const signalVectors = signalPositions.map(
  (position) => new THREE.Vector3(...position),
);
export const workflowVectors = workflowPositions.map(
  (position) => new THREE.Vector3(...position),
);
export const systemCenter = new THREE.Vector3();
