import React from 'react';

// 연기 효과 컴포넌트 - 연기 제거됨
function SmokeEffect() {
  return <div></div>;
}

const SmokeCanvas = ({ cameraPosition, cameraLookAt, fov, opacity }) => {
  return (
    <div style={{ display: 'none' }}>
      {/* 연기 캔버스 비활성화됨 */}
    </div>
  );
};

export default SmokeCanvas; 