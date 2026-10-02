import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";

import { orbitGeometries } from "../config/scene.constants";
import {
  activeAccentMaterial,
  colors,
  coreSideMaterial,
  coreTopMaterial,
  metalTrimMaterial,
  mutedActiveAccentMaterial,
  platformMaterial,
} from "../config/scene.materials";

export function WaslixCore({
  coreRef,
  ringRefs,
}: {
  coreRef: RefObject<THREE.Group | null>;
  ringRefs: MutableRefObject<Array<THREE.Group | null>>;
}) {
  return (
    <group ref={coreRef}>
      <mesh position={[0, -0.17, 0]}>
        <cylinderGeometry args={[0.9, 0.98, 0.1, 64]} />
        <primitive object={coreSideMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.108, 0]}>
        <cylinderGeometry args={[0.98, 0.98, 0.022, 64]} />
        <primitive object={metalTrimMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.68, 0.78, 64]} />
        <primitive object={coreSideMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.074, 0]}>
        <cylinderGeometry args={[0.68, 0.74, 0.072, 56]} />
        <primitive object={coreTopMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.026, 0]}>
        <cylinderGeometry args={[0.53, 0.6, 0.078, 48]} />
        <primitive object={coreSideMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.021, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.018, 48]} />
        <primitive object={platformMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.385, 48]} />
        <primitive object={activeAccentMaterial} attach="material" />
      </mesh>
      <group position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[-0.14, 0, 0.14].map((x, index) => (
          <mesh
            key={x}
            position={[x, 0, index === 1 ? 0 : 0.015]}
            rotation={[0, 0, index === 0 ? -0.38 : index === 2 ? 0.38 : 0]}
          >
            <boxGeometry args={[0.112, 0.3, 0.014]} />
            <primitive
              object={
                index === 1 ? activeAccentMaterial : mutedActiveAccentMaterial
              }
              attach="material"
            />
          </mesh>
        ))}
      </group>
      {orbitGeometries.map((geometry, index) => (
        <group
          key={index}
          ref={(value) => {
            ringRefs.current[index] = value;
          }}
          rotation={[index === 1 ? 0.22 : -0.12, index * 0.8, 0]}
        >
          <lineSegments
            geometry={geometry}
            position={[0, 0.018 + index * 0.026, 0]}
            scale={[0.82 - index * 0.06, 1, 0.82 - index * 0.06]}
          >
            <lineBasicMaterial
              color={index === 1 ? colors.brand : colors.line}
              transparent
              opacity={index === 1 ? 0.62 : 0.4}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
