import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

function Globe() {
  const wireRef = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (wireRef.current) wireRef.current.rotation.y += delta * 0.1;
    if (ring1.current) ring1.current.rotation.x += delta * 0.15;
    if (ring2.current) ring2.current.rotation.z += delta * 0.12;
    if (ring3.current) ring3.current.rotation.y += delta * 0.08;
  });

  return (
    <group>
      <Sphere args={[1.8, 32, 32]}>
        <meshBasicMaterial color="#050810" />
      </Sphere>
      <Sphere ref={wireRef} args={[2, 24, 24]}>
        <meshBasicMaterial wireframe color="#00E5FF" opacity={0.15} transparent />
      </Sphere>
      <Torus ref={ring1} args={[2.8, 0.015, 16, 100]} rotation={[Math.PI / 3, 0, 0]}>
        <meshBasicMaterial color="#00E5FF" opacity={0.4} transparent />
      </Torus>
      <Torus ref={ring2} args={[3.0, 0.01, 16, 100]} rotation={[0, Math.PI / 4, Math.PI / 6]}>
        <meshBasicMaterial color="#9D4EDD" opacity={0.3} transparent />
      </Torus>
      <Torus ref={ring3} args={[3.3, 0.008, 16, 100]} rotation={[Math.PI / 5, Math.PI / 3, 0]}>
        <meshBasicMaterial color="#00FF87" opacity={0.2} transparent />
      </Torus>
      <ThreatNodes />
      <pointLight position={[0, 0, 0]} color="#00E5FF" intensity={0.5} />
    </group>
  );
}

function ThreatNodes() {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * Math.PI * 2,
    radius: 2.5,
    speed: 0.15 + Math.random() * 0.1,
    phase: Math.random() * Math.PI * 2,
  }));

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const n = nodes[i];
      const t = state.clock.elapsedTime * n.speed + n.angle;
      child.position.x = Math.cos(t) * n.radius;
      child.position.z = Math.sin(t) * n.radius;
      child.position.y = Math.sin(t * 2 + n.phase) * 0.8;
      const scale = 0.8 + Math.sin(state.clock.elapsedTime * 3 + n.phase) * 0.2;
      child.scale.setScalar(scale);
    });
  });

  return (
    <group ref={groupRef}>
      {nodes.map((_, i) => (
        <Sphere key={i} args={[0.06, 8, 8]}>
          <meshBasicMaterial color="#FF2D6B" />
        </Sphere>
      ))}
    </group>
  );
}

export function DashboardGlobe() {
  return (
    <Canvas camera={{ position: [0, 1, 6], fov: 45 }} style={{ width: '100%', height: '100%' }}>
      <ambientLight intensity={0.05} />
      <pointLight position={[5, 5, 5]} color="#00E5FF" intensity={0.5} />
      <pointLight position={[-5, -3, 3]} color="#9D4EDD" intensity={0.3} />
      <Globe />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
    </Canvas>
  );
}
