const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');

// WebSocket 서버 생성 (포트 8080)
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket 서버가 포트 8080에서 실행 중입니다.');

// 연결된 클라이언트들을 저장할 배열
const clients = [];

// WebSocket 연결 처리
wss.on('connection', (ws) => {
  console.log('새로운 클라이언트가 연결되었습니다.');
  clients.push(ws);

  // 클라이언트 연결 해제 처리
  ws.on('close', () => {
    console.log('클라이언트 연결이 해제되었습니다.');
    const index = clients.indexOf(ws);
    if (index > -1) {
      clients.splice(index, 1);
    }
  });

  // 클라이언트에게 연결 확인 메시지 전송
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket 연결 성공' }));
});

// 시리얼 포트 자동 감지 함수
async function findArduinoPort() {
  try {
    const ports = await SerialPort.list();
    console.log('사용 가능한 포트들:');
    ports.forEach(port => {
      console.log(`- ${port.path}: ${port.manufacturer || 'Unknown'}`);
    });

    // Arduino 포트 찾기 (일반적인 패턴들)
    const arduinoPort = ports.find(port => 
      port.path.includes('tty.usbmodem') || 
      port.path.includes('tty.usbserial') ||
      port.manufacturer?.toLowerCase().includes('arduino') ||
      port.manufacturer?.toLowerCase().includes('ch340') ||
      port.manufacturer?.toLowerCase().includes('ftdi')
    );

    if (arduinoPort) {
      console.log(`Arduino 포트를 찾았습니다: ${arduinoPort.path}`);
      return arduinoPort.path;
    } else {
      console.log('Arduino 포트를 찾을 수 없습니다. 수동으로 포트를 확인해주세요.');
      return null;
    }
  } catch (error) {
    console.error('포트 검색 중 오류:', error);
    return null;
  }
}

// 시리얼 포트 연결 함수
async function connectToArduino() {
  const portPath = await findArduinoPort();
  
  if (!portPath) {
    console.log('Arduino 포트를 찾을 수 없습니다. 5초 후 다시 시도합니다...');
    setTimeout(connectToArduino, 5000);
    return;
  }

  try {
    // 시리얼 포트 연결 (Arduino Uno 기본 보드레이트: 9600)
    const port = new SerialPort({
      path: portPath,
      baudRate: 9600,
    });

    // 라인별로 데이터를 파싱하는 파서 생성
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    // 포트 연결 성공
    port.on('open', () => {
      console.log(`Arduino에 연결되었습니다: ${portPath}`);
    });

    // 시리얼 데이터 수신 처리
    parser.on('data', (data) => {
      const message = data.toString().trim();
      console.log(`Arduino에서 수신: "${message}"`);

      // "ON" 메시지를 받으면 모든 WebSocket 클라이언트에게 전송
      if (message === 'ON') {
        console.log('Arduino 신호 감지! WebSocket 클라이언트들에게 전송합니다.');
        
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: 'arduino_signal', 
              message: 'ON',
              timestamp: new Date().toISOString()
            }));
          }
        });
      }
    });

    // 포트 오류 처리
    port.on('error', (error) => {
      console.error('시리얼 포트 오류:', error);
      console.log('5초 후 재연결을 시도합니다...');
      setTimeout(connectToArduino, 5000);
    });

    // 포트 연결 해제 처리
    port.on('close', () => {
      console.log('Arduino 연결이 해제되었습니다. 5초 후 재연결을 시도합니다...');
      setTimeout(connectToArduino, 5000);
    });

  } catch (error) {
    console.error('Arduino 연결 실패:', error);
    console.log('5초 후 재연결을 시도합니다...');
    setTimeout(connectToArduino, 5000);
  }
}

// 서버 시작
console.log('Arduino-WebSocket 서버를 시작합니다...');
connectToArduino();

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n서버를 종료합니다...');
  wss.close();
  process.exit(0);
}); 