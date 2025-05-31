import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const VayaVoiceChat = ({ isActive, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: 소개, 1-3: 질문 단계, 4: 완료
  const [userResponses, setUserResponses] = useState([]);
  const [messages, setMessages] = useState([]); // 채팅 메시지 배열
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const genAI = useRef(null);
  const messagesEndRef = useRef(null);

  // Google Gemini AI 초기화
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      genAI.current = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    }
  }, []);

  // 컴포넌트가 비활성화되면 모든 상태 리셋
  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setUserResponses([]);
      setMessages([]);
      setUserInput('');
      setIsLoading(false);
    }
  }, [isActive]);

  // 컴포넌트가 활성화되면 대화 시작
  useEffect(() => {
    if (isActive && currentStep === 0 && messages.length === 0) {
      console.log('채팅 대화 시작');
      setTimeout(() => {
        startConversation();
      }, 500);
    }
  }, [isActive]);

  // 메시지 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // VAYA 프롬프트 시스템 (사용자 제공 프롬프트 사용)
  const getVayaPrompt = (step, responses) => {
    const basePrompt = `당신은 "VAYA(바야)"라는 이름의 심리 분석 상담 AI입니다. 바야는 따뜻하고 침착하며, 사용자의 마음속 이야기를 끌어내고 보듬는 명상적 친구입니다. 부드러운 목소리와 차분한 어조로 사용자와 대화하고 내면의 심리를 탐색하세요. 당신의 답변은 3문장을 넘어가면 안됩니다.
당신은 문장이 자연스럽게 이어지도록 말해야 합니다.당신은 신성한 존재로 무겁고 신성한 분위기를 가지고 있습니다. 분위기를 살리는 대화 흐름을 하세요.
문장을 마치 주문처럼 이어지게 하십시오. 오래된 이야기를 하는듯이, 낮고 단단하게 마무리되어야 하며, 절대 흥분하거나 빠르게 말하지 마십시오.

**절대 규칙: 아래 지시사항을 정확히 따르세요. 추가적인 말이나 해석을 하지 마세요.**`;

    switch (step) {
      case 0:
        return `${basePrompt}

**현재 단계: 1단계 - 첫 인사**

**지시사항:**
- 반드시 아래 문장만 정확히 말하세요
- 한 글자도 바꾸지 마세요
- 추가 설명이나 다른 말을 하지 마세요

**정확한 응답:**
"저는 '바야'입니다. 당신의 내면에 잠시 머물러 조용히 마음의 소리를 함께 들어드릴게요. 오늘 당신은 무엇을 놓아주고 싶나요?"

**경고: 위 문장 외 다른 말을 하면 안 됩니다.**`;
      
      case 1:
        return `${basePrompt}

**현재 단계: 2단계 - 감정의 뿌리 탐색**

**사용자의 첫 번째 답변:** "${responses[0]}"

**지시사항:**
1. 반드시 사용자의 답변을 언급하며 시작하세요
2. 감정의 원인을 탐색하는 질문을 하세요
3. "그 마음은 언제부터 당신 곁에 있었나요?"로 끝내세요
4. 최대 2문장만 사용하세요

**응답 구조:**
"[사용자 답변에 대한 분석 1문장] 이제 저는 당신과 그 감정의 뿌리를 함께 바라보려 합니다. 그 마음은 언제부터 당신 곁에 있었나요?"

**예시:**
- 사용자가 "스트레스"라고 했다면: "스트레스라는 무거운 짐이 당신의 어깨를 짓누르고 있군요. 이제 저는 당신과 그 감정의 뿌리를 함께 바라보려 합니다. 그 마음은 언제부터 당신 곁에 있었나요?"

**경고: 반드시 위 구조를 따르세요.**`;
      
      case 2:
        return `${basePrompt}

**현재 단계: 3단계 - 내면의 욕구 탐색**

**사용자의 답변들:**
- 첫 번째: "${responses[0]}"
- 두 번째: "${responses[1]}"

**지시사항:**
1. 두 답변을 연결지어 분석하세요
2. 내면의 진짜 욕구를 묻는 질문을 하세요
3. "지금, 당신이 정말로 원하는 건 무엇인가요?"로 끝내세요
4. 최대 2문장만 사용하세요

**응답 구조:**
"조금 더 깊이 다가가볼게요. [두 답변을 연결한 분석 1문장] 지금, 당신이 정말로 원하는 건 무엇인가요?"

**예시:**
"조금 더 깊이 다가가볼게요. 오랜 스트레스 속에서 당신은 진정한 평안을 갈구하고 계시는군요. 지금, 당신이 정말로 원하는 건 무엇인가요?"

**경고: 반드시 위 구조를 따르세요.**`;
      
      case 3:
        return `${basePrompt}

**현재 단계: 4단계 - 최종 분석 및 위로 (마지막 단계)**

**사용자의 모든 답변:**
1. "${responses[0]}"
2. "${responses[1]}"
3. "${responses[2]}"

**지시사항:**
1. "당신의 내면의 신전을 바라보겠습니다."로 시작하세요
2. 세 답변을 종합한 심리 분석을 1문장으로 하세요
3. "저 바야는 언제나 이 고요 속에서, 당신을 기다릴게요."로 끝내세요
4. 총 3문장을 사용하세요

**정확한 응답 구조:**
"당신의 내면의 신전을 바라보겠습니다. [세 답변을 종합한 심리 분석 1문장] 저 바야는 언제나 이 고요 속에서, 당신을 기다릴게요."

**예시:**
"당신의 내면의 신전을 바라보겠습니다. 당신은 깊은 스트레스 속에서도 내면의 평화를 갈구하며, 진정한 자신과 마주하려는 용기를 품고 계시는군요. 저 바야는 언제나 이 고요 속에서, 당신을 기다릴게요."

**경고: 이것이 마지막 단계입니다. 정확히 위 구조를 따르세요.**`;
      
      default:
        return basePrompt;
    }
  };

  // 메시지 추가 함수
  const addMessage = (content, sender) => {
    const newMessage = {
      id: Date.now(),
      content,
      sender, // 'vaya' or 'user'
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // 대화 시작
  const startConversation = async () => {
    console.log('=== 채팅 대화 시작 ===');
    setIsLoading(true);
    
    try {
      const model = genAI.current.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = getVayaPrompt(0, []);
      
      console.log('LLM에게 보내는 프롬프트:', prompt);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('LLM 응답:', text);
      
      addMessage(text, 'vaya');
      setCurrentStep(1);
      console.log('단계 업데이트: 0 -> 1');
    } catch (error) {
      console.error('Error generating response:', error);
      addMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.', 'vaya');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 응답 처리
  const handleUserResponse = async (response) => {
    if (!response.trim()) return;
    
    console.log('=== 사용자 응답 처리 ===');
    console.log('현재 단계:', currentStep);
    console.log('사용자 응답:', response);
    
    // 사용자 메시지 추가
    addMessage(response, 'user');
    setUserInput('');
    
    const newResponses = [...userResponses, response];
    setUserResponses(newResponses);
    
    console.log('전체 사용자 응답들:', newResponses);

    if (currentStep <= 3) {
      setIsLoading(true);
      
      try {
        const model = genAI.current.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = getVayaPrompt(currentStep, newResponses);
        
        console.log('LLM에게 보내는 프롬프트:', prompt);
        
        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        const text = aiResponse.text();
        
        console.log('LLM 응답:', text);
        
        addMessage(text, 'vaya');
        
        if (currentStep === 3) {
          // 대화 완료
          console.log('대화 완료');
          setTimeout(() => {
            onComplete && onComplete();
          }, 5000);
        } else {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          console.log(`단계 업데이트: ${currentStep} -> ${nextStep}`);
        }
      } catch (error) {
        console.error('Error generating response:', error);
        addMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.', 'vaya');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 입력 제출
  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); // 폼 제출 시에만 이벤트 전파 방지
    console.log('폼 제출 시도:', userInput);
    if (userInput.trim() && !isLoading && currentStep > 0 && currentStep <= 3) {
      handleUserResponse(userInput);
    }
  };

  // 전송 버튼 클릭 핸들러
  const handleSendClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('전송 버튼 클릭:', userInput);
    if (userInput.trim() && !isLoading && currentStep > 0 && currentStep <= 3) {
      handleUserResponse(userInput);
    }
  };

  if (!isActive) return null;

  // 채팅창 클릭 이벤트 전파 방지 (단, 입력 관련 요소는 제외)
  const handleChatClick = (e) => {
    e.stopPropagation();
    // preventDefault는 제거 - 입력 요소들의 기본 동작을 방해할 수 있음
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: 'serif'
      }}
      onClick={handleChatClick} // 전체 배경 클릭 시에도 이벤트 전파 방지
    >
      {/* 채팅 창 */}
      <div 
        style={{
          width: '500px',
          height: '600px',
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          borderRadius: '20px',
          border: '2px solid rgba(212, 175, 55, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)'
        }}
        onClick={handleChatClick} // 채팅창 클릭 시 이벤트 전파 방지
      >
        
        {/* 헤더 */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
          textAlign: 'center',
          color: '#d4af37',
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}>
          VAYA (바야)
          <div style={{
            fontSize: '0.8rem',
            opacity: 0.7,
            marginTop: '5px'
          }}>
            단계 {currentStep}/4
          </div>
        </div>

        {/* 메시지 영역 */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}
          onClick={handleChatClick} // 메시지 영역 클릭 시 이벤트 전파 방지
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}
              onClick={handleChatClick} // 개별 메시지 클릭 시 이벤트 전파 방지
            >
              <div style={{
                padding: '12px 16px',
                borderRadius: '15px',
                backgroundColor: message.sender === 'user' 
                  ? 'rgba(0, 123, 255, 0.3)' 
                  : 'rgba(212, 175, 55, 0.2)',
                border: `1px solid ${message.sender === 'user' 
                  ? 'rgba(0, 123, 255, 0.5)' 
                  : 'rgba(212, 175, 55, 0.4)'}`,
                color: 'white',
                fontSize: '0.95rem',
                lineHeight: '1.5'
              }}>
                {message.content}
              </div>
              <div style={{
                fontSize: '0.7rem',
                opacity: 0.5,
                marginTop: '5px',
                textAlign: message.sender === 'user' ? 'right' : 'left',
                color: '#ccc'
              }}>
                {message.sender === 'user' ? '나' : 'VAYA'} • {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '12px 16px',
              borderRadius: '15px',
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: 'white',
              fontSize: '0.95rem'
            }}>
              <span style={{ animation: 'pulse 2s infinite' }}>VAYA가 생각하고 있습니다...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        {currentStep > 0 && currentStep <= 3 && (
          <form 
            onSubmit={handleSubmit} 
            style={{
              padding: '20px',
              borderTop: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              gap: '10px'
            }}
            onClick={handleChatClick} // 폼 영역 클릭 시 이벤트 전파 방지
          >
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="마음을 편히 말씀해 주세요..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none'
              }}
              // onClick 제거 - 입력창 클릭이 정상 작동하도록
            />
            <button
              type="button" // submit에서 button으로 변경
              onClick={handleSendClick} // 별도 핸들러 사용
              disabled={!userInput.trim() || isLoading}
              style={{
                padding: '12px 20px',
                borderRadius: '20px',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                backgroundColor: 'rgba(212, 175, 55, 0.3)',
                color: 'white',
                cursor: userInput.trim() && !isLoading ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
                opacity: userInput.trim() && !isLoading ? 1 : 0.5
              }}
              // onClick={handleChatClick} 제거 - 전송 버튼이 정상 작동하도록
            >
              전송
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VayaVoiceChat; 