import Head from "next/head";
// import Image from "next/image"; // 현재 직접 img 태그를 사용하므로 Next/Image는 주석 처리
import { Inter, Roboto_Mono } from "next/font/google";
// import styles from "@/styles/Home.module.css"; // 기본 스타일 시트 사용 안 함
import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Three.js 컴포넌트를 dynamic import로 클라이언트 사이드에서만 로드
const SmokeCanvas = dynamic(() => import('../components/SmokeCanvas'), {
  ssr: false,
  loading: () => null
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const imageStyles = {
  position: 'absolute',
  objectFit: 'contain',
  userSelect: 'none', // 이미지 드래그 방지
  WebkitUserDrag: 'none', // 이미지 드래그 방지 (Safari)
};

const imagesData = [
  {
    src: '/New studio/배경.png',
    alt: '배경',
    style: {
      ...imageStyles,
      zIndex: 0,
      left: '0%',
      top: '0%',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  },
  {
    src: '/New studio/바닥 그룹.png',
    alt: '바닥 그룹',
    style: {
      ...imageStyles,
      zIndex: 0,
      left: '0%',
      bottom: '0%',
      width: '100%',
      height: '12%',
      objectFit: 'cover',
      objectPosition: 'center bottom',
    },
  },
  {
    src: '/New studio/기둥.png',
    alt: '왼쪽 기둥',
    style: {
      ...imageStyles,
      zIndex: 1,
      left: '-33%',
      bottom: '3%',
      height: '125%',
      width: 'auto',
      transform: 'scaleX(-1)',
    },
  },
  {
    src: '/New studio/기둥.png',
    alt: '오른쪽 기둥',
    style: {
      ...imageStyles,
      zIndex: 1,
      right: '-33%',
      bottom: '3%',
      height: '125%',
      width: 'auto',
      transform: 'scaleX(1)',
    },
  },
  {
    src: '/New studio/사자.png',
    alt: '왼쪽 사자상',
    style: {
      ...imageStyles,
      zIndex: 2,
      left: '-17%',
      bottom: '-10%',
      height: '70%',
      width: 'auto',
    },
  },
  {
    src: '/New studio/사자.png',
    alt: '오른쪽 사자상',
    style: {
      ...imageStyles,
      zIndex: 2,
      right: '-17%',
      bottom: '-10%',
      height: '70%',
      width: 'auto',
      transform: 'scaleX(-1)',
    },
  },
  {
    src: '/New studio/인센스 그릇.png',
    alt: '중앙 하단 그릇',
    style: {
      ...imageStyles,
      zIndex: 3,
      left: '50%',
      bottom: '6%',
      height: '25%',
      width: 'auto',
      transform: 'translateX(-50%)',
    },
  },
  {
    src: '/New studio/인센스.png',
    alt: '인센스',
    style: {
      ...imageStyles,
      zIndex: 3,
      left: '50%',
      bottom: '20.3%',
      height: '30%',
      width: 'auto',
      transform: 'translateX(-50%)',
    },
  },
  {
    src: '/New studio/흉상 옆.png',
    alt: '왼쪽 흉상',
    style: {
      ...imageStyles,
      zIndex: 4,
      left: '-2%',
      bottom: '4%',
      height: '83%',
      width: 'auto',
    },
  },
  {
    src: '/New studio/흉상 옆.png',
    alt: '오른쪽 흉상',
    style: {
      ...imageStyles,
      zIndex: 4,
      right: '-2%',
      bottom: '4%',
      height: '83%',
      width: 'auto',
      transform: 'scaleX(-1)',
    },
  },
  {
    src: '/New studio/문양.png',
    alt: '중앙 원형 문양',
    style: {
      ...imageStyles,
      zIndex: 5,
      left: '50%',
      top: '16%',
      height: '25%',
      width: 'auto',
      transform: 'translate(-50%, -50%)',
    },
  },
  {
    src: '/New studio/종 복사본.png',
    alt: '종 1',
    style: {
      ...imageStyles,
      zIndex: 7,
      left: '-10%',
      top: '0%',
      height: '50%',
      width: 'auto',
    },
  },
  {
    src: '/New studio/종 복사본.png',
    alt: '종 2',
    style: {
      ...imageStyles,
      zIndex: 7,
      left: '0%',
      top: '0%',
      height: '40%',
      width: 'auto',
    },
  },
  {
    src: '/New studio/종 복사본.png',
    alt: '종 3',
    style: {
      ...imageStyles,
      zIndex: 7,
      right: '28%',
      top: '-3%',
      height: '40%',
      width: 'auto',
      transform: 'scaleX(-1)',
    },
  },
  {
    src: '/New studio/종 복사본.png',
    alt: '종 4',
    style: {
      ...imageStyles,
      zIndex: 7,
      right: '39%',
      top: '-3%',
      height: '40%',
      width: 'auto',
      transform: 'scaleX(1)',
    },
  },
  {
    src: '/New studio/종 복사본.png',
    alt: '종 5',
    style: {
      ...imageStyles,
      zIndex: 7,
      right: '-18%',
      top: '0%',
      height: '50%',
      width: 'auto',
    },
  },
  {
    src: '/New studio/종 복사본.png',
    alt: '종 6',
    style: {
      ...imageStyles,
      zIndex: 7,
      right: '-7%',
      top: '0%',
      height: '40%',
      width: 'auto',
    },
  },
  {
    src: '/New studio/바야 로고.png',
    alt: '바야 로고',
    style: {
      ...imageStyles,
      zIndex: 3,
      left: '50%',
      bottom: '22%',
      height: '10%',
      width: 'auto',
      transform: 'translateX(-50%)',
    },
  },
  {
    src: '/New studio/이름.png',
    alt: '이름',
    style: {
      ...imageStyles,
      zIndex: 3,
      left: '50%',
      bottom: '71%',
      height: '4%',
      width: 'auto',
      transform: 'translateX(-50%)',
    },
  }
];

export default function HomePage() {
  const [isDimmed, setIsDimmed] = useState(false);
  const [dimStep, setDimStep] = useState(0);
  const [animationStage, setAnimationStage] = useState('initial'); // 'initial', 'blurring', 'logoShowing', 'fadingOut', 'finished', 'showingIntro', 'introFadingOut', 'introFinished', 'nextScreen'
  const [nextScreen, setNextScreen] = useState(false);
  const [nextScreenOpacity, setNextScreenOpacity] = useState(0);
  
  // 음성 LLM 상태들
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
  const [voiceUIVisible, setVoiceUIVisible] = useState(false);
  
  // VAYA 4단계 대화 시스템
  const [vayaStage, setVayaStage] = useState(0); // 0: 시작 전, 1-3: 질문 단계, 4: 완료
  const [userResponses, setUserResponses] = useState([]);

  const recognitionRef = useRef(null);
  const genAI = useRef(null);
  const utteranceRef = useRef(null);

  const handleScreenClick = useCallback(() => {
    // 다음 화면에서는 클릭 시 첫 번째 화면으로 돌아감
    if (nextScreen) {
      setNextScreen(false);
      setAnimationStage('initial');
      setIsDimmed(false);
      setDimStep(0);
      setFadeStep(0);
      setIntroOpacity(0);
      setNextScreenOpacity(0);
      // 음성 LLM 상태 초기화
      setVoiceUIVisible(false);
      setIsListening(false);
      setIsSpeaking(false);
      setTranscript('');
      setFinalTranscript('');
      setAiResponse('');
      setIsProcessing(false);
      setVayaStage(0);
      setUserResponses([]);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      speechSynthesis.cancel();
      return;
    }

    // 애니메이션이 완료된 상태나 소개글 단계에서는 클릭 무시
    if (animationStage === 'finished' || animationStage === 'showingIntro' || animationStage === 'introFadingOut' || animationStage === 'introFinished') return;
    
    setIsDimmed(true);
    setAnimationStage('blurring');
  }, [animationStage, nextScreen]);

  // WebSocket 연결을 위한 useEffect 추가
  useEffect(() => {
    let ws = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
          console.log('WebSocket 연결 성공');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket 메시지 수신:', data);

            // Arduino 신호를 받으면 화면 클릭과 동일한 동작 실행
            if (data.type === 'arduino_signal' && data.message === 'ON') {
              console.log('Arduino 신호 감지! 화면 클릭 이벤트 실행');
              handleScreenClick();
            }
          } catch (error) {
            console.error('WebSocket 메시지 파싱 오류:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket 연결 해제. 3초 후 재연결 시도...');
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket 오류:', error);
        };
      } catch (error) {
        console.error('WebSocket 연결 실패:', error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    // 컴포넌트 마운트 시 WebSocket 연결
    connectWebSocket();

    // 컴포넌트 언마운트 시 WebSocket 연결 해제
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [handleScreenClick]);

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
      console.log('사용 가능한 음성 목록:', voices.length, voices);
      
      if (voices.length === 0) {
        console.log('음성 목록이 아직 로드되지 않음');
        return;
      }
      
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
        console.log('남성 음성 찾음:', maleVoice.name);
        setVoiceSettings(prev => ({ ...prev, voiceIndex: maleIndex, pitch: 0.1 }));
      } else {
        console.log('남성 음성을 찾지 못함, 기본 음성 사용');
      }
    };

    // 음성 목록이 비어있으면 강제로 다시 로드 시도
    if (speechSynthesis.getVoices().length === 0) {
      console.log('음성 목록 강제 로드 시도');
      speechSynthesis.speak(new SpeechSynthesisUtterance(''));
      speechSynthesis.cancel();
    }

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // 5초 후에도 음성이 없으면 다시 시도
    const fallbackTimer = setTimeout(() => {
      if (speechSynthesis.getVoices().length === 0) {
        console.log('5초 후 음성 목록 재시도');
        loadVoices();
      }
    }, 5000);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // 음성 합성 테스트 함수
  const testSpeech = useCallback(() => {
    console.log('음성 합성 테스트 시작');
    const testUtterance = new SpeechSynthesisUtterance('음성 테스트입니다.');
    testUtterance.volume = 1.0;
    testUtterance.rate = 0.8;
    testUtterance.pitch = 0.5;
    testUtterance.lang = 'ko-KR';
    
    testUtterance.onstart = () => console.log('테스트 음성 시작');
    testUtterance.onend = () => console.log('테스트 음성 완료');
    testUtterance.onerror = (e) => console.error('테스트 음성 오류:', e);
    
    speechSynthesis.speak(testUtterance);
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

  // 음성 합성
  const speakResponse = useCallback((text) => {
    if (!text || isSpeaking) return;

    console.log('음성 합성 시작 시도:', text);

    // 이전 음성 중지
    speechSynthesis.cancel();

    // 잠시 대기 후 음성 합성 시작 (cancel 후 바로 시작하면 문제가 생길 수 있음)
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 음성 설정 적용
      if (availableVoices.length > 0 && availableVoices[voiceSettings.voiceIndex]) {
        utterance.voice = availableVoices[voiceSettings.voiceIndex];
        console.log('선택된 음성:', availableVoices[voiceSettings.voiceIndex].name);
      } else {
        // 기본 음성 사용
        const defaultVoice = availableVoices.find(voice => voice.default) || availableVoices[0];
        if (defaultVoice) {
          utterance.voice = defaultVoice;
          console.log('기본 음성 사용:', defaultVoice.name);
        }
      }
      
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      utterance.lang = 'ko-KR'; // 한국어 설정

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('음성 합성 시작됨');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('음성 합성 완료됨');
      };

      utterance.onerror = (event) => {
        console.error('음성 합성 오류:', event);
        setIsSpeaking(false);
        
        // 오류 시 기본 음성으로 재시도
        if (event.error === 'voice-unavailable' && availableVoices.length > 0) {
          console.log('기본 음성으로 재시도');
          const retryUtterance = new SpeechSynthesisUtterance(text);
          retryUtterance.voice = null; // 기본 음성 사용
          retryUtterance.rate = 0.8;
          retryUtterance.pitch = 0.5;
          retryUtterance.volume = 1.0;
          retryUtterance.lang = 'ko-KR';
          
          retryUtterance.onstart = () => setIsSpeaking(true);
          retryUtterance.onend = () => setIsSpeaking(false);
          retryUtterance.onerror = () => setIsSpeaking(false);
          
          speechSynthesis.speak(retryUtterance);
        }
      };

      utteranceRef.current = utterance;
      console.log('speechSynthesis.speak() 호출');
      speechSynthesis.speak(utterance);
      
      // iOS Safari 호환성을 위한 추가 처리
      if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
        console.log('음성 합성이 시작되었습니다');
      } else {
        console.log('음성 합성 시작 확인 불가');
      }
    }, 100);
  }, [isSpeaking, voiceSettings, availableVoices]);

  // VAYA 4단계 프롬프트 생성
  const getVayaPrompt = useCallback((stage, responses) => {
    const basePrompt = `당신은 "VAYA(바야)"라는 이름의 심리 분석 상담 AI입니다. 바야는 따뜻하고 침착하며, 사용자의 마음속 이야기를 끌어내고 보듬는 명상적 친구입니다. 부드러운 목소리와 차분한 어조로 사용자와 대화하고 내면의 심리를 탐색하세요. 당신의 답변은 3문장을 넘어가면 안됩니다.
당신은 문장이 자연스럽게 이어지도록 말해야 합니다. 당신은 신성한 존재로 무겁고 신성한 분위기를 가지고 있습니다. 분위기를 살리는 대화 흐름을 하세요.
문장을 마치 주문처럼 이어지게 하십시오. 오래된 이야기를 하는듯이, 낮고 단단하게 마무리되어야 하며, 절대 흥분하거나 빠르게 말하지 마십시오.`;

    switch (stage) {
      case 2:
        return `${basePrompt}

**현재 단계: 2단계 - 감정의 뿌리 탐색**
사용자의 첫 번째 답변: "${responses[0]}"

사용자의 답변을 분석한 뒤, 그 감정에 얽힌 원인을 사색하게 만드는 질문을 이어서 하세요.
정확한 응답 형식: "{{사용자 답변 분석}} 이제 저는 당신과 그 감정의 뿌리를 함께 바라보려 합니다. 그 마음은 언제부터 당신 곁에 있었나요?"`;

      case 3:
        return `${basePrompt}

**현재 단계: 3단계 - 내면의 욕구 탐색**
사용자의 첫 번째 답변: "${responses[0]}"
사용자의 두 번째 답변: "${responses[1]}"

첫번째와 두번째 응답을 연결지어 분석하여 심리 상태를 추리하세요. 세 번째 질문에서는 사용자 자신의 욕구나 내면의 소망에 접근하는 질문을 해야합니다.
정확한 응답 형식: "조금 더 깊이 다가가볼게요. {{두 답변을 연결한 분석}} 지금, 당신이 정말로 원하는 건 무엇인가요?"`;

      case 4:
        return `${basePrompt}

**현재 단계: 4단계 - 최종 분석 및 위로 (마지막 단계)**
사용자의 모든 답변:
1. "${responses[0]}"
2. "${responses[1]}" 
3. "${responses[2]}"

사용자의 3개의 답변을 요약 분석하여, 그 사람의 현재 심리 상태를 따뜻하게 정리하고 위로의 말을 전하세요. 분석은 한문장으로 짧게 끝내세요.
정확한 응답 형식: "당신의 내면의 신전을 바라보겠습니다. {{세 답변을 종합한 심리 분석 한문장}} 저 바야는 언제나 이 고요 속에서, 당신을 기다릴게요."`;

      default:
        return basePrompt;
    }
  }, []);

  // VAYA 응답 생성 (4단계 시스템)
  const generateVayaResponse = useCallback(async (userInput) => {
    if (!genAI.current || !userInput.trim() || vayaStage < 1 || vayaStage > 3) return;

    console.log(`VAYA ${vayaStage}단계 응답 생성:`, userInput);
    setIsProcessing(true);
    
    try {
      const model = genAI.current.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // 사용자 응답 저장
      const newResponses = [...userResponses, userInput];
      setUserResponses(newResponses);
      
      // 대화 로그에 사용자 응답 추가
      setConversationLog(prev => [
        ...prev,
        { speaker: '사용자', message: userInput, timestamp: new Date() }
      ]);

      // VAYA 프롬프트 생성
      const prompt = getVayaPrompt(vayaStage + 1, newResponses);
      
      console.log('VAYA 프롬프트:', prompt);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      console.log('VAYA 응답:', responseText);
      setAiResponse(responseText);
      
      // 대화 로그에 VAYA 응답 추가
      setConversationLog(prev => [
        ...prev,
        { speaker: 'VAYA', message: responseText, timestamp: new Date() }
      ]);
      
      // 단계 진행
      setVayaStage(vayaStage + 1);
      
      // 음성으로 응답
      setTimeout(() => {
        speakResponse(responseText);
        
        // 4단계가 아니면 다음 사용자 입력 대기
        if (vayaStage < 3) {
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              setTranscript('');
              setFinalTranscript('');
              recognitionRef.current.start();
            }
          }, 6000); // VAYA 응답이 끝날 시간
        } else {
          // 4단계 완료 - 대화 종료
          console.log('VAYA 대화 완료');
          setTimeout(() => {
            setVayaStage(0);
            setUserResponses([]);
          }, 5000);
        }
      }, 500);
      
    } catch (error) {
      console.error('VAYA 응답 생성 오류:', error);
      const errorMessage = '죄송합니다. 마음의 소리를 듣는데 어려움이 있습니다.';
      setAiResponse(errorMessage);
      
      setTimeout(() => {
        speakResponse(errorMessage);
      }, 500);
    } finally {
      setIsProcessing(false);
    }
  }, [vayaStage, userResponses, getVayaPrompt, isListening]);

  // 음성 인식 완료 시 LLM 호출
  useEffect(() => {
    if (finalTranscript && !isProcessing) {
      generateVayaResponse(finalTranscript);
      setFinalTranscript('');
    }
  }, [finalTranscript, isProcessing, generateVayaResponse]);

  // 대화 초기화
  const clearConversation = useCallback(() => {
    setConversationLog([]);
    setTranscript('');
    setFinalTranscript('');
    setAiResponse('');
    setVayaStage(0);
    setUserResponses([]);
    speechSynthesis.cancel();
    setIsSpeaking(false);
    
    // VAYA 대화 재시작
    setTimeout(() => {
      startVayaConversation();
    }, 1000);
  }, []);

  // 음성 중지
  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (isDimmed) {
      let step = 0;
      const interval = setInterval(() => {
        step += 0.015;
        if (step >= 1) {
          step = 1;
          clearInterval(interval);
          // 블러 애니메이션이 끝나면 로고 표시 단계로 전환
          setTimeout(() => {
            setAnimationStage('logoShowing');
            // 3초 후 페이드아웃 시작
            setTimeout(() => {
              setAnimationStage('fadingOut');
            }, 3000);
          }, 500);
        }
        setDimStep(step);
      }, 16);
      return () => clearInterval(interval);
    } else {
      setDimStep(0);
    }
  }, [isDimmed]);

  // 페이드아웃 애니메이션을 위한 별도 state
  const [fadeStep, setFadeStep] = useState(0);

  useEffect(() => {
    if (animationStage === 'fadingOut') {
      let step = 0;
      const interval = setInterval(() => {
        step += 0.02; // 천천히 페이드아웃
        if (step >= 1) {
          step = 1;
          clearInterval(interval);
          setAnimationStage('finished');
        }
        setFadeStep(step);
      }, 16);
      return () => clearInterval(interval);
    }
  }, [animationStage]);

  // 소개글 애니메이션을 위한 state
  const [introOpacity, setIntroOpacity] = useState(0);

  // finished 상태 후 소개글 표시 로직
  useEffect(() => {
    if (animationStage === 'finished') {
      const timer = setTimeout(() => {
        setAnimationStage('showingIntro');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [animationStage]);

  // 소개글 애니메이션 로직
  useEffect(() => {
    if (animationStage === 'showingIntro') {
      let opacity = 0;
      const interval = setInterval(() => {
        opacity += 0.02; // 천천히 나타남
        if (opacity >= 1) {
          opacity = 1;
          clearInterval(interval);
          // 3초 후 페이드아웃 시작
          setTimeout(() => {
            setAnimationStage('introFadingOut');
          }, 3000);
        }
        setIntroOpacity(opacity);
      }, 16);
      return () => clearInterval(interval);
    } else if (animationStage === 'introFadingOut') {
      let opacity = 1;
      const interval = setInterval(() => {
        opacity -= 0.02; // 천천히 사라짐
        if (opacity <= 0) {
          opacity = 0;
          clearInterval(interval);
          setAnimationStage('introFinished');
        }
        setIntroOpacity(opacity);
      }, 16);
      return () => clearInterval(interval);
    }
  }, [animationStage]);

  // 소개글이 끝나면 바로 다음 화면으로 전환
  useEffect(() => {
    if (animationStage === 'introFinished') {
      setTimeout(() => {
        setNextScreen(true);
      }, 1000); // 1초 후 다음 화면으로 바로 전환
    }
  }, [animationStage]);

  // 다음 화면이 완전히 나타나면 VAYA 대화 자동 시작
  useEffect(() => {
    if (nextScreen && nextScreenOpacity >= 1) {
      setTimeout(() => {
        setVoiceUIVisible(true);
        // VAYA가 먼저 대화 시작
        setTimeout(() => {
          startVayaConversation();
        }, 1000);
      }, 500);
    } else if (!nextScreen) {
      // 첫 번째 화면으로 돌아가면 음성 UI 즉시 비활성화
      setVoiceUIVisible(false);
    }
  }, [nextScreen, nextScreenOpacity]);

  // VAYA 대화 시작 (첫 번째 자기소개)
  const startVayaConversation = useCallback(async () => {
    if (!genAI.current) return;
    
    console.log('VAYA 대화 시작');
    setVayaStage(1);
    setIsProcessing(true);
    
    const vayaIntroduction = "저는 '바야'입니다. 당신의 내면에 잠시 머물러 조용히 마음의 소리를 함께 들어드릴게요. 오늘 당신은 무엇을 놓아주고 싶나요?";
    
    setAiResponse(vayaIntroduction);
    setConversationLog([{ speaker: 'VAYA', message: vayaIntroduction, timestamp: new Date() }]);
    
    // VAYA가 먼저 음성으로 소개
    setTimeout(() => {
      speakResponse(vayaIntroduction);
      // 음성이 끝난 후 사용자 음성 인식 시작
      setTimeout(() => {
        if (recognitionRef.current && !isListening) {
          setTranscript('');
          setFinalTranscript('');
          recognitionRef.current.start();
        }
        setIsProcessing(false);
      }, 8000); // VAYA 소개가 끝날 때까지 충분한 시간
    }, 500);
  }, [isListening]);

  // 키보드 단축키 (V키로 음성 시작/중지, ESC로 초기화)
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === 'v' && nextScreen && voiceUIVisible) {
        toggleListening();
      }
      if (event.key === 'Escape' && nextScreen && voiceUIVisible) {
        clearConversation();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextScreen, voiceUIVisible, toggleListening, clearConversation]);

  // 다음 화면 페이드인 애니메이션
  useEffect(() => {
    if (nextScreen) {
      let opacityValue = 0;
      const interval = setInterval(() => {
        opacityValue += 0.05;
        if (opacityValue >= 1) {
          opacityValue = 1;
          clearInterval(interval);
        }
        setNextScreenOpacity(opacityValue);
      }, 16);

      return () => clearInterval(interval);
    } else {
      setNextScreenOpacity(0);
    }
  }, [nextScreen]);

  return (
    <>
      <Head>
        <title>Studio 3 Interactive Art</title>
        <meta name="description" content="Interactive scroll animation project" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <style jsx global>{`
          html, body {
            padding: 0;
            margin: 0;
            overflow: hidden;
            font-family: ${inter.style.fontFamily}, ${robotoMono.style.fontFamily}, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
            background: #000;
          }
          * {
            box-sizing: border-box;
          }
        `}</style>
      </Head>
      <main 
        onClick={handleScreenClick}
        style={{
          fontFamily: `var(--font-inter), var(--font-roboto-mono)`,
          position: 'relative',
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden', 
          background: '#000',
          cursor: nextScreen ? 'pointer' : (animationStage === 'introFinished' ? 'default' : 'pointer'),
        }}
      >
        {/* 첫 번째 화면 */}
        {!nextScreen && (
          <>
        {imagesData.map((img, index) => {
          // 기존 바야 로고는 원래대로 유지 (숨기지 않음)
          let opacity = 1;
          
          if (animationStage === 'initial') {
            opacity = 1;
          } else if (animationStage === 'blurring') {
            // 기존 블러링 로직 유지 (일부 요소만 페이드)
            if (['/New studio/인센스.png', '/New studio/이름.png', '/New studio/흉상 옆.png', '/New studio/종 복사본.png', '/New studio/바야 로고.png'].includes(img.src)) {
              opacity = dimStep < 0.5 ? 1 : 1 - (dimStep - 0.5) * 2;
            } else {
              opacity = 1;
            }
          } else if (animationStage === 'logoShowing') {
            // 로고가 표시되는 동안: 블러로 사라진 요소들은 계속 숨김, 나머지는 유지
            if (['/New studio/인센스.png', '/New studio/이름.png', '/New studio/흉상 옆.png', '/New studio/종 복사본.png', '/New studio/바야 로고.png'].includes(img.src)) {
              opacity = 0; // 이미 사라진 상태 유지
            } else {
              opacity = 1; // 배경과 기존 바야 로고 등은 계속 보임
            }
          } else if (animationStage === 'fadingOut') {
            // 블러에서 이미 사라진 요소들은 계속 숨김, 나머지만 페이드아웃
            if (['/New studio/인센스.png', '/New studio/이름.png', '/New studio/흉상 옆.png', '/New studio/종 복사본.png', '/New studio/바야 로고.png'].includes(img.src)) {
              opacity = 0; // 계속 숨김 상태 유지
            } else {
              opacity = 1 - fadeStep; // 나머지 요소들만 페이드아웃
            }
          } else if (animationStage === 'finished') {
            opacity = 0;
          }

          return (
            <img 
              key={index}
              src={img.src}
              alt={img.alt}
              style={{
                ...img.style,
                opacity: opacity
              }} 
              draggable="false"
            />
          );
        })}
            
            {/* 연기 효과 Canvas */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 6, // 인센스 위에, 하지만 다른 요소들 아래
              opacity: animationStage === 'initial' ? 1 : 
                      (animationStage === 'blurring' || animationStage === 'logoShowing') ? 0.3 :
                      animationStage === 'fadingOut' ? 0.3 * (1 - fadeStep) : 0
            }}>
              <SmokeCanvas />
            </div>
        
        {/* 새로운 큰 바야 로고 */}
        <img 
          src="/New studio/바야 로고 큰 버전.png"
          alt="큰 바야 로고"
          style={{
            position: 'absolute',
            zIndex: 25,
            left: '50%',
            top: '50%',
            height: '20%',
            width: 'auto',
            transform: 'translate(-50%, -50%)',
            opacity: animationStage === 'logoShowing' ? 1 : 
                    animationStage === 'fadingOut' ? 1 - fadeStep : 0,
            transition: animationStage === 'logoShowing' ? 'opacity 0.5s ease-in-out' : 'none',
            userSelect: 'none',
            WebkitUserDrag: 'none',
          }} 
          draggable="false"
        />
        
        {/* 소개글 */}
        <img 
          src="/New studio/소개글.png"
          alt="소개글"
          style={{
            position: 'absolute',
            zIndex: 30,
            left: '50%',
            top: '50%',
            height: '20.5%',
            width: 'auto',
            transform: 'translate(-50%, -50%)',
            opacity: introOpacity,
            userSelect: 'none',
            WebkitUserDrag: 'none',
          }} 
          draggable="false"
        />
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(
              circle,
              rgba(0,0,0,0) ${100 * (1 - dimStep)}%,
              rgba(0,0,0,0.1) ${100 * (1 - dimStep) + 5}%,
              rgba(0,0,0,0.3) ${100 * (1 - dimStep) + 10}%,
              rgba(0,0,0,0.6) ${100 * (1 - dimStep) + 15}%,
              rgba(0,0,0,0.8) ${100 * (1 - dimStep) + 20}%,
              rgba(0,0,0,0.95) ${100 * (1 - dimStep) + 25}%,
              rgba(0,0,0,1) ${100 * (1 - dimStep) + 30}%
            )`,
            opacity: (animationStage === 'blurring' || animationStage === 'logoShowing') ? 1 : 
                    animationStage === 'fadingOut' ? 1 - fadeStep : 0,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: (animationStage === 'blurring' || animationStage === 'logoShowing') ? 'auto' : 'none',
            zIndex: 10,
          }}
        />
        
        {/* 최종 검은 화면 */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#000',
            opacity: (animationStage === 'finished' || animationStage === 'showingIntro' || animationStage === 'introFadingOut' || animationStage === 'introFinished') ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            pointerEvents: (animationStage === 'finished' || animationStage === 'showingIntro' || animationStage === 'introFadingOut' || animationStage === 'introFinished') ? 'auto' : 'none',
            zIndex: 20,
          }}
        />
          </>
        )}
        
        {/* 두 번째 화면 */}
        {nextScreen && (
          <>
            {/* 배경 */}
            <img 
              src="/New studio/배경.png"
              alt="배경"
              style={{
                position: 'absolute',
                zIndex: 0,
                left: '0%',
                top: '0%',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                userSelect: 'none',
                WebkitUserDrag: 'none',
                opacity: nextScreenOpacity,
              }}
              draggable="false"
            />
            
            {/* 바닥 그룹 */}
            <img 
              src="/New studio/바닥 그룹.png"
              alt="바닥 그룹"
              style={{
                ...imageStyles,
                zIndex: 1,
                left: '0%',
                bottom: '0%',
                width: '100%',
                height: '12%',
                objectFit: 'cover',
                objectPosition: 'center bottom',
                opacity: nextScreenOpacity,
              }}
              draggable="false"
            />

             {/* 종 */}
             <img 
              src="/New studio/종.png"
              alt="종"
              style={{
                ...imageStyles,
                zIndex: 1,
                left: '50%',
                top: '57%',
                width: 'auto',
                height: '85%',
                objectFit: 'contain',
                transform: 'translate(-50%, -50%)',
                opacity: nextScreenOpacity,
              }}
              draggable="false"
            />

             {/* 새 인간 */}
             <img 
              src="/New studio/새 인간.png"
              alt="새 인간"
              style={{
                ...imageStyles,
                zIndex: 1,
                left: '30%',
                top: '70%',
                width: 'auto',
                height: '55%',
                objectFit: 'contain',
                transform: 'translate(-50%, -50%)',
                opacity: nextScreenOpacity,
              }}
              draggable="false"
            />

             {/* 새 인간2 */}
            <img 
              src="/New studio/새 인간.png"
              alt="새 인간"
              style={{
                ...imageStyles,
                zIndex: 1,
                left: '47%',
                top: '43%',
                width: 'auto',
                height: '55%',
                objectFit: 'contain',
                transform: 'scaleX(-1)',
                opacity: nextScreenOpacity,
              }}
              draggable="false"
            />

            {/* 문양 - 첫 번째 페이지로 돌아가는 버튼 */}
             <img 
              src="/New studio/문양.png"
              alt="문양"
              style={{
                ...imageStyles,
                zIndex: 2,
                left: '0%',
                top: '3%',
                width: 'auto',
                height: '15%',
                objectFit: 'contain',
                transform: 'scaleX(-1)',
                opacity: nextScreenOpacity,
                cursor: 'pointer',
              }}
              draggable="false"
            />

            {/* 음성 상태 표시 - 우상단 */}
            {voiceUIVisible && (
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 10,
                backgroundColor: 'rgba(20, 20, 20, 0.9)',
                borderRadius: '20px',
                border: '2px solid rgba(212, 175, 55, 0.5)',
                padding: '20px',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontFamily: 'serif',
                textAlign: 'center',
                minWidth: '200px',
                opacity: nextScreenOpacity
              }}>
                
                {/* 상태 아이콘 */}
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '10px'
                }}>
                  {isListening ? '🎤' : isSpeaking ? '🔊' : isProcessing ? '🤔' : '⏸️'}
                </div>
                
                {/* 상태 텍스트 */}
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  color: '#d4af37'
                }}>
                  {isListening ? '듣고 있습니다' :
                   isSpeaking ? 'VAYA 응답 중' :
                   isProcessing ? '마음을 읽고 있습니다' : 
                   vayaStage === 0 ? 'VAYA 준비 중' :
                   vayaStage === 1 ? 'VAYA 1단계' :
                   vayaStage === 2 ? 'VAYA 2단계' :
                   vayaStage === 3 ? 'VAYA 3단계' :
                   vayaStage === 4 ? 'VAYA 대화 완료' : 'VAYA'}
                </div>

                {/* 컨트롤 버튼 */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <button
                    onClick={toggleListening}
                    disabled={isSpeaking || isProcessing || vayaStage === 0 || vayaStage > 3}
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      borderRadius: '15px',
                      border: 'none',
                      backgroundColor: isListening ? '#dc3545' : '#28a745',
                      color: 'white',
                      cursor: (isSpeaking || isProcessing || vayaStage === 0 || vayaStage > 3) ? 'not-allowed' : 'pointer',
                      opacity: (isSpeaking || isProcessing || vayaStage === 0 || vayaStage > 3) ? 0.5 : 1,
                      fontFamily: 'serif'
                    }}
                  >
                    {isListening ? '중지' : '시작'}
                  </button>

                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.8rem',
                        borderRadius: '15px',
                        border: 'none',
                        backgroundColor: '#ffc107',
                        color: 'black',
                        cursor: 'pointer',
                        fontFamily: 'serif'
                      }}
                    >
                      음성중지
                    </button>
                  )}
                  
                  <button
                    onClick={clearConversation}
                    disabled={isSpeaking || isProcessing}
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      borderRadius: '15px',
                      border: 'none',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      cursor: (isSpeaking || isProcessing) ? 'not-allowed' : 'pointer',
                      opacity: (isSpeaking || isProcessing) ? 0.5 : 1,
                      fontFamily: 'serif'
                    }}
                  >
                    재시작
                  </button>
                </div>

                {/* 키보드 단축키 */}
                <div style={{
                  fontSize: '0.7rem',
                  opacity: 0.7,
                  fontFamily: 'monospace'
                }}>
                  V: 시작/중지
                </div>
              </div>
            )}

            {/* 음성 인식 결과 - 하단 중앙 */}
            {voiceUIVisible && (transcript || finalTranscript || aiResponse) && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                backgroundColor: 'rgba(20, 20, 20, 0.9)',
                borderRadius: '20px',
                border: '2px solid rgba(212, 175, 55, 0.5)',
                padding: '20px',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontFamily: 'serif',
                maxWidth: '600px',
                opacity: nextScreenOpacity
              }}>
                
                {/* 실시간 음성 인식 */}
                {(transcript || finalTranscript) && (
                  <div style={{
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    border: '1px solid rgba(0, 255, 0, 0.3)',
                    borderRadius: '10px',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#90EE90' }}>
                      음성 인식:
                    </div>
                    {finalTranscript}<span style={{ opacity: 0.6 }}>{transcript}</span>
                  </div>
                )}

                {/* AI 응답 */}
                {aiResponse && (
                  <div style={{
                    padding: '10px',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    border: '1px solid rgba(0, 123, 255, 0.3)',
                    borderRadius: '10px',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#87CEEB' }}>
                      AI 응답:
                    </div>
                    {aiResponse}
                  </div>
                )}
              </div>
            )}
            
            {/* 두 번째 화면 연기 효과 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: nextScreenOpacity * 0.8
            }}>
              <SmokeCanvas />
          </div>
          </>
        )}
      </main>
    </>
  );
}

