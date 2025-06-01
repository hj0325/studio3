import React, { useEffect, useRef } from 'react';

const TendrilsEffect = ({ animationStage }) => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);
  const glRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL 컨텍스트 초기화
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 파티클 초기화
    const initParticles = () => {
      const particles = [];
      const numParticles = 300; // 파티클 수 감소로 더 미묘한 효과
      
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1, // 초기 속도 감소
          vy: (Math.random() - 0.5) * 1,
          life: Math.random(),
          maxLife: 1 + Math.random() * 2, // 수명 증가
          size: 0.5 + Math.random() * 1.5, // 크기 감소
          hue: 35 + Math.random() * 20, // 더 따뜻한 골드 색상 범위
          noiseOffset: Math.random() * 1000,
        });
      }
      particlesRef.current = particles;
    };

    // 버텍스 셰이더 - 파티클과 라인 모두 지원
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute float a_size;
      attribute float a_alpha;
      attribute vec3 a_color;
      
      uniform vec2 u_resolution;
      uniform bool u_isLine;
      
      varying float v_alpha;
      varying vec3 v_color;
      
      void main() {
        vec2 position = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(position * vec2(1, -1), 0, 1);
        
        if (!u_isLine) {
          gl_PointSize = a_size;
        }
        
        v_alpha = a_alpha;
        v_color = a_color;
      }
    `;

    // 프래그먼트 셰이더 - 파티클과 라인 모두 지원
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform bool u_isLine;
      varying float v_alpha;
      varying vec3 v_color;
      
      void main() {
        if (u_isLine) {
          gl_FragColor = vec4(v_color, v_alpha * 0.3);
        } else {
          float r = distance(gl_PointCoord, vec2(0.5, 0.5));
          if (r > 0.5) {
            discard;
          }
          float alpha = (1.0 - r * 2.0) * v_alpha * 0.8;
          gl_FragColor = vec4(v_color, alpha);
        }
      }
    `;

    // 셰이더 컴파일
    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    // 프로그램 생성
    const createProgram = (vertexSource, fragmentSource) => {
      const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
      
      if (!vertexShader || !fragmentShader) return null;
      
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }
      
      return program;
    };

    const program = createProgram(vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    // 속성 위치
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const sizeLocation = gl.getAttribLocation(program, 'a_size');
    const alphaLocation = gl.getAttribLocation(program, 'a_alpha');
    const colorLocation = gl.getAttribLocation(program, 'a_color');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const isLineLocation = gl.getUniformLocation(program, 'u_isLine');

    // 버퍼 생성
    const positionBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();
    const alphaBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();

    // 마우스 이벤트
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // 파티클 시스템 업데이트
    const updateParticles = (deltaTime) => {
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      
      particles.forEach(particle => {
        // 마우스 인터랙션 - 더 부드럽게
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = (150 - distance) / 150;
          particle.vx += (dx / distance) * force * 0.2; // 힘 감소
          particle.vy += (dy / distance) * force * 0.2;
        }

        // 물리학 업데이트 - 더 부드러운 감쇠
        particle.vx *= 0.995; 
        particle.vy *= 0.995;
        
        // 중앙으로 끌어당기는 힘 - 더 약하게
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const centerDx = centerX - particle.x;
        const centerDy = centerY - particle.y;
        const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
        
        if (centerDistance > 0) {
          particle.vx += (centerDx / centerDistance) * 0.05; // 힘 감소
          particle.vy += (centerDy / centerDistance) * 0.05;
        }

        // 더 복잡한 노이즈 기반 힘
        const time = timeRef.current * 0.0005;
        const noiseX = Math.sin(particle.x * 0.005 + time + particle.noiseOffset) * 
                      Math.cos(particle.y * 0.003 + time * 0.7) * 0.1;
        const noiseY = Math.cos(particle.y * 0.005 + time + particle.noiseOffset) * 
                      Math.sin(particle.x * 0.003 + time * 0.7) * 0.1;
        
        particle.vx += noiseX;
        particle.vy += noiseY;

        // 위치 업데이트
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 라이프 업데이트 - 더 천천히
        particle.life -= deltaTime * 0.0005;
        
        // 파티클 재생성 - 경계 조건 개선
        if (particle.life <= 0 || 
            particle.x < -100 || particle.x > canvas.width + 100 ||
            particle.y < -100 || particle.y > canvas.height + 100) {
          
          // 랜덤 위치에서 재생성 (중앙 편향)
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * Math.min(canvas.width, canvas.height) * 0.3;
          particle.x = centerX + Math.cos(angle) * radius;
          particle.y = centerY + Math.sin(angle) * radius;
          
          particle.vx = (Math.random() - 0.5) * 0.5;
          particle.vy = (Math.random() - 0.5) * 0.5;
          particle.life = particle.maxLife;
        }
      });
    };

    // 연결선 생성 함수 - 곡선 연결
    const generateConnections = (particles) => {
      const connections = [];
      const maxDistance = 80; // 연결 최대 거리
      const maxConnections = 3; // 파티클당 최대 연결 수
      const curveSegments = 8; // 곡선을 만들기 위한 세그먼트 수
      
      particles.forEach((particle, i) => {
        let connectionCount = 0;
        
        for (let j = i + 1; j < particles.length && connectionCount < maxConnections; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            const alpha = (maxDistance - distance) / maxDistance;
            
            // 곡선을 위한 제어점 계산
            const midX = (particle.x + other.x) / 2;
            const midY = (particle.y + other.y) / 2;
            
            // 수직 방향으로 곡률 추가
            const perpX = -dy / distance;
            const perpY = dx / distance;
            const curvature = distance * 0.3; // 곡률 강도
            
            const controlX = midX + perpX * curvature;
            const controlY = midY + perpY * curvature;
            
            // 베지어 곡선을 여러 세그먼트로 분할
            const curvePoints = [];
            for (let k = 0; k <= curveSegments; k++) {
              const t = k / curveSegments;
              const invT = 1 - t;
              
              // 2차 베지어 곡선 공식
              const x = invT * invT * particle.x + 2 * invT * t * controlX + t * t * other.x;
              const y = invT * invT * particle.y + 2 * invT * t * controlY + t * t * other.y;
              
              curvePoints.push({ x, y });
            }
            
            connections.push({
              points: curvePoints,
              alpha: alpha * Math.min(particle.life / particle.maxLife, other.life / other.maxLife)
            });
            connectionCount++;
          }
        }
      });
      
      return connections;
    };

    // 렌더링
    const render = (currentTime) => {
      const deltaTime = currentTime - timeRef.current;
      timeRef.current = currentTime;

      updateParticles(deltaTime);

      // 투명 배경으로 클리어
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const connections = generateConnections(particles);

      // 1. 연결선 그리기 - 곡선
      if (connections.length > 0) {
        gl.uniform1i(isLineLocation, true);
        
        const linePositions = [];
        const lineAlphas = [];
        const lineColors = [];
        
        connections.forEach(conn => {
          // 곡선의 각 세그먼트를 라인으로 연결
          for (let i = 0; i < conn.points.length - 1; i++) {
            const point1 = conn.points[i];
            const point2 = conn.points[i + 1];
            
            linePositions.push(point1.x, point1.y, point2.x, point2.y);
            lineAlphas.push(conn.alpha, conn.alpha);
            
            // 연결선도 골드 색상
            const time = timeRef.current * 0.0003;
            const r = 1.0;
            const g = 0.8 + Math.sin(time) * 0.1;
            const b = 0.4 + Math.sin(time * 2) * 0.1;
            
            lineColors.push(r, g, b, r, g, b);
          }
        });
        
        // 라인 버퍼 업데이트
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linePositions), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineAlphas), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(alphaLocation);
        gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineColors), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(colorLocation);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

        // 사이즈는 라인에서 사용되지 않지만 속성이 필요
        gl.disableVertexAttribArray(sizeLocation);
        gl.vertexAttrib1f(sizeLocation, 1.0);

        gl.drawArrays(gl.LINES, 0, linePositions.length / 2);
      }

      // 2. 파티클 그리기
      gl.uniform1i(isLineLocation, false);
      
      const positions = [];
      const sizes = [];
      const alphas = [];
      const colors = [];

      particles.forEach(particle => {
        positions.push(particle.x, particle.y);
        sizes.push(particle.size);
        
        const alpha = Math.max(0, particle.life / particle.maxLife);
        alphas.push(alpha);
        
        // 더 정교한 골드 색상 계산
        const time = timeRef.current * 0.0003;
        const hue = particle.hue + Math.sin(time + particle.noiseOffset) * 5;
        
        // 골드 색상을 직접 계산 (더 아름다운 색상)
        const r = 1.0;
        const g = 0.8 + Math.sin(time + particle.noiseOffset * 0.1) * 0.1;
        const b = 0.3 + Math.sin(time * 2 + particle.noiseOffset * 0.2) * 0.2;
        
        colors.push(r, g, b);
      });

      // 파티클 버퍼 업데이트
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(sizeLocation);
      gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(alphaLocation);
      gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, particles.length);
      
      animationIdRef.current = requestAnimationFrame(render);
    };

    // 초기화 및 시작
    initParticles();
    timeRef.current = performance.now();
    render(timeRef.current);

    // 클린업
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  // 애니메이션 단계에 따른 투명도 계산 - 더 미묘하게
  const getOpacity = () => {
    switch (animationStage) {
      case 'initial':
        return 0.6; // 초기 투명도 감소
      case 'blurring':
      case 'logoShowing':
        return 0.3;
      case 'fadingOut':
        return 0.15;
      default:
        return 0;
    }
  };

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
        opacity: getOpacity(),
        transition: 'opacity 0.5s ease-in-out',
      }}
    />
  );
};

export default TendrilsEffect; 