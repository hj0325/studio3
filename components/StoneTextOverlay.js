import React, { useState, useEffect, useRef } from 'react';

const StoneTextOverlay = ({ 
  message, 
  isVisible, 
  onTypingComplete,
  isLoading 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingIntervalRef = useRef(null);

  // 메시지가 바뀔 때마다 타이핑 애니메이션 시작
  useEffect(() => {
    if (message && isVisible) {
      setDisplayedText('');
      setIsTyping(true);
      
      let currentIndex = 0;
      const typingSpeed = 80; // 밀리초당 글자
      
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
    } else {
      // 메시지가 없거나 보이지 않을 때
      setDisplayedText('');
      setIsTyping(false);
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

  if (!isVisible && !isLoading) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '49.5%',
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
              fontSize: '18px',
              fontFamily: 'serif',
              fontWeight: 'bold',
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
              fontSize: '20px',
              fontFamily: 'serif',
              fontWeight: 'bold',
              textShadow: '1px 1px 3px rgba(255, 255, 255, 0.4)', // 비석에 새긴 느낌
              lineHeight: '1.7',
              letterSpacing: '0.5px',
              wordBreak: 'keep-all',
              maxWidth: '100%',
              position: 'relative'
            }}
          >
            {displayedText}
            {isTyping && (
              <span
                style={{
                  animation: 'blink 1s infinite',
                  marginLeft: '2px',
                  color: 'rgba(0, 0, 0, 0.7)'
                }}
              >
                |
              </span>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
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