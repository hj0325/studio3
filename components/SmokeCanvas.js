import React, { useRef } from 'react';
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Clouds, Cloud } from "@react-three/drei";

// 연기 효과 컴포넌트 - 가장자리에서 바깥으로 퍼지며 피어오르는 효과
function SmokeEffect() {
  const waveRefs = useRef([]);
  
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    waveRefs.current.forEach((cloudRef, index) => {
      if (cloudRef && cloudRef.current) {
        // 각 연기층마다 다른 움직임 패턴
        const waveSpeed = 0.2 + index * 0.05;
        const waveHeight = 2 + index * 1;
        const waveOffset = index * Math.PI * 0.3;
        
        // Y축: 바닥에서 위로 천천히 올라감
        cloudRef.current.position.y += delta * (0.5 + index * 0.2);
        
        // 가장자리로 퍼지는 움직임
        const spreadEffect = Math.sin(time * waveSpeed + waveOffset) * 0.5;
        cloudRef.current.position.x += delta * spreadEffect;
        
        // 회전: 각 연기마다 다른 회전속도
        cloudRef.current.rotation.y += delta * (0.05 + index * 0.01);
        cloudRef.current.rotation.z += delta * (0.02 + index * 0.005);
        
        // 연기가 너무 위로 올라가면 다시 아래로 재설정
        if (cloudRef.current.position.y > 20) {
          cloudRef.current.position.y = -15;
        }
      }
    });
  });

  return (
    <group>
      <Clouds material={THREE.MeshLambertMaterial} limit={400}>
        {/* 왼쪽 가장자리 연기 - 첫 번째 층 */}
        <Cloud 
          ref={(el) => (waveRefs.current[0] = { current: el })}
          seed={1}
          segments={60}
          volume={20}
          opacity={0.4}
          fade={15}
          growth={2}
          speed={0.08}
          bounds={[25, 8, 20]}
          color="#ffffff"
          position={[-25, -12, 0]}
        />
        
        {/* 왼쪽 가장자리 연기 - 두 번째 층 */}
        <Cloud 
          ref={(el) => (waveRefs.current[1] = { current: el })}
          seed={2}
          segments={55}
          volume={18}
          opacity={0.35}
          fade={18}
          growth={2.5}
          speed={0.06}
          bounds={[22, 10, 18]}
          color="#fefefe"
          position={[-30, -10, 2]}
        />
        
        {/* 오른쪽 가장자리 연기 - 첫 번째 층 */}
        <Cloud 
          ref={(el) => (waveRefs.current[2] = { current: el })}
          seed={3}
          segments={60}
          volume={20}
          opacity={0.4}
          fade={15}
          growth={2}
          speed={0.08}
          bounds={[25, 8, 20]}
          color="#ffffff"
          position={[25, -12, 0]}
        />
        
        {/* 오른쪽 가장자리 연기 - 두 번째 층 */}
        <Cloud 
          ref={(el) => (waveRefs.current[3] = { current: el })}
          seed={4}
          segments={55}
          volume={18}
          opacity={0.35}
          fade={18}
          growth={2.5}
          speed={0.06}
          bounds={[22, 10, 18]}
          color="#fefefe"
          position={[30, -10, -2]}
        />
        
        {/* 왼쪽 바깥쪽 연기 - 더 멀리 퍼짐 */}
        <Cloud 
          ref={(el) => (waveRefs.current[4] = { current: el })}
          seed={5}
          segments={50}
          volume={25}
          opacity={0.3}
          fade={20}
          growth={3}
          speed={0.05}
          bounds={[30, 12, 25]}
          color="#fafafa"
          position={[-40, -8, 1]}
        />
        
        {/* 오른쪽 바깥쪽 연기 - 더 멀리 퍼짐 */}
        <Cloud 
          ref={(el) => (waveRefs.current[5] = { current: el })}
          seed={6}
          segments={50}
          volume={25}
          opacity={0.3}
          fade={20}
          growth={3}
          speed={0.05}
          bounds={[30, 12, 25]}
          color="#fafafa"
          position={[40, -8, -1]}
        />
        
        {/* 왼쪽 극단 가장자리 - 화면 밖으로 퍼짐 */}
        <Cloud 
          seed={7}
          segments={45}
          volume={30}
          opacity={0.25}
          fade={25}
          growth={4}
          speed={0.03}
          bounds={[35, 15, 30]}
          color="#f8f8f8"
          position={[-50, -6, 0]}
        />
        
        {/* 오른쪽 극단 가장자리 - 화면 밖으로 퍼짐 */}
        <Cloud 
          seed={8}
          segments={45}
          volume={30}
          opacity={0.25}
          fade={25}
          growth={4}
          speed={0.03}
          bounds={[35, 15, 30]}
          color="#f8f8f8"
          position={[50, -6, 0]}
        />
        
        {/* 전체적인 배경 안개 - 가장자리에만 */}
        <Cloud 
          seed={9}
          segments={40}
          volume={35}
          opacity={0.15}
          fade={30}
          growth={5}
          speed={0.02}
          bounds={[40, 20, 35]}
          color="#ffffff"
          position={[-35, 0, 0]}
        />
        
        <Cloud 
          seed={10}
          segments={40}
          volume={35}
          opacity={0.15}
          fade={30}
          growth={5}
          speed={0.02}
          bounds={[40, 20, 35]}
          color="#ffffff"
          position={[35, 0, 0]}
        />
      </Clouds>
    </group>
  );
}

const SmokeCanvas = ({ cameraPosition, cameraLookAt, fov = 70, opacity = 1 }) => {
  return (
    <Canvas
      camera={{ position: cameraPosition, fov: fov, lookAt: cameraLookAt }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[-20, -5, 15]} intensity={1.2} color="#ffffff" />
      <pointLight position={[20, -5, 15]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[0, 10, 5]} intensity={0.4} color="#ffffff" />
      <SmokeEffect />
    </Canvas>
  );
};

export default SmokeCanvas; 