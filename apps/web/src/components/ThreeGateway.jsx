import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import * as THREE from "three";

/**
 * ThreeGateway (placeholder)
 * - Stjärnfält (Points)
 * - Portal-glow (ring) + inre kärna
 * - Mjuk kamerasvep + musparallax
 * - Imperativ API: ref.current.enter() => kör dolly-resa genom portalen
 * - Reduced Motion-stöd
 */
const ThreeGateway = forwardRef(function ThreeGateway({ onReady, onEnterComplete }, ref) {
  const mountRef = useRef(null);
  const rafRef = useRef(0);

  // 3D-resurser
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const starsRef = useRef(null);
  const ringRef = useRef(null);
  const coreRef = useRef(null);

  // interaktion
  const [isEntering, setIsEntering] = useState(false);
  const enteringRef = useRef(false);
  const enterTRef = useRef(0); // 0..1 progress

  // parallax
  let mx = 0, my = 0;

  useImperativeHandle(ref, () => ({
    /**
     * Starta en dolly igenom portalen.
     * Ignorerar anrop om det redan körs eller om renderer saknas.
     */
    enter: () => {
      if (!rendererRef.current || enteringRef.current) return;
      enteringRef.current = true;
      setIsEntering(true);
      enterTRef.current = 0;
    },
  }), []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Scene / Camera / Renderer ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070a14, 10, 80);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 500);
    camera.position.set(0, 0.8, 7);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x070a14, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Lights ---
    const hemi = new THREE.HemisphereLight(0x7fa7ff, 0x0a0a12, 0.9);
    scene.add(hemi);
    const key = new THREE.PointLight(0xffffff, 1.1, 50);
    key.position.set(0, 1, 6);
    scene.add(key);

    // --- Portal ring (glow) ---
    const ringGeo = new THREE.RingGeometry(1.2, 1.8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xbfd1ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.16,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.8;
    scene.add(ring);
    ringRef.current = ring;

    // Inre kärna
    const coreGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x8fa8ff,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);
    coreRef.current = core;

    // --- Stjärnfält ---
    const starCount = 1500;
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xaec6ff,
      size: 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);
    starsRef.current = stars;

    // --- Mouse parallax ---
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mx = (x - 0.5) * 2;
      my = (y - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // --- Resize ---
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // --- Easing helper ---
    const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    // --- Animate ---
    let t = 0;
    const animate = () => {
      const camera = cameraRef.current;
      const ring = ringRef.current;
      const core = coreRef.current;
      const stars = starsRef.current;

      t += 0.005;

      // Basrörelser
      if (ring) ring.rotation.z = t * 0.6;
      if (core) core.rotation.y = t * 0.9;
      if (stars) stars.rotation.y = t * 0.12;

      // Dolly-resa genom portalen
      if (enteringRef.current) {
        // öka progress
        const dt = 0.012; // längd på resan (ju större, desto snabbare)
        enterTRef.current = Math.min(1, enterTRef.current + dt);
        const te = easeInOutCubic(enterTRef.current);

        // kamera från (0, 0.8, 7) mot (0, 0, -1.2)
        const start = { x: 0, y: 0.8, z: 7 };
        const end = { x: 0, y: 0.2, z: -1.2 };

        camera.position.x = start.x + (end.x - start.x) * te;
        camera.position.y = start.y + (end.y - start.y) * te;
        camera.position.z = start.z + (end.z - start.z) * te;
        camera.lookAt(0, 0, 0);

        // blek ut ring/kärna när vi närmar oss
        const fade = 1 - te;
        if (ring && ring.material) ring.material.opacity = 0.16 * fade;
        if (core && core.material) {
          core.material.emissiveIntensity = 1.4 * fade + 0.2;
          core.material.opacity = 0.9 * fade + 0.1;
          core.material.transparent = true;
        }

        if (enterTRef.current >= 1) {
          enteringRef.current = false;
          setIsEntering(false);
          if (typeof onEnterComplete === "function") {
            onEnterComplete();
          }
        }
      } else {
        // Parallax endast om inte reduced motion + inte under enter
        if (!prefersReduced) {
          camera.position.x += ((mx * 1.4) - camera.position.x) * 0.04;
          camera.position.y += ((-my * 0.8) + 0.8 - camera.position.y) * 0.04;
          camera.lookAt(0, 0, 0);
        } else {
          camera.lookAt(0, 0, 0);
        }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };

    // första frame + start
    renderer.render(scene, camera);
    if (typeof onReady === "function") onReady();
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);

      // Dispose geometries/materials
      if (starsRef.current) {
        starsRef.current.geometry?.dispose?.();
        starsRef.current.material?.dispose?.();
      }
      ringGeo.dispose(); ringMat.dispose();
      coreGeo.dispose(); coreMat.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      starsRef.current = null;
      ringRef.current = null;
      coreRef.current = null;
    };
  }, [onReady, onEnterComplete]);

  return (
    <div ref={mountRef} className="three-gw" style={{ width: "100%", height: "100%" }}>
      {/* overlay-status vid enter */}
      {isEntering && (
        <div className="entering-overlay" aria-live="polite">
          <div className="bar" />
          <span>Entering the Park…</span>
        </div>
      )}
      <style>{`
        .entering-overlay {
          position:absolute; inset:auto 0 0 0; display:flex; flex-direction:column; align-items:center;
          gap:6px; padding:14px; background:linear-gradient(180deg,rgba(7,10,20,0),rgba(7,10,20,.55));
          color:#dfe6ff; font-size:.95rem;
        }
        .bar { width:180px; height:4px; border-radius:6px; background:#2c3aa0; position:relative; overflow:hidden; }
        .bar::after{
          content:""; position:absolute; inset:0; transform:translateX(-60%);
          width:60%; background:#ffffff; opacity:.9; border-radius:6px; 
          animation:loadbar 1.2s ease-in-out infinite;
        }
        @keyframes loadbar {
          0%{ transform:translateX(-70%); opacity:.6; }
          50%{ transform:translateX(10%); opacity:1; }
          100%{ transform:translateX(120%); opacity:.6; }
        }
      `}</style>
    </div>
  );
});

export default ThreeGateway;
