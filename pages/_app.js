import "@/styles/globals.css";
import { useEffect, useRef } from 'react';

export default function App({ Component, pageProps }) {
  const audioRef = useRef(null);

  useEffect(() => {
    // 배경음악 설정
    if (!audioRef.current) {
      audioRef.current = new Audio('/sound.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
      
      // 즉시 재생 시도
      const playAudio = () => {
        audioRef.current.play().catch(error => {
          console.log('Auto-play blocked, waiting for user interaction');
        });
      };

      // 페이지 로드 후 즉시 재생 시도
      playAudio();

      // 사용자 상호작용 시 재생 (fallback)
      const handleUserInteraction = () => {
        audioRef.current.play().catch(console.log);
        // 한 번 재생되면 이벤트 제거
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };

      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
    }

    // 커스텀 커서 요소 생성
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    // 마우스 움직임 추적
    const handleMouseMove = (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    };

    // 마우스 진입 시 커서 표시
    const handleMouseEnter = () => {
      cursor.style.display = 'block';
    };

    // 마우스 이탈 시 커서 숨기기
    const handleMouseLeave = () => {
      cursor.style.display = 'none';
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    // 클린업
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (cursor && cursor.parentNode) {
        cursor.parentNode.removeChild(cursor);
      }
    };
  }, []);

  return <Component {...pageProps} />;
}
