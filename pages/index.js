import Head from "next/head";
// import Image from "next/image"; // 현재 직접 img 태그를 사용하므로 Next/Image는 주석 처리
import { Geist, Geist_Mono } from "next/font/google";
// import styles from "@/styles/Home.module.css"; // 기본 스타일 시트 사용 안 함
import React from 'react';

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
    src: '/New studio/기둥.png',
    alt: '왼쪽 기둥',
    style: {
      ...imageStyles,
      zIndex: 1,
      left: '2%', // 좌우로 더 넓게
      bottom: '0%',
      height: '95%', // 약간 더 길게
      width: 'auto',
    },
  },
  {
    src: '/New studio/기둥.png',
    alt: '오른쪽 기둥',
    style: {
      ...imageStyles,
      zIndex: 1,
      right: '2%', // 좌우로 더 넓게
      bottom: '0%',
      height: '95%', // 약간 더 길게
      width: 'auto',
      transform: 'scaleX(-1)',
    },
  },
  {
    src: '/New studio/사자.png',
    alt: '왼쪽 사자상',
    style: {
      ...imageStyles,
      zIndex: 2,
      left: '8%', // 좌우로 더 넓게
      bottom: '0%',
      height: '75%', // 크기 조정
      width: 'auto',
    },
  },
  {
    src: '/New studio/사자.png',
    alt: '오른쪽 사자상',
    style: {
      ...imageStyles,
      zIndex: 2,
      right: '8%', // 좌우로 더 넓게
      bottom: '0%',
      height: '75%', // 크기 조정
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
      bottom: '2%', // 약간 위로
      height: '30%', // 크기 조정
      width: 'auto',
      transform: 'translateX(-50%)',
    },
  },
  {
    src: '/New studio/흉상 옆.png', // 이미지 교체
    alt: '왼쪽 흉상',
    style: {
      ...imageStyles,
      zIndex: 4,
      left: '20%', // 좌우로 더 넓게
      bottom: '5%', // 약간 위로
      height: '70%', // 크기 조정
      width: 'auto',
    },
  },
  {
    src: '/New studio/흉상 옆.png', // 이미지 교체
    alt: '오른쪽 흉상',
    style: {
      ...imageStyles,
      zIndex: 4,
      right: '20%', // 좌우로 더 넓게
      bottom: '5%', // 약간 위로
      height: '70%', // 크기 조정
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
      top: '50%', // Y축 중앙으로 더 이동
      height: '45%', // 크기 조정
      width: 'auto',
      transform: 'translate(-50%, -50%)',
    },
  },
  {
    src: '/New studio/바야 로고.png',
    alt: '상단 중앙 문양',
    style: {
      ...imageStyles,
      zIndex: 6,
      left: '50%',
      top: '12%', // 약간 아래로
      height: '20%', // 크기 조정
      width: 'auto',
      transform: 'translate(-50%, -50%)',
    },
  },
  {
    src: '/New studio/종 복사본.png', // 이미지 교체
    alt: '종 1',
    style: {
      ...imageStyles,
      zIndex: 7,
      left: '10%', // 좌우로 더 넓게
      top: '2%',
      height: '18%', // 크기 조정
      width: 'auto',
    },
  },
  {
    src: '/New studio/종 복사본.png', // 이미지 교체
    alt: '종 2',
    style: {
      ...imageStyles,
      zIndex: 7,
      left: '18%', // 좌우로 더 넓게
      top: '5%',
      height: '15%', // 크기 조정
      width: 'auto',
    },
  },
   {
    src: '/New studio/종 복사본.png', // 이미지 교체
    alt: '종 3',
    style: {
      ...imageStyles,
      zIndex: 7,
      right: '10%', // 좌우로 더 넓게
      top: '2%',
      height: '18%', // 크기 조정
      width: 'auto',
    },
  },
  {
    src: '/New studio/종 복사본.png', // 이미지 교체
    alt: '종 4',
    style: {
      ...imageStyles,
      zIndex: 7,
      right: '18%', // 좌우로 더 넓게
      top: '5%',
      height: '15%', // 크기 조정
      width: 'auto',
    },
  },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Studio 3 Interactive Art</title> {/* 타이틀 변경 */}
        <meta name="description" content="Interactive scroll animation project" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" /> {/* viewport 수정 */}
        <link rel="icon" href="/favicon.ico" />
        <style jsx global>{`
          html, body {
            padding: 0;
            margin: 0;
            overflow: hidden; /* 전체 페이지 스크롤 방지 */
            font-family: ${geistSans.style.fontFamily}, ${geistMono.style.fontFamily}, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
            background: #000; /* 기본 배경 검은색 */
          }
          * {
            box-sizing: border-box;
          }
        `}</style>
      </Head>
      <main 
        style={{
          fontFamily: `var(--font-geist-sans), var(--font-geist-mono)`,
          position: 'relative',
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden', 
          background: '#000'
        }}
      >
        {imagesData.map((img, index) => (
          <img // next/image 대신 기본 img 태그 사용으로 변경
            key={index}
            src={img.src}
            alt={img.alt}
            style={img.style} // 인라인 스타일 직접 적용
            draggable="false" // 이미지 드래그 방지
          />
        ))}
      </main>
    </>
  );
}
