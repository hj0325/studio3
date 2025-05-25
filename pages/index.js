import Head from "next/head";
// import Image from "next/image"; // 현재 직접 img 태그를 사용하므로 Next/Image는 주석 처리
import { Geist, Geist_Mono } from "next/font/google";
// import styles from "@/styles/Home.module.css"; // 기본 스타일 시트 사용 안 함
import React, { useState, useEffect } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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

  const handleScreenClick = () => {
    // 애니메이션이 완료된 상태나 소개글 단계에서는 클릭 무시
    if (animationStage === 'finished' || animationStage === 'showingIntro' || animationStage === 'introFadingOut' || animationStage === 'introFinished' || animationStage === 'nextScreen') return;
    
    setIsDimmed(true);
    setAnimationStage('blurring');
  };

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

  // 소개글 완료 후 다음 화면으로 전환
  useEffect(() => {
    if (animationStage === 'introFinished') {
      const timer = setTimeout(() => {
        setAnimationStage('nextScreen');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [animationStage]);

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
            font-family: ${geistSans.style.fontFamily}, ${geistMono.style.fontFamily}, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
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
          fontFamily: `var(--font-geist-sans), var(--font-geist-mono)`,
          position: 'relative',
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden', 
          background: '#000',
          cursor: 'pointer',
        }}
      >
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
        
        {/* 다음 화면 */}
        {animationStage === 'nextScreen' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 50,
            background: '#000',
          }}>
            {/* 다음 화면의 배경 - 첫 화면과 동일한 크기, 위치 */}
            <img 
              src="/New studio/배경.png"
              alt="다음 화면 배경"
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
              }}
              draggable="false"
            />

             {/* 종 */}
             <img 
              src="/New studio/종.png"
              alt="종"
              style={{
                ...imageStyles,
                zIndex: 10,
                left: '50%',
                top: '57%',
                width: 'auto',
                height: '85%',
                objectFit: 'contain',
                transform: 'translate(-50%, -50%)',
              }}
              draggable="false"
            />

             {/* 새 인간 */}
             <img 
              src="/New studio/새 인간.png"
              alt="새 인간"
              style={{
                ...imageStyles,
                zIndex: 10,
                left: '30%',
                top: '70%',
                width: 'auto',
                height: '55%',
                objectFit: 'contain',
                transform: 'translate(-50%, -50%)',
              }}
              draggable="false"
            />

            {/* 새 인간2 */}
            <img 
              src="/New studio/새 인간.png"
              alt="새 인간"
              style={{
                ...imageStyles,
                zIndex: 10,
                left: '47%',
                top: '43%',
                width: 'auto',
                height: '55%',
                objectFit: 'contain',
                transform: 'scaleX(-1)',
              }}
              draggable="false"
            />
          </div>
        )}
      </main>
    </>
  );
}

