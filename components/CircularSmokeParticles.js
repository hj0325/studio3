import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

function SmokeParticles() {
  const meshRef = useRef();
  const count = 5000; // 파티클 수 증가 (1800 → 3000)

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // 2D 극좌표 회오리를 위한 설정
      const angle = Math.random() * Math.PI * 2; // 초기 각도 (0 ~ 2π)
      const initialRadius = Math.random() * 0.5; // 중심 근처에서 시작 (더 작게)
      
      arr.push({
        // 극좌표계 (평면 회오리, X-Y 평면)
        angle: angle,
        radius: initialRadius,
        x: Math.cos(angle) * initialRadius,
        y: Math.sin(angle) * initialRadius,
        z: 0, // Z축은 0으로 시작 (평면)
        
        // 평면 회오리 움직임 매개변수
        angularVelocity: 0.003 + Math.random() * 0.002, // 시계방향 회전 속도 (더 느리게)
        radialGrowth: 0.004 + Math.random() * 0.002, // 바깥으로 퍼지는 속도 (더 느리게)
        
        life: Math.random() * 400,
        maxLife: 400 + Math.random() * 300,
        size: 0.1 + Math.random() * 0.18,
        offset: Math.random() * 100,
        
        // 회오리 효과를 위한 매개변수
        spiralIntensity: 0.8 + Math.random() * 1, // 나선 강도
        noiseSpeed: 0.05 + Math.random() * 0.1, // 부드러운 노이즈
        turbulence: 0.05 + Math.random() * 0.15, // 미세한 터뷸런스
        
        // 깊이감을 위한 미세한 Z축 움직임
        verticalOffset: Math.random() * Math.PI * 2,
        verticalAmplitude: 0.1 + Math.random() * 0.2, // 더 작은 진폭
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
        particle.radius = Math.random() * 0.5;
        particle.angularVelocity = 0.003 + Math.random() * 0.002;
        particle.radialGrowth = 0.004 + Math.random() * 0.002;
      }

      // 2D 평면 회오리 움직임 업데이트
      particle.angle += particle.angularVelocity;
      particle.radius += particle.radialGrowth;
      
      // 나선형 회오리 효과 (반지름에 따라 각속도 다르게)
      const radiusBasedRotation = particle.radius * 0.1; // 바깥쪽일수록 더 빠른 회전 (느리게)
      const spiralEffect = Math.sin(particle.radius * 3 + t * 0.5) * particle.spiralIntensity * 0.05;
      const vortexAngle = particle.angle + radiusBasedRotation + spiralEffect;
      
      // 극좌표 → 직교좌표 변환 (X-Y 평면, 카메라가 정면에서 볼 수 있도록)
      const baseX = Math.cos(vortexAngle) * particle.radius;
      const baseY = Math.sin(vortexAngle) * particle.radius;
      
      // 미세한 깊이감 (Z축으로 약간의 진동)
      const depthWave = Math.sin(t * 0.8 + particle.verticalOffset) * particle.verticalAmplitude * 0.1;
      const baseZ = depthWave;
      
      // 부드러운 노이즈 효과
      const t1 = t * particle.noiseSpeed + particle.offset;
      
      const noiseX = Math.sin(t1 + vortexAngle * 2) * 0.05;
      const noiseY = Math.sin(t1 * 0.7 + vortexAngle) * 0.05;
      const noiseZ = Math.cos(t1 * 1.3 + particle.radius) * 0.02;
      
      // 미세한 터뷸런스
      const turbulenceX = Math.sin(t * 0.8 + particle.offset) * particle.turbulence * 0.03;
      const turbulenceY = Math.sin(t * 0.6 + particle.offset + 2.0) * particle.turbulence * 0.03;
      const turbulenceZ = Math.cos(t * 1.1 + particle.offset + 1.0) * particle.turbulence * 0.01;
      
      // 최종 위치 설정 (평면 회오리, X-Y 평면)
      const finalX = baseX + noiseX + turbulenceX;
      const finalY = baseY + noiseY + turbulenceY;
      const finalZ = baseZ + noiseZ + turbulenceZ;
      
      // 투명도 계산 (중앙에서 멀어질수록 서서히 사라짐)
      const lifeRatio = particle.life / particle.maxLife;
      const distanceFade = Math.max(0, 1 - Math.pow(particle.radius / 4, 1.5)); // 거리에 따른 페이드 강화
      
      let opacity;
      if (lifeRatio < 0.15) {
        opacity = (lifeRatio / 0.15) * distanceFade; // 페이드인 구간 확장
      } else if (lifeRatio > 0.75) {
        opacity = ((1 - lifeRatio) / 0.25) * distanceFade; // 페이드아웃 구간 확장
      } else {
        opacity = distanceFade;
      }
      
      // 추가 가장자리 투명도 효과 (반지름 기반)
      const edgeFade = Math.max(0, 1 - Math.pow(particle.radius / 3.5, 2));
      opacity *= edgeFade * 0.4; // 전체적으로 더 연하게
      
      // 크기 변화 (중앙에서 멀어질수록 커짐)
      const sizeBase = 0.6 + particle.radius * 0.4;
      const sizeNoise = Math.sin(t * 1.1 + particle.offset) * 0.1 + 1;
      const sizeMultiplier = sizeBase * sizeNoise;
      
      // 회오리 회전에 따른 스케일 변화
      const rotationScale = 0.9 + Math.sin(vortexAngle * 1.2 + t * 0.3) * 0.1;
      
      dummy.position.set(finalX, finalY, finalZ);
      dummy.scale.setScalar(particle.size * sizeMultiplier * rotationScale);
      
      // 평면 회오리에 맞는 간단한 회전 (X-Y 평면)
      dummy.rotation.set(
        0, // X축 회전 없음 (평면 유지)
        0, // Y축 회전 없음 (평면 유지)  
        vortexAngle + t * 0.03  // Z축 회전 (더 느리게)
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
      <sphereGeometry args={[0.08, 6, 6]} />
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

const CircularSmokeParticles = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 75 }}
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

export default CircularSmokeParticles; 