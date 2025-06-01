import React, { useEffect, useRef } from 'react';

const CircularPoints = () => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 설정 - vchirkov/webgl-stuff 기반
    // 기본 크기 (가장 작은)
    const configSmall = {
      circles: 30,          // 원형 링의 개수
      r: 80,               // 내부 반지름
      space: 4,            // 링 간격
      points: 150,         // 가장 작은 원의 포인트 수
      diffusion: 0.3,      // 링별 포인트 감소율
      rotation: 0.0006,    // 회전 속도
      impact: 0.06,        // 흔들림 강도
      stabilityStart: 0.9, // 내부 링 안정성
      stabilityEnd: 0.9,   // 외부 링 안정성
      opacity: 0.8,        // 기본 투명도
      visible: 25          // 보이는 링 수
    };

    // 중간 크기
    const configMedium = {
      circles: 35,          // 원형 링의 개수
      r: 150,              // 내부 반지름 (더 큰)
      space: 1.5,            // 링 간격
      points: 180,         // 가장 작은 원의 포인트 수
      diffusion: 0.25,     // 링별 포인트 감소율
      rotation: -0.0004,   // 회전 속도 (반대 방향)
      impact: 0.08,        // 흔들림 강도
      stabilityStart: 0.95, // 내부 링 안정성
      stabilityEnd: 0.85,  // 외부 링 안정성
      opacity: 0.6,        // 기본 투명도
      visible: 30          // 보이는 링 수
    };

    // 큰 크기 (가장 큰)
    const configLarge = {
      circles: 40,          // 원형 링의 개수
      r: 220,              // 내부 반지름 (가장 큰)
      space: 7,            // 링 간격
      points: 300,         // 가장 작은 원의 포인트 수
      diffusion: 0.2,      // 링별 포인트 감소율
      rotation: 0.0003,    // 회전 속도 (가장 느린)
      impact: 0.1,         // 흔들림 강도
      stabilityStart: 0.98, // 내부 링 안정성
      stabilityEnd: 0.8,   // 외부 링 안정성
      opacity: 0.4,        // 기본 투명도 (가장 투명)
      visible: 100          // 보이는 링 수
    };

    // Vertex Shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      uniform vec2 u_translation;
      uniform float u_scale;
      
      void main() {
        vec2 position = (a_position * u_scale + u_translation) / u_resolution * 2.0 - 1.0;
        gl_Position = vec4(position * vec2(1, -1), 0, 1);
        gl_PointSize = 2.0;
      }
    `;

    // Fragment Shader
    const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 u_color;
      
      void main() {
        vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
        if (dot(circCoord, circCoord) > 1.0) {
          discard;
        }
        gl_FragColor = u_color;
      }
    `;

    // Shader 컴파일
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

    // 유니폼 및 속성 위치 가져오기
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const translationUniformLocation = gl.getUniformLocation(program, 'u_translation');
    const scaleUniformLocation = gl.getUniformLocation(program, 'u_scale');
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

    // 원형 링들 생성 함수
    const createRings = (config) => {
      const rings = [];
      for (let i = 0; i < config.circles; i++) {
        const radius = config.r + config.space * i;
        const pointCount = Math.max(1, Math.floor(config.points - config.diffusion * i));
        const points = [];
        
        for (let j = 0; j < pointCount; j++) {
          const angle = (j / pointCount) * Math.PI * 2;
          points.push(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
          );
        }
        
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        
        rings.push({
          buffer,
          pointCount,
          radius,
          rotation: Math.random() * Math.PI * 2, // 각 링마다 다른 시작 회전값
          noise: Math.random() * Math.PI * 2
        });
      }
      return rings;
    };

    // 3개의 다른 크기 링 시스템 생성
    const ringsSmall = createRings(configSmall);
    const ringsMedium = createRings(configMedium);
    const ringsLarge = createRings(configLarge);

    // 노이즈 함수 (간단한 perlin noise 근사)
    const noise = (x, y, z) => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
      return (n - Math.floor(n)) * 2 - 1;
    };

    // 렌더링 함수
    let time = 0;
    const render = () => {
      time += 1;
      
      // 투명 배경으로 클리어
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(program);
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      
      // 화면 중앙 계산
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ringsSmall.forEach((ring, index) => {
        if (index >= configSmall.visible) return;
        
        // 각 링의 회전 및 노이즈 업데이트
        ring.rotation += configSmall.rotation * (1 + index * 0.1);
        ring.noise += 0.01;
        
        // 안정성 계산 (내부 링일수록 더 안정적)
        const stabilityFactor = configSmall.stabilityStart - 
          (configSmall.stabilityStart - configSmall.stabilityEnd) * (index / (configSmall.circles - 1));
        
        // 노이즈 기반 흔들림
        const noiseX = noise(ring.noise, 0, time * 0.01) * configSmall.impact * ring.radius * (1 - stabilityFactor);
        const noiseY = noise(0, ring.noise, time * 0.01) * configSmall.impact * ring.radius * (1 - stabilityFactor);
        
        // 투명도 계산 (외부 링일수록 더 투명)
        const alpha = configSmall.opacity * (1 - index * 0.1);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, ring.buffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        
        // 변환 설정
        gl.uniform2f(translationUniformLocation, centerX + noiseX, centerY + noiseY);
        gl.uniform1f(scaleUniformLocation, 1.0);
        
        // 회전에 따른 색상 변화 (white gradient)
        const colorPhase = Math.sin(ring.rotation + index) * 0.5 + 0.5;
        const r = 0.9 + colorPhase * 0.1; // 하얀색 계열
        const g = 0.9 + colorPhase * 0.1; // 하얀색 계열
        const b = 0.9 + colorPhase * 0.1; // 하얀색 계열
        
        gl.uniform4f(colorUniformLocation, r, g, b, alpha);
        
        gl.drawArrays(gl.POINTS, 0, ring.pointCount);
      });
      
      ringsMedium.forEach((ring, index) => {
        if (index >= configMedium.visible) return;
        
        // 각 링의 회전 및 노이즈 업데이트
        ring.rotation += configMedium.rotation * (1 + index * 0.1);
        ring.noise += 0.01;
        
        // 안정성 계산 (내부 링일수록 더 안정적)
        const stabilityFactor = configMedium.stabilityStart - 
          (configMedium.stabilityStart - configMedium.stabilityEnd) * (index / (configMedium.circles - 1));
        
        // 노이즈 기반 흔들림
        const noiseX = noise(ring.noise, 0, time * 0.01) * configMedium.impact * ring.radius * (1 - stabilityFactor);
        const noiseY = noise(0, ring.noise, time * 0.01) * configMedium.impact * ring.radius * (1 - stabilityFactor);
        
        // 투명도 계산 (외부 링일수록 더 투명)
        const alpha = configMedium.opacity * (1 - index * 0.1);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, ring.buffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        
        // 변환 설정
        gl.uniform2f(translationUniformLocation, centerX + noiseX, centerY + noiseY);
        gl.uniform1f(scaleUniformLocation, 1.0);
        
        // 회전에 따른 색상 변화 (white gradient)
        const colorPhase = Math.sin(ring.rotation + index) * 0.5 + 0.5;
        const r = 0.9 + colorPhase * 0.1; // 하얀색 계열
        const g = 0.9 + colorPhase * 0.1; // 하얀색 계열
        const b = 0.9 + colorPhase * 0.1; // 하얀색 계열
        
        gl.uniform4f(colorUniformLocation, r, g, b, alpha);
        
        gl.drawArrays(gl.POINTS, 0, ring.pointCount);
      });
      
      ringsLarge.forEach((ring, index) => {
        if (index >= configLarge.visible) return;
        
        // 각 링의 회전 및 노이즈 업데이트
        ring.rotation += configLarge.rotation * (1 + index * 0.1);
        ring.noise += 0.01;
        
        // 안정성 계산 (내부 링일수록 더 안정적)
        const stabilityFactor = configLarge.stabilityStart - 
          (configLarge.stabilityStart - configLarge.stabilityEnd) * (index / (configLarge.circles - 1));
        
        // 노이즈 기반 흔들림
        const noiseX = noise(ring.noise, 0, time * 0.01) * configLarge.impact * ring.radius * (1 - stabilityFactor);
        const noiseY = noise(0, ring.noise, time * 0.01) * configLarge.impact * ring.radius * (1 - stabilityFactor);
        
        // 투명도 계산 (외부 링일수록 더 투명)
        const alpha = configLarge.opacity * (1 - index * 0.1);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, ring.buffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        
        // 변환 설정
        gl.uniform2f(translationUniformLocation, centerX + noiseX, centerY + noiseY);
        gl.uniform1f(scaleUniformLocation, 1.0);
        
        // 회전에 따른 색상 변화 (white gradient)
        const colorPhase = Math.sin(ring.rotation + index) * 0.5 + 0.5;
        const r = 0.9 + colorPhase * 0.1; // 하얀색 계열
        const g = 0.9 + colorPhase * 0.1; // 하얀색 계열
        const b = 0.9 + colorPhase * 0.1; // 하얀색 계열
        
        gl.uniform4f(colorUniformLocation, r, g, b, alpha);
        
        gl.drawArrays(gl.POINTS, 0, ring.pointCount);
      });
      
      animationIdRef.current = requestAnimationFrame(render);
    };

    // 애니메이션 시작
    render();

    // 클린업
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
        background: 'transparent'
      }}
    />
  );
};

export default CircularPoints; 