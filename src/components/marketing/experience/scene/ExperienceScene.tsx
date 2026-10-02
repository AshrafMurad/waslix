/* eslint-disable react-hooks/refs */

import { useState } from "react";

import { useSignalAnimation } from "../animation/useSignalAnimation";
import { WaslixCore } from "../models/WaslixCore";
import { Platform } from "../models/Platform";
import { ActionScene } from "../sections/ActionScene";
import { HealthScene } from "../sections/HealthScene";
import { PortfolioScene } from "../sections/PortfolioScene";
import type { CoreMotionRef, CoreQuality } from "../types";
import { SceneEnvironment } from "./SceneEnvironment";

export function ExperienceScene({
  motion,
  quality,
  onReady,
}: {
  motion: CoreMotionRef;
  quality: CoreQuality;
  onReady: () => void;
}) {
  const [hoveredCustomer, setHoveredCustomer] = useState(-1);

  const animation = useSignalAnimation({
    motion,
    quality,
    hoveredCustomer,
    onReady,
  });

  return (
    <group ref={animation.world} position={[0.68, 0, 0]}>
      <Platform quality={quality} />
      <PortfolioScene
        groupRef={animation.portfolio}
        onLineMaterialRef={animation.registerPortfolioMaterial}
        hoveredCustomer={hoveredCustomer}
        onHover={setHoveredCustomer}
      />
      <HealthScene
        groupRef={animation.signals}
        onLineMaterialRef={animation.registerSignalMaterial}
        onNodeRef={animation.registerSignalNode}
      />
      <ActionScene
        groupRef={animation.workflow}
        onNodeRef={animation.registerWorkflowNode}
        onLineMaterialRef={animation.registerWorkflowMaterial}
      />
      <WaslixCore coreRef={animation.core} ringRefs={animation.rings} />
      <SceneEnvironment
        motion={motion}
        onParticleRef={animation.registerParticle}
      />
    </group>
  );
}
