import React, { useState, useRef, useEffect } from 'react';

const UserInputBar = ({ 
  isActive, 
  onSendMessage, 
  isLoading, 
  canSendMessage,
  placeholder = "마음을 편히 말씀해 주세요..." 
}) => {
  const [userInput, setUserInput] = useState('');
  const inputRef = useRef(null);

  // 컴포넌트가 활성화되고 메시지 전송이 가능할 때 자동으로 포커스
  useEffect(() => {
    if (isActive && canSendMessage && inputRef.current) {
      // 약간의 딜레이를 두어 렌더링이 완료된 후 포커스
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, canSendMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (userInput.trim() && !isLoading && canSendMessage) {
      onSendMessage(userInput.trim());
      setUserInput('');
    }
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (userInput.trim() && !isLoading && canSendMessage) {
      onSendMessage(userInput.trim());
      setUserInput('');
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* 배경 SVG */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '900px',
          backgroundImage: 'url(/채팅.svg)',
          backgroundSize: '105% auto',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center bottom',
          zIndex: 999,
          pointerEvents: 'none', // 배경은 클릭 이벤트를 받지 않음
          opacity: 0.8, // 전체 투명도
        }}
      />
      
      {/* 채팅창 */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          padding: '20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form 
          onSubmit={handleSubmit}
          style={{
            maxWidth: '600px',
            width: '100%',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            position: 'relative',
          }}
        >
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading || !canSendMessage}
          style={{
            flex: 1,
            padding: '15px 20px',
            borderRadius: '25px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '15px',
            outline: 'none',
            fontFamily: '"Nanum Myeongjo", serif',
            fontWeight: '800',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(5px)',
            '::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)'
            }
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          }}
        />
        
        <button
          type="button"
          onClick={handleSendClick}
          disabled={!userInput.trim() || isLoading || !canSendMessage}
          style={{
            padding: '15px 25px',
            borderRadius: '25px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            backgroundColor: userInput.trim() && !isLoading && canSendMessage 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(0, 0, 0, 0.5)',
            color: userInput.trim() && !isLoading && canSendMessage 
              ? 'white' 
              : 'rgba(255, 255, 255, 0.5)',
            cursor: userInput.trim() && !isLoading && canSendMessage 
              ? 'pointer' 
              : 'not-allowed',
            fontSize: '14px',
            fontFamily: '"Nanum Myeongjo", serif',
            fontWeight: '800',
            transition: 'all 0.3s ease',
            minWidth: '80px',
            backdropFilter: 'blur(5px)',
          }}
          onMouseEnter={(e) => {
            if (userInput.trim() && !isLoading && canSendMessage) {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (userInput.trim() && !isLoading && canSendMessage) {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }
          }}
        >
          {isLoading ? '...' : '전송'}
        </button>
        </form>
      </div>
      
      <style jsx>{`
        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
};

export default UserInputBar; 