import type { MutableRefObject, RefObject } from "react";
import * as THREE from "three";

import { orbitGeometries } from "../config/scene.constants";
import { colors } from "../config/scene.materials";

export function WaslixCore({
  coreRef,
  ringRefs,
}: {
  coreRef: RefObject<THREE.Group | null>;
  ringRefs: MutableRefObject<Array<THREE.Group | null>>;
}) {
  return (
    <group ref={coreRef}>
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.72, 0.8, 0.12, 48]} />
        <meshStandardMaterial
          color={colors.graphite}
          metalness={0.84}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.79, 0.81, 0.025, 48]} />
        <meshStandardMaterial
          color="#4a5450"
          metalness={0.82}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.58, 0.66, 0.12, 48]} />
        <meshStandardMaterial
          color={colors.graphiteRaised}
          metalness={0.9}
          roughness={0.34}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.43, 0.5, 0.13, 40]} />
        <meshStandardMaterial
          color="#090c0b"
          metalness={0.72}
          roughness={0.46}
        />
      </mesh>
      <mesh position={[0, 0.085, 0]}>
        <cylinderGeometry args={[0.43, 0.43, 0.018, 40]} />
        <meshStandardMaterial
          color="#313936"
          metalness={0.58}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.31, 0.345, 40]} />
        <meshStandardMaterial
          color={colors.brand}
          emissive={colors.brandDark}
          emissiveIntensity={0.24}
          metalness={0.7}
          roughness={0.32}
        />
      </mesh>
      <group position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[-0.14, 0, 0.14].map((x, index) => (
          <mesh
            key={x}
            position={[x, 0, index === 1 ? 0 : 0.015]}
            rotation={[0, 0, index === 0 ? -0.38 : index === 2 ? 0.38 : 0]}
          >
            <boxGeometry args={[0.105, 0.34, 0.025]} />
            <meshStandardMaterial
              color={index === 1 ? colors.brand : "#347f77"}
              emissive={colors.brandDark}
              emissiveIntensity={0.18}
              roughness={0.35}
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
            position={[0, 0.08 + index * 0.06, 0]}
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
