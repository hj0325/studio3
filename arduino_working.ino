#include <Adafruit_NeoPixel.h>

#define PIN 9
#define NUMPIXELS 1

Adafruit_NeoPixel pixels(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

bool sentSignal = false;
unsigned long lastSignalTime = 0;
const unsigned long SIGNAL_DELAY = 5000; // 5초마다 신호 전송

void setup() {
  Serial.begin(9600);
  pixels.begin();
  pixels.show();

  // 웹에 신호 전송
  Serial.println("ON");
  sentSignal = true;
  lastSignalTime = millis();
}

void loop() {
  // 주황~붉은 계열: (255, 60~20, 0)
  static uint8_t green = 40;         // 초록 채널 초기값
  static int8_t direction = 1;       // 색 변화 방향
  static uint8_t brightness = 200;   // 밝기 초기값

  // 초록 채널을 부드럽게 변화
  green += direction;
  if (green <= 20 || green >= 60) {
    direction = -direction;
  }

  // 밝기도 은은하게 파동
  brightness = 180 + sin(millis() / 1000.0) * 50; // 130~230 사이 파동

  uint8_t red = brightness;
  uint8_t g = green;
  uint8_t blue = 0;

  pixels.setPixelColor(0, pixels.Color(red, g, blue));
  pixels.show();

  // 주기적으로 ON 신호 재전송 (웹소켓 서버가 나중에 시작될 수 있으므로)
  if (millis() - lastSignalTime > SIGNAL_DELAY) {
    Serial.println("ON");
    lastSignalTime = millis();
  }

  delay(80); // 변화 속도: 너무 빠르지 않게 설정
} 