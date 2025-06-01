import React, { useEffect, useRef } from 'react';

const SmokeCanvas = () => {
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

    console.log('WebGL initialized successfully');

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 원본 WebGL-Fluid-Simulation과 유사한 설정
    const config = {
      TEXTURE_DOWNSAMPLE: 1,
      DENSITY_DISSIPATION: 0.98, // 원본과 유사하게
      VELOCITY_DISSIPATION: 0.98, // 원본과 유사하게
      PRESSURE_ITERATIONS: 20, // 원본과 동일하게
      SPLAT_RADIUS: 0.25, // 원본과 동일한 크기
      SPLAT_FORCE: 6000 // 적절한 force
    };

    // Vertex Shader (공통)
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shaders
    const advectionShader = `
      precision mediump float;
      uniform sampler2D u_velocity;
      uniform sampler2D u_source;
      uniform vec2 u_texelSize;
      uniform float u_dt;
      uniform float u_dissipation;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 coord = v_texCoord - u_dt * texture2D(u_velocity, v_texCoord).xy * u_texelSize;
        gl_FragColor = u_dissipation * texture2D(u_source, coord);
      }
    `;

    const divergenceShader = `
      precision mediump float;
      uniform sampler2D u_velocity;
      uniform vec2 u_texelSize;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = u_texelSize;
        float L = texture2D(u_velocity, v_texCoord - vec2(texelSize.x, 0.0)).x;
        float R = texture2D(u_velocity, v_texCoord + vec2(texelSize.x, 0.0)).x;
        float T = texture2D(u_velocity, v_texCoord + vec2(0.0, texelSize.y)).y;
        float B = texture2D(u_velocity, v_texCoord - vec2(0.0, texelSize.y)).y;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;

    const pressureShader = `
      precision mediump float;
      uniform sampler2D u_pressure;
      uniform sampler2D u_divergence;
      uniform vec2 u_texelSize;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = u_texelSize;
        float L = texture2D(u_pressure, v_texCoord - vec2(texelSize.x, 0.0)).x;
        float R = texture2D(u_pressure, v_texCoord + vec2(texelSize.x, 0.0)).x;
        float T = texture2D(u_pressure, v_texCoord + vec2(0.0, texelSize.y)).x;
        float B = texture2D(u_pressure, v_texCoord - vec2(0.0, texelSize.y)).x;
        float divergence = texture2D(u_divergence, v_texCoord).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `;

    const gradientSubtractShader = `
      precision mediump float;
      uniform sampler2D u_pressure;
      uniform sampler2D u_velocity;
      uniform vec2 u_texelSize;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 texelSize = u_texelSize;
        float L = texture2D(u_pressure, v_texCoord - vec2(texelSize.x, 0.0)).x;
        float R = texture2D(u_pressure, v_texCoord + vec2(texelSize.x, 0.0)).x;
        float T = texture2D(u_pressure, v_texCoord + vec2(0.0, texelSize.y)).x;
        float B = texture2D(u_pressure, v_texCoord - vec2(0.0, texelSize.y)).x;
        vec2 velocity = texture2D(u_velocity, v_texCoord).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;

    const splatShader = `
      precision mediump float;
      uniform sampler2D u_target;
      uniform float u_aspectRatio;
      uniform vec3 u_color;
      uniform vec2 u_point;
      uniform float u_radius;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 p = v_texCoord - u_point;
        p.x *= u_aspectRatio;
        vec3 splat = exp(-dot(p, p) / u_radius) * u_color;
        vec3 base = texture2D(u_target, v_texCoord).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `;

    // 원본과 동일한 디스플레이 shader
    const displayShader = `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 v_texCoord;
      
      void main() {
        vec3 color = texture2D(u_texture, v_texCoord).rgb;
        float alpha = max(color.r, max(color.g, color.b));
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // Shader 컴파일 함수
    const compileShader = (type, source) => {
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
      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
      
      if (!vertexShader || !fragmentShader) return null;
      
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }

      // 유니폼 위치 가져오기
      const uniforms = {};
      const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = gl.getActiveUniform(program, i);
        uniforms[uniformInfo.name] = gl.getUniformLocation(program, uniformInfo.name);
      }

      return { program, uniforms };
    };

    // 프로그램들 생성
    const programs = {
      advection: createProgram(vertexShaderSource, advectionShader),
      divergence: createProgram(vertexShaderSource, divergenceShader),
      pressure: createProgram(vertexShaderSource, pressureShader),
      gradientSubtract: createProgram(vertexShaderSource, gradientSubtractShader),
      splat: createProgram(vertexShaderSource, splatShader),
      display: createProgram(vertexShaderSource, displayShader)
    };

    // 프로그램 생성 확인
    let allProgramsValid = true;
    Object.keys(programs).forEach(key => {
      if (!programs[key]) {
        console.error(`Failed to create program: ${key}`);
        allProgramsValid = false;
}
    });

    if (!allProgramsValid) return;

    console.log('All programs created successfully');

    // 기본 버퍼 설정
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]), gl.STATIC_DRAW);

    // 텍스처 생성 함수
    const createTexture = (width, height) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    };

    // FBO 생성
    const createFBO = (width, height) => {
      const texture = createTexture(width, height);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Framebuffer not complete:', status);
      }
      
      return { fbo, texture, width, height };
    };

    // 더블 FBO
    const createDoubleFBO = (width, height) => {
      let fbo1 = createFBO(width, height);
      let fbo2 = createFBO(width, height);
      
      return {
        get read() { return fbo1; },
        get write() { return fbo2; },
        swap() { const temp = fbo1; fbo1 = fbo2; fbo2 = temp; }
      };
    };

    // FBO들 초기화
    const simRes = 128; // 원본과 동일한 해상도
    const dyeRes = 512;  // 원본과 동일한 해상도

    console.log('Creating FBOs with resolution:', simRes, dyeRes);

    const dye = createDoubleFBO(dyeRes, dyeRes);
    const velocity = createDoubleFBO(simRes, simRes);
    const divergence = createFBO(simRes, simRes);
    const pressure = createDoubleFBO(simRes, simRes);

    // 렌더링 함수
    const blit = (target) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    // 하얀색 연기 색상
    const generateSmokeColor = () => {
      return {
        r: 0.2, // 약간 높여서 더 잘 보이게
        g: 0.2,
        b: 0.2
      };
    };

    // Splat 함수 - 원본과 동일한 방식
    const splat = (x, y, dx, dy, color) => {
      // Velocity splat
      gl.viewport(0, 0, velocity.read.width, velocity.read.height);
      gl.useProgram(programs.splat.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(programs.splat.uniforms.u_target, 0);
      gl.uniform1f(programs.splat.uniforms.u_aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(programs.splat.uniforms.u_point, x / canvas.width, 1.0 - y / canvas.height);
      gl.uniform3f(programs.splat.uniforms.u_color, dx, -dy, 0.0);
      gl.uniform1f(programs.splat.uniforms.u_radius, config.SPLAT_RADIUS / 100.0);
      blit(velocity.write.fbo);
      velocity.swap();

      // Dye splat
      gl.viewport(0, 0, dye.read.width, dye.read.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
      gl.uniform1i(programs.splat.uniforms.u_target, 0);
      gl.uniform3f(programs.splat.uniforms.u_color, color.r, color.g, color.b);
      gl.uniform1f(programs.splat.uniforms.u_radius, config.SPLAT_RADIUS / 100.0);
      blit(dye.write.fbo);
      dye.swap();
    };

    // 중앙 고정 splat - 웹페이지 정중앙에서 연기 생성
    const addCenterSplat = () => {
      // 웹페이지 정중앙 고정 (0.5, 0.5)
      const centerX = 0.5;
      const centerY = 0.5;
      
      const x = centerX * canvas.width;
      const y = centerY * canvas.height;
      
      // 원본처럼 다양한 방향으로 퍼지는 연기
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      
      const color = generateSmokeColor();
      splat(x, y, dx, dy, color);
    };

    // 시뮬레이션 스텝 - 원본과 동일한 순서
    const step = (dt) => {
      // Velocity advection
      gl.viewport(0, 0, velocity.read.width, velocity.read.height);
      gl.useProgram(programs.advection.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(programs.advection.uniforms.u_velocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(programs.advection.uniforms.u_source, 1);
      gl.uniform2f(programs.advection.uniforms.u_texelSize, 1.0 / velocity.read.width, 1.0 / velocity.read.height);
      gl.uniform1f(programs.advection.uniforms.u_dt, dt);
      gl.uniform1f(programs.advection.uniforms.u_dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write.fbo);
      velocity.swap();

      // Dye advection
      gl.viewport(0, 0, dye.read.width, dye.read.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(programs.advection.uniforms.u_velocity, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
      gl.uniform1i(programs.advection.uniforms.u_source, 1);
      gl.uniform2f(programs.advection.uniforms.u_texelSize, 1.0 / dye.read.width, 1.0 / dye.read.height);
      gl.uniform1f(programs.advection.uniforms.u_dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write.fbo);
      dye.swap();

      // Divergence
      gl.viewport(0, 0, velocity.read.width, velocity.read.height);
      gl.useProgram(programs.divergence.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(programs.divergence.uniforms.u_velocity, 0);
      gl.uniform2f(programs.divergence.uniforms.u_texelSize, 1.0 / velocity.read.width, 1.0 / velocity.read.height);
      blit(divergence.fbo);

      // Clear pressure
      gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.write.fbo);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      pressure.swap();

      // Pressure solve
      gl.useProgram(programs.pressure.program);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergence.texture);
      gl.uniform1i(programs.pressure.uniforms.u_divergence, 1);
      gl.uniform2f(programs.pressure.uniforms.u_texelSize, 1.0 / pressure.read.width, 1.0 / pressure.read.height);

      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
        gl.uniform1i(programs.pressure.uniforms.u_pressure, 0);
        blit(pressure.write.fbo);
        pressure.swap();
      }

      // Gradient subtract
      gl.useProgram(programs.gradientSubtract.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture);
      gl.uniform1i(programs.gradientSubtract.uniforms.u_pressure, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture);
      gl.uniform1i(programs.gradientSubtract.uniforms.u_velocity, 1);
      gl.uniform2f(programs.gradientSubtract.uniforms.u_texelSize, 1.0 / velocity.read.width, 1.0 / velocity.read.height);
      blit(velocity.write.fbo);
      velocity.swap();
    };

    // 렌더링
    const render = () => {
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(programs.display.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dye.read.texture);
      gl.uniform1i(programs.display.uniforms.u_texture, 0);
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      blit(null);
    };

    // 메인 루프
    let lastTime = Date.now();
    const update = () => {
      const dt = Math.min((Date.now() - lastTime) / 1000, 1.0 / 60);
      lastTime = Date.now();

      step(dt);
      render();
      animationIdRef.current = requestAnimationFrame(update);
    };

    // 중앙에서 연속적인 연기 생성
    const splatInterval = setInterval(() => {
      addCenterSplat();
    }, 60); // 더 자주 생성해서 연속적인 연기

    console.log('Starting centered smoke simulation...');
    
    // 시작
    update();

    // 클린업
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(splatInterval);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'transparent'
      }}
    />
  );
};

export default SmokeCanvas; 