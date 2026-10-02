import type { RootState } from "@react-three/fiber";
import * as THREE from "three";

import type { CoreMotionRef } from "../types";

export function updateCameraMotion({
  state,
  damping,
  focus,
  action,
  motion,
}: {
  state: RootState;
  damping: number;
  focus: number;
  action: number;
  motion: CoreMotionRef;
}) {
  const cameraX =
    THREE.MathUtils.lerp(-0.08, -0.16, focus) + motion.current.pointerX * 0.05;
  const cameraY =
    THREE.MathUtils.lerp(3.35, 2.75, focus) - motion.current.pointerY * 0.035;
  const cameraZ = THREE.MathUtils.lerp(6.85, 6.1, focus) + action * 0.7;
  state.camera.position.x += (cameraX - state.camera.position.x) * damping;
  state.camera.position.y += (cameraY - state.camera.position.y) * damping;
  state.camera.position.z += (cameraZ - state.camera.position.z) * damping;
  state.camera.lookAt(0.18, -0.04, 0);
}
