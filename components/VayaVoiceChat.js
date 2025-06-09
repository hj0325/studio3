import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import UserInputBar from './UserInputBar';
import StoneTextOverlay from './StoneTextOverlay';
import { speakText, stopSpeaking } from '../utils/tts';

const VayaVoiceChat = ({ isActive, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0); // 0: 소개, 1-3: 질문 단계, 4: 완료
  const [userResponses, setUserResponses] = useState([]);
  const [currentVayaMessage, setCurrentVayaMessage] = useState(''); // 현재 바야 메시지
  const [isLoading, setIsLoading] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(false); // 메시지 표시 여부
  const [canUserSend, setCanUserSend] = useState(false); // 사용자 입력 가능 여부
  const [isTypingComplete, setIsTypingComplete] = useState(false); // 타이핑 완료 여부
  const [showExitModal, setShowExitModal] = useState(false); // 신전 나가기 모달 표시 여부
  const [isConversationComplete, setIsConversationComplete] = useState(false); // 대화 완료 상태
  
  const genAI = useRef(null);
  const exitTimerRef = useRef(null); // 15초 후 모달 표시 타이머
  const autoExitTimerRef = useRef(null); // 5초 후 자동 나가기 타이머

  // Google Gemini AI 초기화
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      genAI.current = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    }
  }, []);

  // 컴포넌트가 비활성화되면 모든 상태 리셋
  useEffect(() => {
    if (!isActive) {
      // TTS 중지
      stopSpeaking();
      
      // 모든 타이머 정리
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
      if (autoExitTimerRef.current) {
        clearTimeout(autoExitTimerRef.current);
      }
      
      setCurrentStep(0);
      setUserResponses([]);
      setCurrentVayaMessage('');
      setIsLoading(false);
      setIsMessageVisible(false);
      setCanUserSend(false);
      setIsTypingComplete(false);
      setShowExitModal(false);
      setIsConversationComplete(false);
    }
  }, [isActive]);

  // 컴포넌트가 활성화되면 대화 시작
  useEffect(() => {
    if (isActive && currentStep === 0 && !currentVayaMessage) {
      console.log('채팅 대화 시작');
      setTimeout(() => {
        startConversation();
      }, 500);
    }
  }, [isActive]);

  // VAYA 프롬프트 시스템 (기존과 동일)
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
"저는 '바야'입니다. 당신에게 세가지 질문을 하며, 당신의 내면에 잠시 머물러 조용히 마음의 소리를 함께 들어드릴게요. 오늘 당신은 무엇을 놓아주고 싶나요?"

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

  // 대화 시작
  const startConversation = async () => {
    console.log('=== 채팅 대화 시작 ===');
    setIsLoading(true);
    setIsMessageVisible(true);
    
    try {
      const model = genAI.current.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = getVayaPrompt(0, []);
      
      console.log('LLM에게 보내는 프롬프트:', prompt);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('LLM 응답:', text);
      
      // 새로운 메시지 설정 전에 이전 TTS 중지 (시작 메시지도 마찬가지)
      console.log('🔇 첫 메시지 설정 전 TTS 중지');
      stopSpeaking();
      
      setCurrentVayaMessage(text);
      setCurrentStep(1);
      console.log('단계 업데이트: 0 -> 1');
    } catch (error) {
      console.error('Error generating response:', error);
      setCurrentVayaMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 타이핑 완료 핸들러
  const handleTypingComplete = () => {
    setIsTypingComplete(true);
    setCanUserSend(true);
    
    // 마지막 단계이고 대화가 완료된 경우 15초 후 모달 표시
    if (currentStep === 4 && isConversationComplete) {
      exitTimerRef.current = setTimeout(() => {
        setShowExitModal(true);
        // 모달 표시 후 5초 뒤 자동 나가기
        autoExitTimerRef.current = setTimeout(() => {
          handleExitYes();
        }, 5000);
      }, 15000);
    }
  };

  // 타이핑 시작 후 적절한 타이밍에 TTS 시작하는 핸들러
  const handleTTSStartTiming = () => {
    // 이전 TTS 먼저 중지
    console.log('🔇 이전 TTS 중지 후 새로운 TTS 시작');
    stopSpeaking();
    
    // 바야의 메시지를 음성으로 읽기 (TTS)
    if (currentVayaMessage && currentVayaMessage.trim()) {
      // 🎯 중요: 현재 메시지를 고정
      const messageToSpeak = currentVayaMessage;
      const messageId = Date.now(); // 현재 메시지의 고유 ID
      console.log('🎭 TTS 준비 (메시지 ID: ' + messageId + '):', messageToSpeak.slice(0, 50) + '...');
      
      // 타이핑이 시작된 직후 TTS 시작 (더 빠른 응답)
      setTimeout(async () => {
        // 메시지가 변경되었거나 비어있으면 취소
        if (messageToSpeak !== currentVayaMessage || !currentVayaMessage) {
          console.log('⚠️ 메시지 변경됨, TTS 취소 (ID: ' + messageId + ')');
          return;
        }

        try {
          console.log('✅ TTS 시작 (ID: ' + messageId + ')');
          await speakText(messageToSpeak);
          console.log('✅ TTS 완료 (ID: ' + messageId + ')');
        } catch (error) {
          console.error('🔥 TTS 오류 (ID: ' + messageId + '):', error);
        }
      }, 100); // 0.1초 후 시작 (더 빠른 응답)
    }
  };

  // 신전 나가기 - YES
  const handleExitYes = () => {
    // TTS 중지
    stopSpeaking();
    
    // 모든 타이머 정리
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    if (autoExitTimerRef.current) {
      clearTimeout(autoExitTimerRef.current);
    }
    
    setShowExitModal(false);
    onComplete && onComplete();
  };

  // 신전 나가기 - NO
  const handleExitNo = () => {
    // TTS 중지하지 않음 (메시지가 계속 유지되므로)
    
    // 모든 타이머 정리
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    if (autoExitTimerRef.current) {
      clearTimeout(autoExitTimerRef.current);
    }
    
    setShowExitModal(false);
    // 메시지는 계속 유지됨
  };

  // currentVayaMessage 변경 추적
  useEffect(() => {
    if (currentVayaMessage) {
      console.log('📝 바야 메시지 업데이트됨:', {
        step: currentStep,
        message: currentVayaMessage.slice(0, 50) + '...',
        timestamp: new Date().toISOString()
      });
    }
  }, [currentVayaMessage]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      // TTS 중지
      stopSpeaking();
      
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
      if (autoExitTimerRef.current) {
        clearTimeout(autoExitTimerRef.current);
      }
    };
  }, []);

  // 사용자 메시지 전송 핸들러
  const handleUserMessage = async (message) => {
    console.log('=== 사용자 응답 처리 ===');
    console.log('현재 단계:', currentStep);
    console.log('사용자 응답:', message);
    
    // 이전 TTS와 메시지를 완전히 중지/제거
    console.log('🔇 사용자 응답 시 이전 상태 초기화');
    stopSpeaking();
    setCurrentVayaMessage(''); // 이전 메시지 초기화
    
    // 상태 초기화
    setCanUserSend(false);
    setIsTypingComplete(false);
    setIsMessageVisible(false);
    
    // 중지 완료를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 사용자 응답 저장
    const newResponses = [...userResponses, message];
    setUserResponses(newResponses);
    
    console.log('전체 사용자 응답들:', newResponses);

    if (currentStep <= 3) {
      // 약간의 딜레이 후 다음 메시지 처리
      setTimeout(async () => {
        setIsLoading(true);
        setIsMessageVisible(true);
        
        try {
          const model = genAI.current.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = getVayaPrompt(currentStep, newResponses);
          
          console.log('LLM에게 보내는 프롬프트:', prompt);
          
          const result = await model.generateContent(prompt);
          const aiResponse = await result.response;
          const text = aiResponse.text();
          
          console.log('LLM 응답:', text);
          
          // 새로운 메시지 설정 전에 이전 TTS 중지
          console.log('🔇 새 메시지 설정 전 TTS 중지');
          stopSpeaking();
          
          setCurrentVayaMessage(text);
          
          if (currentStep === 3) {
            // 대화 완료 - 메시지는 계속 유지
            console.log('대화 완료');
            setIsConversationComplete(true);
            setCurrentStep(4); // 완료 단계로 변경
            // 메시지 사라지지 않고 계속 유지됨
          } else {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            console.log(`단계 업데이트: ${currentStep} -> ${nextStep}`);
          }
        } catch (error) {
          console.error('Error generating response:', error);
          setCurrentVayaMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
          setIsLoading(false);
        }
      }, 1000); // 1초 딜레이
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* 비석에 표시되는 바야 메시지 */}
      <StoneTextOverlay
        message={currentVayaMessage}
        isVisible={isMessageVisible}
        isLoading={isLoading}
        onTypingComplete={handleTypingComplete}
        onTTSStartTiming={handleTTSStartTiming}
      />
      
      {/* 하단 사용자 입력창 */}
      <UserInputBar
        isActive={isActive && currentStep > 0 && currentStep <= 3}
        onSendMessage={handleUserMessage}
        isLoading={isLoading}
        canSendMessage={canUserSend && isTypingComplete}
        placeholder={`바야에게 답변해 주세요... (${currentStep}/3)`}
      />

      {/* 신전 나가기 모달 */}
      {showExitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(20, 20, 20, 0.95)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '15px',
              padding: '40px',
              textAlign: 'center',
              maxWidth: '400px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: '18px',
                fontFamily: '"Nanum Myeongjo", serif',
                fontWeight: '800',
                marginBottom: '30px',
                lineHeight: '1.6',
              }}
            >
              신전을 나가시겠습니까?
            </div>
            
            <div
              style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={handleExitYes}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '16px',
                  fontFamily: '"Nanum Myeongjo", serif',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                YES
              </button>
              
              <button
                onClick={handleExitNo}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '16px',
                  fontFamily: '"Nanum Myeongjo", serif',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VayaVoiceChat; 