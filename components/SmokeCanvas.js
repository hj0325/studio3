import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

function SmokeParticles() {
  const meshRef = useRef();
  const count = 1200;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // 하단 가장자리에서 시작하여 양 사이드로 빠져나가도록 설정
      const side = Math.random() > 0.5 ? -1 : 1; // 왼쪽 또는 오른쪽
      const xStart = side * (1.5 + Math.random() * 4); // 양쪽 가장자리에서 시작, 더 넓게
      
      arr.push({
        x: xStart,
        y: -8 - Math.random() * 2, // 하단에서 시작
        z: (Math.random() - 0.5) * 2,
        xVel: side * (0.008 + Math.random() * 0.02), // 양쪽으로 퍼져나가는 속도 증가
        yVel: 0.015 + Math.random() * 0.025, // 위로 올라가는 속도 - 약간 랜덤하게
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 150, // 수명 조금 증가
        size: 0.15 + Math.random() * 0.25, // 둥근 형태에 맞게 크기 조정
        offset: Math.random() * 100,
        noiseSpeed: 0.3 + Math.random() * 0.8, // 노이즈 속도 더 랜덤하게
        rotationSpeed: (Math.random() - 0.5) * 0.03, // 회전 속도 더 랜덤하게
        // 추가 노이즈 매개변수들
        noiseOffsetX: Math.random() * 50,
        noiseOffsetY: Math.random() * 50,
        noiseOffsetZ: Math.random() * 50,
        turbulence: 0.5 + Math.random() * 1.5, // 터뷸런스 강도
        swirl: (Math.random() - 0.5) * 0.02, // 소용돌이 효과
        drift: (Math.random() - 0.5) * 0.01, // 드리프트 효과
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
      
      // 수명이 다하면 리셋
      if (particle.life > particle.maxLife) {
        particle.life = 0;
        const side = Math.random() > 0.5 ? -1 : 1;
        particle.x = side * (1.5 + Math.random() * 4);
        particle.y = -8 - Math.random() * 2;
        particle.z = (Math.random() - 0.5) * 2;
        particle.xVel = side * (0.008 + Math.random() * 0.02);
        particle.yVel = 0.015 + Math.random() * 0.025;
        // 노이즈 매개변수들도 리셋
        particle.noiseOffsetX = Math.random() * 50;
        particle.noiseOffsetY = Math.random() * 50;
        particle.noiseOffsetZ = Math.random() * 50;
        particle.turbulence = 0.5 + Math.random() * 1.5;
        particle.swirl = (Math.random() - 0.5) * 0.02;
        particle.drift = (Math.random() - 0.5) * 0.01;
      }

      // 복잡한 노이즈를 이용한 자연스러운 움직임
      const t1 = t * particle.noiseSpeed + particle.noiseOffsetX;
      const t2 = t * particle.noiseSpeed * 0.7 + particle.noiseOffsetY;
      const t3 = t * particle.noiseSpeed * 1.3 + particle.noiseOffsetZ;
      
      // 다중 레이어 노이즈
      const noiseX1 = Math.sin(t1) * 0.3;
      const noiseX2 = Math.sin(t1 * 2.1 + 1.7) * 0.15;
      const noiseX3 = Math.sin(t1 * 4.3 + 3.2) * 0.05;
      
      const noiseY1 = Math.cos(t2 * 0.8) * 0.1;
      const noiseY2 = Math.sin(t2 * 1.6 + 2.1) * 0.05;
      
      const noiseZ1 = Math.cos(t3 * 0.9) * 0.25;
      const noiseZ2 = Math.sin(t3 * 1.8 + 1.4) * 0.1;
      const noiseZ3 = Math.cos(t3 * 3.7 + 2.8) * 0.03;
      
      // 터뷸런스 효과
      const turbulenceX = Math.sin(t * 2.1 + particle.offset) * particle.turbulence * 0.1;
      const turbulenceY = Math.cos(t * 1.7 + particle.offset + 1.5) * particle.turbulence * 0.05;
      const turbulenceZ = Math.sin(t * 2.3 + particle.offset + 3.0) * particle.turbulence * 0.08;
      
      // 소용돌이 효과
      const swirlAngle = t * particle.swirl + particle.offset;
      const swirlRadius = (particle.y + 8) * 0.1;
      const swirlX = Math.cos(swirlAngle) * swirlRadius * particle.swirl * 20;
      const swirlZ = Math.sin(swirlAngle) * swirlRadius * particle.swirl * 20;
      
      // 위치 업데이트
      particle.x += particle.xVel + particle.drift;
      particle.y += particle.yVel + (Math.random() - 0.5) * 0.002; // 수직 움직임에 랜덤성 추가
      
      // 바람 효과 (위로 올라갈수록 더 퍼짐) - 더 강하게
      const windEffect = (particle.y + 8) * 0.003; // 바람 효과 3배 증가
      const windNoise = Math.sin(t * 0.5 + particle.offset) * 0.5 + 0.5; // 0~1 사이 값
      particle.x += windEffect * (particle.x > 0 ? 1 : -1) * windNoise;
      
      // 최종 위치 설정 (모든 노이즈 합성)
      const finalX = particle.x + noiseX1 + noiseX2 + noiseX3 + turbulenceX + swirlX;
      const finalY = particle.y + noiseY1 + noiseY2 + turbulenceY;
      const finalZ = particle.z + noiseZ1 + noiseZ2 + noiseZ3 + turbulenceZ + swirlZ;
      
      // 투명도 계산 (생명주기에 따라)
      const lifeRatio = particle.life / particle.maxLife;
      let opacity;
      if (lifeRatio < 0.15) {
        opacity = lifeRatio / 0.15; // 페이드인
      } else if (lifeRatio > 0.7) {
        opacity = (1 - lifeRatio) / 0.3; // 페이드아웃
      } else {
        opacity = 1;
      }
      
      // 크기 변화 (위로 올라갈수록 커짐) - 더 랜덤하게
      const sizeBase = 1 + lifeRatio * 2.5;
      const sizeNoise = Math.sin(t * 1.2 + particle.offset) * 0.3 + 1; // 0.7~1.3 사이
      const sizeMultiplier = sizeBase * sizeNoise;
      
      // 둥근 형태에 맞는 균등한 스케일
      const scaleVariation = 0.8 + Math.sin(t * 1.1 + particle.offset) * 0.2;
      
      dummy.position.set(finalX, finalY, finalZ);
      dummy.scale.setScalar(particle.size * sizeMultiplier * scaleVariation); // 모든 축 동일하게
      
      // 더 복잡한 회전
      dummy.rotation.set(
        Math.sin(t * 0.8 + particle.offset) * 0.4 + Math.cos(t * 1.3 + particle.offset + 1) * 0.2,
        particle.rotationSpeed * t + Math.sin(t * 0.6 + particle.offset + 2) * 0.3, // y축 회전
        Math.cos(t * 0.7 + particle.offset + 3) * 0.3 + Math.sin(t * 1.1 + particle.offset + 4) * 0.15
      );
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // 개별 파티클 투명도 설정을 위한 색상 배열 업데이트
      const color = new THREE.Color();
      color.setRGB(1, 1, 1); // 흰색 연기
      meshRef.current.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.1, 8, 6]} />
      <meshBasicMaterial
        color="white"
        transparent
        opacity={0.1}
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