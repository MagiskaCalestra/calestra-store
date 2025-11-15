import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/** Minimal â€œGlowGateâ€ som overlay. Låg risk för konsolfel. */
function GlowGate(){
  return (
    <mesh>
      <torusKnotGeometry args={[1, 0.25, 128, 16]} />
      <meshStandardMaterial emissive="#ffd86b" color="#442200" emissiveIntensity={2} />
    </mesh>
  );
}

export default function MoodPortal3D(){
  return (
    <div className="portal-overlay" role="img" aria-label="GlowGate portal">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[2,2,2]} intensity={1.4} />
        <Suspense fallback={null}>
          <GlowGate />
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.7} />
      </Canvas>
    </div>
  );
}
