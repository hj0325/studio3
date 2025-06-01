import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

function SmokeParticles() {
  const meshRef = useRef();
  const count = 2000; // 파티클 수 대폭 증가

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // 회오리 효과를 위한 각도와 반지름 설정
      const angle = Math.random() * Math.PI * 2; // 0 ~ 2π 랜덤 각도
      const initialRadius = Math.random() * 0.3; // 중앙 근처에서 시작
      
      arr.push({
        // 극좌표계로 위치 설정 (평면적)
        angle: angle,
        radius: initialRadius,
        x: Math.cos(angle) * initialRadius,
        y: 0, // 평면적으로 고정
        z: 0, // 평면적으로 고정
        
        // 회오리 움직임 매개변수
        angularVelocity: 0.008 + Math.random() * 0.015, // 회전 속도
        radialVelocity: 0.006 + Math.random() * 0.012, // 바깥으로 퍼지는 속도
        
        life: Math.random() * 400,
        maxLife: 400 + Math.random() * 300,
        size: 0.08 + Math.random() * 0.15,
        offset: Math.random() * 100,
        
        // 노이즈 및 터뷸런스 매개변수
        noiseSpeed: 0.15 + Math.random() * 0.4,
        turbulence: 0.2 + Math.random() * 0.6,
        spiralOffset: Math.random() * Math.PI * 2, // 나선 오프셋
        
        // 회오리 방향 (시계방향 또는 반시계방향)
        direction: Math.random() > 0.5 ? 1 : -1,
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
        particle.radius = Math.random() * 0.3;
        particle.y = 0; // 평면적으로 고정
        particle.angularVelocity = 0.008 + Math.random() * 0.015;
        particle.radialVelocity = 0.006 + Math.random() * 0.012;
        particle.direction = Math.random() > 0.5 ? 1 : -1;
      }

      // 회오리 움직임 업데이트
      particle.angle += particle.angularVelocity * particle.direction;
      particle.radius += particle.radialVelocity;
      
      // 나선형 효과 추가 (평면적)
      const spiralEffect = Math.sin(particle.radius * 4 + t + particle.spiralOffset) * 0.08;
      const currentAngle = particle.angle + spiralEffect;
      
      // 기본 위치 계산 (극좌표 → 직교좌표, 평면적)
      const baseX = Math.cos(currentAngle) * particle.radius;
      const baseZ = Math.sin(currentAngle) * particle.radius;
      
      // 평면적 노이즈 (X, Z축만 사용)
      const t1 = t * particle.noiseSpeed + particle.offset;
      const t2 = t * particle.noiseSpeed * 0.8 + particle.offset + 50;
      
      // 2D 노이즈 (더 부드럽게)
      const noiseX1 = Math.sin(t1 + particle.radius * 2) * 0.15;
      const noiseX2 = Math.sin(t1 * 2.3 + 1.5) * 0.08;
      
      const noiseZ1 = Math.cos(t2 + particle.radius * 2) * 0.15;
      const noiseZ2 = Math.sin(t2 * 1.9 + 2.1) * 0.08;
      
      // 터뷸런스 효과 (평면적)
      const turbulenceX = Math.sin(t * 1.6 + particle.offset) * particle.turbulence * 0.08;
      const turbulenceZ = Math.cos(t * 1.4 + particle.offset + 2.0) * particle.turbulence * 0.08;
      
      // 최종 위치 설정 (평면적)
      const finalX = baseX + noiseX1 + noiseX2 + turbulenceX;
      const finalY = 0; // 완전히 평면적
      const finalZ = baseZ + noiseZ1 + noiseZ2 + turbulenceZ;
      
      // 투명도 계산 (중앙에서 멀어질수록 서서히 사라짐)
      const lifeRatio = particle.life / particle.maxLife;
      const distanceFade = Math.max(0, 1 - particle.radius / 6); // 거리에 따른 페이드
      
      let opacity;
      if (lifeRatio < 0.08) {
        opacity = (lifeRatio / 0.08) * distanceFade; // 페이드인
      } else if (lifeRatio > 0.85) {
        opacity = ((1 - lifeRatio) / 0.15) * distanceFade; // 페이드아웃
      } else {
        opacity = distanceFade;
      }
      
      // 크기 변화 (중앙에서 멀어질수록 커짐)
      const sizeBase = 0.7 + particle.radius * 0.8;
      const sizeNoise = Math.sin(t * 1.1 + particle.offset) * 0.15 + 1;
      const sizeMultiplier = sizeBase * sizeNoise;
      
      // 회전에 따른 스케일 변화 (평면적)
      const rotationScale = 0.9 + Math.sin(particle.angle * 2 + t * 0.5) * 0.1;
      
      dummy.position.set(finalX, finalY, finalZ);
      dummy.scale.setScalar(particle.size * sizeMultiplier * rotationScale);
      
      // 평면적 회전 (Y축 중심만)
      dummy.rotation.set(
        0, // X축 회전 제거
        particle.angle + t * 0.1, // Y축 회전만 (평면적)
        0  // Z축 회전 제거
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
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshBasicMaterial
        color="white"
        transparent
        opacity={0.18}
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