import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function PortalScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 1.2, 2]} intensity={2.2} color={"#ffd27b"} />
      <mesh rotation={[0.4, 0.6, 0]}>
        <torusKnot args={[1, 0.32, 256, 32]}>
          <meshStandardMaterial
            color={"#f4e2b5"}
            emissive={"#f8d36c"}
            emissiveIntensity={1.35}
            metalness={0.2}
            roughness={0.35}
          />
        </torusKnot>
      </mesh>
    </>
  );
}

export default function MoodPortalR3F({ height = 340 }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 16,
        overflow: "hidden",
        background: "radial-gradient(120% 120% at 50% 40%, #101626 0%, #070a12 70%)",
        boxShadow: "0 10px 40px rgba(0,0,0,.35)",
      }}
      aria-label="Stämningsportal (3D)"
    >
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <PortalScene />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}
