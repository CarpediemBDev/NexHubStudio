# 로컬 SSL 인증서 발급 가이드 (mkcert)

이 프로젝트는 로컬 개발 환경에서 HTTPS를 사용하기 위해 `mkcert`로 발급된 사설 인증서를 사용합니다.
새로운 개발 환경 세팅 시 아래 절차에 따라 인증서를 발급받아야 합니다.

## 1. mkcert 설치

`mkcert`는 신뢰할 수 있는 로컬 인증서(Trusted Certificate)를 쉽게 만들어주는 도구입니다.

### Windows (PowerShell)

```powershell
# 방법 1: Chocolatey 사용 (추천)
choco install mkcert

# 방법 2: 직접 다운로드
Invoke-WebRequest "https://dl.filippo.io/mkcert/latest?for=windows/amd64" -OutFile "mkcert.exe"
```

### macOS

```bash
brew install mkcert
brew install nss # Firefox 사용자라면 필요
```

## 2. 로컬 CA(인증 기관) 등록

내 컴퓨터가 `mkcert`를 신뢰하도록 시스템에 루트 인증서를 등록합니다. (최초 1회만 수행)

```bash
mkcert -install
# (또는 .\mkcert.exe -install)
```

_보안 경고 팝업이 뜨면 '예'를 선택하세요._

## 3. 인증서 발급 (백엔드용)

백엔드 프로젝트의 리소스 폴더로 이동하여 인증서 파일(`keystore.p12`)을 생성합니다.

```bash
# 1. 인증서 생성 명령어 실행
./mkcert.exe -pkcs12 -p12-file keystore.p12 localhost 127.0.0.1
# (exe 파일 직접 사용 시: ..\..\..\mkcert.exe -pkcs12 ...)
```

- **생성 파일**: `keystore.p12`
- **비밀번호**: 기본값 `changeit` (자동 설정됨)

이제 백엔드를 실행하면 HTTPS(8443) 포트로 정상 구동됩니다.
