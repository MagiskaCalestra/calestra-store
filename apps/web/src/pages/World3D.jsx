import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Stars } from "@react-three/drei";
import { useMood } from "../core/MoodContext";

function Gate({ color="#f5c542" }) {
  const group = useRef();
  useFrame((_, dt) => { if(group.current){ group.current.rotation.z += dt * 0.08 }});
  return (
    <group ref={group}>
      <Float speed={1} rotationIntensity={0.25} floatIntensity={0.6}>
        <mesh>
          <torusGeometry args={[1.05, 0.06, 48, 192]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.95} roughness={0.2} metalness={0.5}/>
        </mesh>
      </Float>
      <mesh>
        <torusGeometry args={[1.16, 0.015, 32, 256]} />
        <meshBasicMaterial color={color} transparent opacity={0.28}/>
      </mesh>
    </group>
  );
}

export default function World3D(){
  const { theme } = useMood();
  const accent = theme?.accent ?? "#f5c542";

  return (
    <main className="world3d" aria-label="Calestra Portal">
      <Canvas camera={{ position:[0,0,3.2], fov:42 }} dpr={[1,1.75]}>
        <color attach="background" args={["#060a0f"]} />
        <fog attach="fog" args={["#060a0f", 6, 14]} />
        <ambientLight intensity={0.4} />
        <directionalLight intensity={1.15} position={[2.2, 2.6, 2]} />
        <Suspense fallback={<Html center>Loading…</Html>}>
          <Stars radius={50} depth={20} count={2500} factor={2} fade speed={0.4} />
          <group position={[0,0,-0.02]}>
            <mesh>
              <torusGeometry args={[1.12, 0.09, 32, 128]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.22} transparent opacity={0.35} roughness={1} metalness={0}/>
            </mesh>
          </group>
          <Gate color={accent}/>
        </Suspense>
      </Canvas>
    </main>
  );
}
