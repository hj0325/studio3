import React, { useState, useEffect, useRef } from 'react';

const StoneTextOverlay = ({ 
  message, 
  isVisible, 
  onTypingComplete,
  isLoading 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0); // 페이드인 효과를 위한 상태
  const typingIntervalRef = useRef(null);

  // 메시지가 바뀔 때마다 타이핑 애니메이션 시작
  useEffect(() => {
    if (message && isVisible) {
      setDisplayedText('');
      setIsTyping(true);
      setFadeOpacity(0); // 페이드인 시작
      
      let currentIndex = 0;
      const typingSpeed = 80; // 밀리초당 글자
      
      // 페이드인 효과 시작
      setTimeout(() => {
        setFadeOpacity(1);
      }, 100);
      
      typingIntervalRef.current = setInterval(() => {
        if (currentIndex < message.length) {
          setDisplayedText(message.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          // 타이핑 완료
          clearInterval(typingIntervalRef.current);
          setIsTyping(false);
          onTypingComplete && onTypingComplete();
        }
      }, typingSpeed);
    } else if (!isVisible && displayedText) {
      // 메시지가 보이지 않을 때 페이드아웃
      setFadeOpacity(0);
      // 페이드아웃 완료 후 텍스트 초기화
      setTimeout(() => {
        setDisplayedText('');
        setIsTyping(false);
      }, 1500); // transition 시간과 동일
      
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    } else if (!message) {
      // 메시지가 없을 때
      setDisplayedText('');
      setIsTyping(false);
      setFadeOpacity(0);
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [message, isVisible]);

  // 마침표 뒤 줄바꿈 처리 함수
  const formatTextWithLineBreaks = (text) => {
    if (!text) return '';
    
    // 마침표 뒤에 공백이 있고 다음 문자가 있으면 줄바꿈 추가
    return text.replace(/\.\s+/g, '.\n');
  };

  if (!isVisible && !isLoading && !displayedText) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%', // 49.5%에서 50%로 정확히 중앙 정렬
        top: '50%',
        width: '300px',
        height: '400px',
        transform: 'translate(-50%, -50%)',
        zIndex: 10, // 비석 위에 표시
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 30px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {isLoading ? (
          // 로딩 상태
          <div
            style={{
              color: 'rgba(0, 0, 0, 0.6)',
              fontSize: '16px', // 18px에서 16px로 감소
              fontFamily: '"Nanum Myeongjo", serif', // Nanum Myeongjo 폰트 적용
              fontWeight: '800', // 800 (Extra Bold) 적용
              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
              lineHeight: '1.6',
              animation: 'pulse 2s infinite'
            }}
          >
            바야가 생각하고 있습니다...
          </div>
        ) : (
          // 메시지 표시
          <div
            style={{
              color: 'rgba(0, 0, 0, 0.9)', // 검은색 텍스트
              fontSize: '18px', // 20px에서 18px로 감소
              fontFamily: '"Nanum Myeongjo", serif', // Nanum Myeongjo 폰트 적용
              fontWeight: '800', // 800 (Extra Bold) 적용
              textShadow: '1px 1px 3px rgba(255, 255, 255, 0.4)', // 비석에 새긴 느낌
              lineHeight: '1.7',
              letterSpacing: '0.5px',
              wordBreak: 'keep-all',
              maxWidth: '100%',
              position: 'relative',
              opacity: fadeOpacity, // 페이드인 효과 적용
              transition: 'opacity 1.5s ease-in-out', // 부드러운 페이드인 전환
              whiteSpace: 'pre-line' // 줄바꿈 문자(\n)를 실제 줄바꿈으로 처리
            }}
          >
            {formatTextWithLineBreaks(displayedText)}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StoneTextOverlay; 