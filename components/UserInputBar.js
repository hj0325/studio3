import React, { useState } from 'react';

const UserInputBar = ({ 
  isActive, 
  onSendMessage, 
  isLoading, 
  canSendMessage,
  placeholder = "마음을 편히 말씀해 주세요..." 
}) => {
  const [userInput, setUserInput] = useState('');

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
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <form 
        onSubmit={handleSubmit}
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          gap: '15px',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading || !canSendMessage}
          style={{
            flex: 1,
            padding: '15px 20px',
            borderRadius: '25px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            fontSize: '16px',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'all 0.3s ease',
            '::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)'
            }
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
        />
        
        <button
          type="button"
          onClick={handleSendClick}
          disabled={!userInput.trim() || isLoading || !canSendMessage}
          style={{
            padding: '15px 25px',
            borderRadius: '25px',
            border: 'none',
            backgroundColor: userInput.trim() && !isLoading && canSendMessage 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.05)',
            color: userInput.trim() && !isLoading && canSendMessage 
              ? 'white' 
              : 'rgba(255, 255, 255, 0.3)',
            cursor: userInput.trim() && !isLoading && canSendMessage 
              ? 'pointer' 
              : 'not-allowed',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            minWidth: '80px'
          }}
          onMouseEnter={(e) => {
            if (userInput.trim() && !isLoading && canSendMessage) {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (userInput.trim() && !isLoading && canSendMessage) {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }
          }}
        >
          {isLoading ? '...' : '전송'}
        </button>
      </form>
      
      <style jsx>{`
        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default UserInputBar; 