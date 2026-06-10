import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

function StarMesh() {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // float
    ref.current.position.y = Math.sin(t) * 0.1;

    // slow rotate
    ref.current.rotation.y += 0.01;
  });

  return (
    <group ref={ref}>
      {/* Star body (simple stylized) */}
      <mesh>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#f5c542"
          emissive="#f5c542"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#0b1220" />
      </mesh>

      <mesh position={[0.3, 0.2, 0.9]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#0b1220" />
      </mesh>
    </group>
  );
}

export default function Celeste3DStar({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 120,
        height: 120,
        zIndex: 9999,
        cursor: "pointer",
      }}
    >
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 2, 2]} intensity={1.2} />
        <StarMesh />
      </Canvas>
    </div>
  );
}