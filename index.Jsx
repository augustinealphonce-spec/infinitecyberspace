import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function Starfield() {
  const ref = useRef();
  const starCount = 5000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 2000;
  }

  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={1.5}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

function ShootingStar() {
  const [star, setStar] = useState(null);
  const trailRef = useRef();
  const { scene } = useThree();

  useEffect(() => {
    let interval = setInterval(() => {
      const geometry = new THREE.SphereGeometry(3, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xfffaaa });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-1000, (Math.random() - 0.5) * 600, (Math.random() - 0.5) * 600);
      scene.add(mesh);
      setStar(mesh);
    }, 5000);

    return () => clearInterval(interval);
  }, [scene]);

  useFrame(() => {
    if (star) {
      star.position.x += 15;
      star.position.y -= 5;

      if (star.position.x > 1000 || star.position.y < -1000) {
        scene.remove(star);
        setStar(null);
      }
    }
  });

  return null;
}

function CameraController() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 100, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.current.y * 100, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function SpaceBackground() {
  return (
    <Canvas
      camera={{ position: [0, 0, 500], fov: 75 }}
      onCreated={({ gl }) => {
        gl.setClearColor("black");
      }}
    >
      <Starfield />
      <ShootingStar />
      <CameraController />
    </Canvas>
  );
}
