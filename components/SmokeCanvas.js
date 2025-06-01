import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

function SmokeParticles() {
  const meshRef = useRef();
  const count = 1500; // 파티클 수

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        // 중앙에서 시작하는 원형 파티클 (X-Y 평면)
        angle: Math.random() * Math.PI * 2, // 초기 각도
        radius: 0, // 중앙에서 시작
        speed: Math.random() * 0.015 + 0.008, // 회전 속도 증가
        growth: Math.random() * 0.025 + 0.015, // 바깥으로 퍼지는 속도 증가
        
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 150, // 수명 단축
        size: Math.random() * 0.15 + 0.08, // 크기 증가
        offset: Math.random() * 100,
        
        // 나선형 효과를 위한 매개변수
        spiralIntensity: Math.random() * 0.5 + 0.2,
        rotationDirection: Math.random() > 0.5 ? 1 : -1,
        
        // 노이즈 매개변수
        noiseSpeed: Math.random() * 0.4 + 0.2,
        turbulence: Math.random() * 0.3 + 0.1,
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    particles.forEach((particle, i) => {
      const t = state.clock.elapsedTime + particle.offset;
      
      // 수명 증가
      particle.life += 1;
      
      // 수명이 다하면 리셋 (중앙에서 다시 시작)
      if (particle.life > particle.maxLife) {
        particle.life = 0;
        particle.angle = Math.random() * Math.PI * 2;
        particle.radius = 0; // 중앙에서 다시 시작
        particle.speed = Math.random() * 0.015 + 0.008;
        particle.growth = Math.random() * 0.025 + 0.015;
        particle.rotationDirection = Math.random() > 0.5 ? 1 : -1;
      }

      // 원형 회전하며 퍼져나가는 움직임 (예시 코드와 같은 방식)
      particle.radius += particle.growth; // 바깥으로 퍼져나감
      particle.angle += particle.speed * particle.rotationDirection; // 회전
      
      // 나선형 효과 추가
      const spiralEffect = particle.radius * particle.spiralIntensity * 0.1;
      const currentAngle = particle.angle + spiralEffect;
      
      // X-Y 평면에서의 원형 좌표 (웹에서 원형으로 보임)
      const baseX = particle.radius * Math.cos(currentAngle);
      const baseY = particle.radius * Math.sin(currentAngle);
      const baseZ = 0; // Z축 고정으로 평면 유지
      
      // 부드러운 노이즈 효과
      const t1 = t * particle.noiseSpeed + particle.offset;
      const t2 = t * particle.noiseSpeed * 0.7 + particle.offset;
      
      // 거리에 비례한 노이즈 (멀어질수록 더 큰 변화)
      const noiseFactor = particle.radius * 0.08;
      const noiseX = Math.sin(t1 + particle.angle * 3) * noiseFactor;
      const noiseY = Math.cos(t2 + particle.angle * 3) * noiseFactor;
      
      // 터뷸런스 효과
      const turbulenceX = Math.sin(t * 1.5 + particle.offset) * particle.turbulence * 0.15;
      const turbulenceY = Math.cos(t * 1.3 + particle.offset + 2) * particle.turbulence * 0.15;
      
      // 최종 위치 (X-Y 평면에서의 원형)
      const finalX = baseX + noiseX + turbulenceX;
      const finalY = baseY + noiseY + turbulenceY;
      const finalZ = baseZ;
      
      // 투명도 계산 (수명과 거리 모두 고려, 더 관대하게)
      const lifeRatio = particle.life / particle.maxLife;
      const distanceFade = Math.max(0.1, 1 - particle.radius / 6); // 최소 0.1 투명도 보장
      
      let baseOpacity;
      if (lifeRatio < 0.15) {
        baseOpacity = (lifeRatio / 0.15); // 페이드인
      } else if (lifeRatio > 0.8) {
        baseOpacity = ((1 - lifeRatio) / 0.2); // 페이드아웃
      } else {
        baseOpacity = 1;
      }
      
      const finalOpacity = Math.max(0.05, baseOpacity * distanceFade); // 최소 투명도 보장
      
      // 크기 변화 (중앙에서 멀어질수록 약간 커짐)
      const sizeBase = 1.0 + particle.radius * 0.5;
      const sizeNoise = Math.sin(t * 0.9 + particle.offset) * 0.2 + 1;
      const sizeMultiplier = sizeBase * sizeNoise;
      
      // 회전에 따른 미세한 크기 변화
      const rotationScale = 0.9 + Math.sin(particle.angle * 2 + t * 0.3) * 0.1;
      
      dummy.position.set(finalX, finalY, finalZ);
      dummy.scale.setScalar(particle.size * sizeMultiplier * rotationScale);
      
      // 미세한 회전 효과
      dummy.rotation.set(
        Math.sin(t * 0.3 + particle.offset) * 0.1,
        Math.cos(t * 0.2 + particle.offset) * 0.1,
        particle.angle * 0.1 // Z축 중심 회전
      );
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // 색상 설정
      const color = new THREE.Color();
      color.setRGB(1, 1, 1);
      meshRef.current.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial
        color="white"
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

const SmokeCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 75 }}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    >
      <SmokeParticles />
    </Canvas>
  );
};

export default SmokeCanvas; 