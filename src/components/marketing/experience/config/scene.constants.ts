import * as THREE from "three";

import {
  customerPositions,
  signalPositions,
  workflowPositions,
} from "./scene.positions";

export const moduleGeometry = new THREE.BoxGeometry(0.42, 0.28, 0.42, 2, 1, 2);
export const platformGeometry = new THREE.CylinderGeometry(0.46, 0.5, 0.08, 28);
export const smallPlatformGeometry = new THREE.CylinderGeometry(
  0.24,
  0.27,
  0.055,
  20,
);
export const signalGeometry = new THREE.OctahedronGeometry(0.11, 0);
export const particleGeometry = new THREE.SphereGeometry(0.035, 10, 8);

export function smooth(progress: number, from: number, to: number) {
  return THREE.MathUtils.smoothstep(progress, from, to);
}

export function lineGeometry(
  start: [number, number, number],
  end: [number, number, number],
) {
  return new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ]);
}

function arcGeometry(radius: number, start: number, length: number) {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index <= 48; index += 1) {
    const angle = start + length * (index / 48);
    points.push(
      new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
    );
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

export const portfolioLines = customerPositions.map((position) =>
  lineGeometry(position, [0, 0, 0]),
);
export const signalLines = signalPositions.map((position) =>
  lineGeometry(position, [0, 0, 0]),
);
export const workflowLines = workflowPositions
  .slice(0, -1)
  .map((position, index) =>
    lineGeometry(position, workflowPositions[index + 1]),
  );
export const orbitGeometries = [
  arcGeometry(0.88, 0.2, Math.PI * 1.45),
  arcGeometry(1.08, 2.2, Math.PI * 1.2),
  arcGeometry(1.26, 4.15, Math.PI * 0.86),
];
