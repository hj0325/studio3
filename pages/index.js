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
];

export default function HomePage() {
  const [isDimmed, setIsDimmed] = useState(false);
  const [dimStep, setDimStep] = useState(0);

  const handleScreenClick = () => {
    setIsDimmed(true);
  };

  useEffect(() => {
    if (isDimmed) {
      let step = 0;
      const interval = setInterval(() => {
        step += 0.015;
        if (step >= 1) {
          step = 1;
          clearInterval(interval);
        }
        setDimStep(step);
      }, 16);
      return () => clearInterval(interval);
    } else {
      setDimStep(0);
    }
  }, [isDimmed]);

  return (
    <>
      <Head>
        <title>Studio 3 Interactive Art</title>
        <meta name="description" content="Interactive scroll animation project" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="icon" href="/favicon.ico" />
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
        {imagesData.map((img, index) => (
          <img 
            key={index}
            src={img.src}
            alt={img.alt}
            style={{
              ...img.style,
              // 인센스.png만 dimStep에 따라 투명해지게 함
              opacity: img.src === '/New studio/인센스.png' 
                ? (dimStep < 0.5 ? 1 : 1 - (dimStep - 0.5) * 2)
                : 1
            }} 
            draggable="false"
          />
        ))}
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
            opacity: isDimmed ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: isDimmed ? 'auto' : 'none',
            zIndex: 10,
          }}
        />
      </main>
    </>
  );
}

