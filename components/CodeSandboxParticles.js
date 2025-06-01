import React, { useEffect, useRef } from 'react';

const CodeSandboxParticles = () => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 파티클 클래스 - CodeSandbox 스타일
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 2 + 0.5;
        this.life = 1;
        this.decay = Math.random() * 0.01 + 0.005;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.5 + 0.2;
      }

      update() {
        // 중앙점으로의 원형 운동
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 중앙을 중심으로 한 각도 계산
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        let angle = Math.atan2(dy, dx);
        let radius = Math.sqrt(dx * dx + dy * dy);
        
        // 회전 운동
        angle += 0.01;
        
        // 중앙으로 서서히 끌려가는 효과
        radius *= 0.999;
        
        // 새로운 위치 계산
        this.x = centerX + Math.cos(angle) * radius;
        this.y = centerY + Math.sin(angle) * radius;
        
        // 미세한 랜덤 움직임
        this.x += (Math.random() - 0.5) * 0.5;
        this.y += (Math.random() - 0.5) * 0.5;
        
        // 수명 감소
        this.life -= this.decay;
        
        // 경계에서 재생성
        if (this.life <= 0 || radius < 10) {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.life = 1;
          this.decay = Math.random() * 0.01 + 0.005;
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.life * 0.6;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 파티클 초기화
    const numParticles = 200;
    for (let i = 0; i < numParticles; i++) {
      particlesRef.current.push(new Particle());
    }

    // 애니메이션 루프
    const animate = () => {
      time++;
      
      // 투명한 배경으로 클리어 (기존 요소들을 가리지 않음)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 파티클 업데이트 및 그리기
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // 연결선 그리기
      drawConnections();
      
      animationIdRef.current = requestAnimationFrame(animate);
    };

    // 파티클 간 연결선
    const drawConnections = () => {
      const maxDistance = 60;
      
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.2;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: 'transparent',
      }}
    />
  );
};

export default CodeSandboxParticles; 