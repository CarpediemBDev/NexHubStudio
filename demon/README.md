# NexHubStudio 데몬 실행 방법

이 데몬(Express 서버)은 바코드 이미지 및 가격 등 API를 제공합니다.

## 1. Node.js 설치

- Node.js 16.x 이상이 설치되어 있어야 합니다.
- [Node.js 공식 사이트](https://nodejs.org/)에서 다운로드 및 설치

## 2. 의존성 설치

```
npm install
```

(이 명령은 demon 폴더에서 실행하세요)

## 3. 서버 실행

```
node server.js
```

- 서버가 정상적으로 실행되면:
  - http://localhost:3001/api/barcode
  - http://localhost:3001/api/price
  - http://localhost:3001/api/hello
    등의 엔드포인트를 사용할 수 있습니다.

## 4. 주요 엔드포인트

- `/api/barcode?text=...` : 바코드 이미지(PNG) 반환
- `/api/price?code=...` : 가격(텍스트) 반환
- `/api/hello` : 테스트용 JSON 반환

## 5. 참고

- CORS 미들웨어는 적용되어 있지 않으므로, 프론트엔드에서 직접 JS로 호출 시 CORS 오류가 발생할 수 있습니다.
- 이미지는 `<img src=...>`로, 텍스트/JSON은 프록시 또는 서버 CORS 허용 필요
