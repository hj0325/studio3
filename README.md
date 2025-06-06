# Studio 3 - Arduino Interactive Art Project

Arduino NeoPixel과 WebSocket을 통한 인터랙티브 아트 프로젝트입니다.

## 🎯 프로젝트 개요

- **Arduino Uno**에서 NeoPixel이 켜지면 "ON" 신호를 시리얼로 전송
- **Node.js 서버**가 시리얼 데이터를 수신하고 WebSocket으로 브로드캐스트
- **웹 페이지**가 WebSocket 신호를 받아 자동으로 다음 화면으로 전환
- 기존 클릭 인터랙션은 그대로 유지되며, Arduino 신호가 추가 트리거 역할

## 🛠 설치 및 설정

### 1. 의존성 설치
```bash
yarn install
```

### 2. Arduino 설정
Arduino IDE에서 다음 코드를 업로드하세요:

```cpp
void setup() {
  Serial.begin(9600);
  // NeoPixel 설정 코드
}

void loop() {
  // NeoPixel이 켜질 때
  if (neopixel_is_on) {
    Serial.println("ON");
    delay(1000); // 중복 전송 방지
  }
}
```

### 3. 시리얼 포트 확인
macOS에서 Arduino 포트 확인:
```bash
ls /dev/tty.usbmodem*
```

일반적인 포트 경로:
- `/dev/tty.usbmodem14101` (Arduino Uno)
- `/dev/tty.usbmodem14201` (Arduino Uno)
- `/dev/tty.usbserial-*` (CH340 칩셋)

## 🚀 실행 방법

### 방법 1: 모든 서비스 동시 실행 (권장)
```bash
yarn dev:full
```

### 방법 2: 개별 실행
터미널 1 - Next.js 개발 서버:
```bash
yarn dev
```

터미널 2 - Arduino WebSocket 서버:
```bash
yarn arduino-server
```

## 📱 사용법

1. **웹 브라우저**에서 `http://localhost:3000` 접속
2. **Arduino 연결** 확인 (콘솔에서 연결 메시지 확인)
3. **NeoPixel 켜기** → 자동으로 다음 화면 전환
4. **수동 클릭**도 여전히 작동

## 🔧 트러블슈팅

### Arduino 포트를 찾을 수 없는 경우
1. Arduino가 USB로 연결되어 있는지 확인
2. Arduino IDE에서 포트가 인식되는지 확인
3. 서버 콘솔에서 "사용 가능한 포트들" 목록 확인
4. 필요시 `server/arduino-websocket-server.js`에서 포트 경로 수동 설정

### WebSocket 연결 실패
1. 포트 8080이 사용 중인지 확인: `lsof -i :8080`
2. 방화벽 설정 확인
3. 브라우저 콘솔에서 WebSocket 오류 메시지 확인

### 시리얼 통신 문제
1. Arduino 보드레이트가 9600인지 확인
2. 시리얼 모니터가 열려있으면 닫기
3. Arduino 재부팅 후 재시도

## 📁 프로젝트 구조

```
studio3/
├── pages/
│   ├── index.js          # 첫 번째 화면 (기존 애니메이션)
│   └── next.js           # 두 번째 화면 (종과 새 인간)
├── server/
│   └── arduino-websocket-server.js  # Arduino-WebSocket 서버
├── public/
│   └── New studio/       # 이미지 파일들
├── package.json
└── README.md
```

## 🔄 동작 흐름

1. **Arduino**: NeoPixel 켜짐 → `Serial.println("ON")` 전송
2. **Node.js 서버**: 시리얼 수신 → WebSocket 브로드캐스트
3. **웹 페이지**: WebSocket 메시지 수신 → `handleScreenClick()` 실행
4. **결과**: 클릭한 것과 동일한 애니메이션 실행

## 🎨 화면 전환

- **첫 번째 화면** (`/`): 기존 애니메이션 시퀀스
- **두 번째 화면** (`/next`): 종과 새 인간이 있는 화면
- **Arduino 신호**: 어느 화면에서든 다음 단계로 전환
- **문양 클릭**: 두 번째 화면에서 첫 번째 화면으로 복귀

## 🔧 개발자 정보

- **포트**: WebSocket 서버는 8080 포트 사용
- **시리얼**: 9600 보드레이트
- **재연결**: 연결 실패 시 자동 재연결 (5초 간격)
- **로그**: 브라우저 콘솔과 서버 콘솔에서 상태 확인 가능

## 📝 주의사항

- Arduino와 시리얼 모니터를 동시에 사용하지 마세요
- 포트 권한 문제 시 `sudo` 사용 또는 사용자를 dialout 그룹에 추가
- 기존 디자인 요소는 전혀 변경되지 않았습니다

# 🎤 Google Cloud TTS 설정 (고품질 음성)

VayaVoiceChat에서 Google의 Neural 음성을 사용하려면 Google Cloud Text-to-Speech API를 설정해야 합니다.

## 1. Google Cloud Console 설정

### 1-1. 프로젝트 및 API 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **API 및 서비스** → **API 라이브러리**에서 "Text-to-Speech API" 검색 후 활성화
3. **결제** 계정 연결 (무료 한도 있음)

### 1-2. 서비스 계정 생성 (중요!)
1. **IAM 및 관리자** → **서비스 계정**으로 이동
2. **+ 서비스 계정 만들기** 클릭
3. 서비스 계정 이름 입력 (예: `studio3-tts`)
4. **역할 부여**: `Cloud Text-to-Speech API 사용자` 선택
5. **완료** 클릭

### 1-3. JSON 키 다운로드
1. 생성된 서비스 계정 클릭
2. **키** 탭으로 이동
3. **키 추가** → **새 키 만들기** → **JSON** 선택
4. JSON 파일이 자동으로 다운로드됨

## 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 중 하나를 설정:

### 방법 1: 서비스 계정 JSON 파일 경로 (권장)
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
NEXT_PUBLIC_GOOGLE_API_KEY=your_existing_gemini_api_key
```

### 방법 2: 서비스 계정 JSON 내용을 환경변수로
```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id",...}'
NEXT_PUBLIC_GOOGLE_API_KEY=your_existing_gemini_api_key
```

## 3. TTS 작동 방식

✅ **우선순위**: Google Cloud TTS → 브라우저 TTS (fallback)
✅ **음성 품질**: Google Neural 음성 (ko-KR-Neural2-A)
✅ **바야 캐릭터 최적화**: 느리고 차분한 음성 설정
✅ **자동 fallback**: Google TTS 실패 시 브라우저 TTS로 자동 전환

## 4. 트러블슈팅

### Google Cloud TTS가 작동하지 않는 경우
1. **서비스 계정 키 확인**: JSON 파일 경로 또는 내용이 올바른지 확인
2. **API 활성화 확인**: Google Cloud Console에서 Text-to-Speech API가 활성화되었는지 확인
3. **역할 권한 확인**: 서비스 계정에 TTS API 사용 권한이 있는지 확인
4. **브라우저 콘솔 확인**: 에러 메시지나 fallback 로그 확인

### 로그 확인 방법
브라우저 콘솔에서 다음 메시지들을 확인하세요:
- `✅ Google Cloud TTS 사용 중` (성공)
- `⚠️ Google Cloud TTS 실패, 브라우저 TTS로 fallback` (실패)
- `🔊 브라우저 TTS 시작` (fallback 사용)

## 5. 비용 안내

- **무료 한도**: 월 100만 자 (일반 음성), 월 100만 자 (WaveNet/Neural 음성)
- 바야의 메시지는 짧기 때문에 일반적인 사용에서는 무료 한도 내에서 사용 가능
