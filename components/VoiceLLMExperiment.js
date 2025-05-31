import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const VoiceLLMExperiment = ({ isActive, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [conversationLog, setConversationLog] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.8,
    pitch: 0.3,
    volume: 1.0,
    voiceIndex: 0
  });
  const [availableVoices, setAvailableVoices] = useState([]);

  const recognitionRef = useRef(null);
  const genAI = useRef(null);
  const utteranceRef = useRef(null);

  // Google Gemini AI 초기화
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      genAI.current = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    }
  }, []);

  // 음성 목록 로드
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      // 한국어 음성 우선, 그 다음 영어 음성, 마지막으로 기타 음성
      const sortedVoices = voices.sort((a, b) => {
        if (a.lang.includes('ko') && !b.lang.includes('ko')) return -1;
        if (!a.lang.includes('ko') && b.lang.includes('ko')) return 1;
        if (a.lang.includes('en') && !b.lang.includes('en')) return -1;
        if (!a.lang.includes('en') && b.lang.includes('en')) return 1;
        return 0;
      });
      setAvailableVoices(sortedVoices);
      
      // 기본적으로 낮은 pitch의 남성 음성 찾기
      const maleVoice = sortedVoices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('masculine')
      );
      
      if (maleVoice) {
        const maleIndex = sortedVoices.indexOf(maleVoice);
        setVoiceSettings(prev => ({ ...prev, voiceIndex: maleIndex, pitch: 0.1 }));
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Web Speech Recognition 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('음성 인식 시작');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscriptTemp = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptTemp += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript);
        if (finalTranscriptTemp) {
          setFinalTranscript(prev => prev + finalTranscriptTemp);
        }
      };

      recognition.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('음성 인식 종료');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // 음성 인식 시작/중지
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setFinalTranscript('');
      recognitionRef.current.start();
    }
  }, [isListening]);

  // LLM 응답 생성
  const generateLLMResponse = useCallback(async (userInput) => {
    if (!genAI.current || !userInput.trim()) return;

    setIsProcessing(true);
    
    try {
      const model = genAI.current.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // 대화 히스토리를 포함한 프롬프트 생성
      const conversationHistory = conversationLog
        .map(log => `${log.speaker}: ${log.message}`)
        .join('\n');
      
      const prompt = `당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 음성으로 대화하고 있으므로 자연스럽고 간결하게 답변해주세요. 답변은 3문장을 넘지 않도록 해주세요.

${conversationHistory ? `이전 대화:\n${conversationHistory}\n\n` : ''}

사용자: ${userInput}

AI:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      setAiResponse(responseText);
      
      // 대화 로그에 추가
      setConversationLog(prev => [
        ...prev,
        { speaker: '사용자', message: userInput, timestamp: new Date() },
        { speaker: 'AI', message: responseText, timestamp: new Date() }
      ]);
      
      // 음성으로 응답
      speakResponse(responseText);
      
    } catch (error) {
      console.error('LLM 응답 생성 오류:', error);
      const errorMessage = '죄송합니다. 응답 생성 중 오류가 발생했습니다.';
      setAiResponse(errorMessage);
      speakResponse(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [conversationLog, voiceSettings, availableVoices]);

  // 음성 합성
  const speakResponse = useCallback((text) => {
    if (!text || isSpeaking) return;

    // 이전 음성 중지
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 음성 설정 적용
    if (availableVoices[voiceSettings.voiceIndex]) {
      utterance.voice = availableVoices[voiceSettings.voiceIndex];
    }
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('음성 합성 시작');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('음성 합성 완료');
    };

    utterance.onerror = (event) => {
      console.error('음성 합성 오류:', event);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSpeaking, voiceSettings, availableVoices]);

  // 음성 인식 완료 시 LLM 호출
  useEffect(() => {
    if (finalTranscript && !isProcessing) {
      generateLLMResponse(finalTranscript);
      setFinalTranscript('');
    }
  }, [finalTranscript, isProcessing, generateLLMResponse]);

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      speechSynthesis.cancel();
    };
  }, []);

  // 대화 초기화
  const clearConversation = () => {
    setConversationLog([]);
    setTranscript('');
    setFinalTranscript('');
    setAiResponse('');
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // 음성 중지
  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!isActive) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🎤 음성 LLM 실험실</h1>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          닫기
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 메인 대화 영역 */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          
          {/* 상태 표시 */}
          <div style={{
            padding: '15px',
            backgroundColor: isListening ? 'rgba(0, 255, 0, 0.1)' : 
                            isSpeaking ? 'rgba(0, 123, 255, 0.1)' : 
                            isProcessing ? 'rgba(255, 165, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            border: `2px solid ${isListening ? '#00ff00' : 
                                 isSpeaking ? '#007bff' : 
                                 isProcessing ? '#ffa500' : 'rgba(255, 255, 255, 0.3)'}`
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>
              {isListening ? '🎤 듣고 있습니다...' :
               isSpeaking ? '🔊 AI가 말하고 있습니다...' :
               isProcessing ? '🤔 생각 중...' : '⏸️ 대기 중'}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              {isListening ? '마이크 버튼을 다시 누르면 중지됩니다' :
               isSpeaking ? 'Stop 버튼으로 음성을 중지할 수 있습니다' :
               isProcessing ? 'AI가 응답을 생성하고 있습니다' : '마이크 버튼을 눌러 대화를 시작하세요'}
            </div>
          </div>

          {/* 실시간 음성 인식 텍스트 */}
          {(transcript || finalTranscript) && (
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid rgba(0, 255, 0, 0.3)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>실시간 음성 인식:</div>
              <div>{finalTranscript}<span style={{ opacity: 0.6 }}>{transcript}</span></div>
            </div>
          )}

          {/* AI 응답 */}
          {aiResponse && (
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid rgba(0, 123, 255, 0.3)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>AI 응답:</div>
              <div>{aiResponse}</div>
            </div>
          )}

          {/* 컨트롤 버튼들 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={toggleListening}
              disabled={isSpeaking || isProcessing}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isListening ? '#dc3545' : '#28a745',
                color: 'white',
                cursor: (isSpeaking || isProcessing) ? 'not-allowed' : 'pointer',
                opacity: (isSpeaking || isProcessing) ? 0.5 : 1
              }}
            >
              {isListening ? '🛑 음성 인식 중지' : '🎤 음성 인식 시작'}
            </button>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ffc107',
                  color: 'black',
                  cursor: 'pointer'
                }}
              >
                ⏹️ 음성 중지
              </button>
            )}

            <button
              onClick={clearConversation}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#6c757d',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🗑️ 대화 초기화
            </button>
          </div>

          {/* 대화 히스토리 */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            padding: '15px'
          }}>
            <h3 style={{ marginTop: 0 }}>대화 히스토리</h3>
            {conversationLog.length === 0 ? (
              <div style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>
                아직 대화가 시작되지 않았습니다.
              </div>
            ) : (
              conversationLog.map((log, index) => (
                <div key={index} style={{
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: log.speaker === '사용자' ? 
                    'rgba(0, 255, 0, 0.1)' : 'rgba(0, 123, 255, 0.1)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${log.speaker === '사용자' ? '#00ff00' : '#007bff'}`
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {log.speaker} • {log.timestamp.toLocaleTimeString()}
                  </div>
                  <div>{log.message}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 설정 패널 */}
        <div style={{
          flex: 1,
          borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h3>음성 설정</h3>
          
          {/* 음성 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>음성 선택:</label>
            <select
              value={voiceSettings.voiceIndex}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, voiceIndex: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {availableVoices.map((voice, index) => (
                <option key={index} value={index} style={{ backgroundColor: '#333' }}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* 속도 조절 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              속도: {voiceSettings.rate.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={voiceSettings.rate}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          {/* 음높이 조절 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              음높이: {voiceSettings.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          {/* 볼륨 조절 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              볼륨: {voiceSettings.volume.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          {/* 테스트 버튼 */}
          <button
            onClick={() => speakResponse('안녕하세요. 음성 테스트입니다.')}
            disabled={isSpeaking}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#17a2b8',
              color: 'white',
              cursor: isSpeaking ? 'not-allowed' : 'pointer',
              opacity: isSpeaking ? 0.5 : 1
            }}
          >
            🔊 음성 테스트
          </button>

          {/* 사용법 안내 */}
          <div style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <h4 style={{ marginTop: 0 }}>사용법:</h4>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>마이크 버튼을 눌러 음성 인식을 시작하세요</li>
              <li>말하고 싶은 내용을 자연스럽게 말하세요</li>
              <li>다시 마이크 버튼을 눌러 인식을 중지하세요</li>
              <li>AI가 응답을 생성하고 음성으로 들려줍니다</li>
              <li>설정에서 음성을 조정할 수 있습니다</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceLLMExperiment; 