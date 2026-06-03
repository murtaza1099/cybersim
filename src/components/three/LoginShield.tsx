import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Icosahedron, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function Shield() {
  const wireRef = useRef<THREE.Mesh>(null);
  const solidRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (wireRef.current) wireRef.current.rotation.y += delta * 0.15;
    if (wireRef.current) wireRef.current.rotation.x += delta * 0.05;
    if (solidRef.current) solidRef.current.rotation.y -= delta * 0.1;
  });

  return (
    <group position={[0, 0.5, 0]}>
      <Icosahedron ref={wireRef} args={[2, 1]}>
        <meshBasicMaterial wireframe color="#00E5FF" opacity={0.3} transparent />
      </Icosahedron>
      <Icosahedron ref={solidRef} args={[1.5, 2]}>
        <meshStandardMaterial color="#00E5FF" metalness={0.8} roughness={0.2} emissive="#00E5FF" emissiveIntensity={0.1} />
      </Icosahedron>
      <OrbitingParticles />
    </group>
  );
}

function OrbitingParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = Array.from({ length: 30 }, (_, i) => ({
    angle: (i / 30) * Math.PI * 2,
    radius: 2.8 + Math.random() * 0.5,
    speed: 0.2 + Math.random() * 0.3,
    y: (Math.random() - 0.5) * 2,
  }));

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      const t = state.clock.elapsedTime * p.speed + p.angle;
      child.position.x = Math.cos(t) * p.radius;
      child.position.z = Math.sin(t) * p.radius;
      child.position.y = p.y + Math.sin(t * 2) * 0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <Sphere key={i} args={[0.04, 8, 8]}>
          <meshBasicMaterial color="#00E5FF" />
        </Sphere>
      ))}
    </group>
  );
}

export function LoginShield() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.1} />
      <pointLight position={[3, 3, 3]} color="#00E5FF" intensity={1} />
      <pointLight position={[-3, -2, 2]} color="#9D4EDD" intensity={0.5} />
      <Shield />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
