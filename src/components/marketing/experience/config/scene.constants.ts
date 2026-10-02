import * as THREE from "three";

import {
  customerPositions,
  signalPositions,
  workflowPositions,
} from "./scene.positions";

export const customerBaseLowerGeometry = new THREE.CylinderGeometry(
  0.42,
  0.46,
  0.055,
  24,
);
export const customerBaseUpperGeometry = new THREE.CylinderGeometry(
  0.34,
  0.38,
  0.045,
  24,
);
export const customerBodyGeometry = new THREE.CylinderGeometry(
  0.32,
  0.36,
  0.15,
  12,
);
export const customerTopPlateGeometry = new THREE.CylinderGeometry(
  0.23,
  0.26,
  0.024,
  12,
);
export const smallPlatformGeometry = new THREE.CylinderGeometry(
  0.24,
  0.27,
  0.055,
  20,
);
export const signalGeometry = new THREE.OctahedronGeometry(0.11, 0);
export const particleGeometry = new THREE.SphereGeometry(0.022, 10, 8);

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

const curveStart = new THREE.Vector3();
const curveEnd = new THREE.Vector3();
const curveControl = new THREE.Vector3();
const curveOffset = new THREE.Vector3();

function connectionControlPoint(
  start: [number, number, number],
  end: [number, number, number],
  index: number,
  target: THREE.Vector3,
) {
  target
    .set(
      (start[0] + end[0]) * 0.5,
      (start[1] + end[1]) * 0.5,
      (start[2] + end[2]) * 0.5,
    )
    .add(
      curveOffset.set(
        0,
        0.045 * (index % 2 === 0 ? 1 : -1),
        0.1 * (index % 3 === 0 ? -1 : 1),
      ),
    );
  return target;
}

export function sampleConnectionPoint(
  start: [number, number, number],
  end: [number, number, number],
  index: number,
  progress: number,
  target: THREE.Vector3,
) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const oneMinusT = 1 - t;
  curveStart.set(...start);
  curveEnd.set(...end);
  connectionControlPoint(start, end, index, curveControl);
  target
    .copy(curveStart)
    .multiplyScalar(oneMinusT * oneMinusT)
    .addScaledVector(curveControl, 2 * oneMinusT * t)
    .addScaledVector(curveEnd, t * t);
}

function connectionGeometry(
  start: [number, number, number],
  end: [number, number, number],
  index: number,
) {
  const points: THREE.Vector3[] = [];
  const previous = new THREE.Vector3();
  const next = new THREE.Vector3();
  sampleConnectionPoint(start, end, index, 0, previous);
  for (let point = 1; point <= 10; point += 1) {
    sampleConnectionPoint(start, end, index, point / 10, next);
    points.push(previous.clone(), next.clone());
    previous.copy(next);
  }
  return new THREE.BufferGeometry().setFromPoints(points);
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

export const portfolioLines = customerPositions.map((position, index) =>
  connectionGeometry(position, [0, 0, 0], index),
);
export const signalLines = signalPositions.map((position, index) =>
  connectionGeometry(position, [0, 0, 0], index),
);
export const workflowLines = workflowPositions
  .slice(0, -1)
  .map((position, index) =>
    connectionGeometry(position, workflowPositions[index + 1], index),
  );
export const orbitGeometries = [
  arcGeometry(0.88, 0.2, Math.PI * 1.45),
  arcGeometry(1.08, 2.2, Math.PI * 1.2),
  arcGeometry(1.26, 4.15, Math.PI * 0.86),
];
