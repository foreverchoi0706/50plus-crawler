# 서울시50플러스포털 크롤러

웹 페이지에서 원하는 영역을 선택하여 Excel 파일로 추출할 수 있는 크롬 확장프로그램입니다. 특히 서울시50플러스포털의 컨텐츠를 효율적으로 수집할 수 있도록 설계되었습니다.

## 🚀 주요 기능

- 🖱️ **드래그로 원하는 영역 선택** - Selecto.js 기반 직관적인 선택 시스템
- 📋 **자동 데이터 추출** - 텍스트, 링크, 이미지 URL 자동 수집
- 📊 **Excel 파일 변환** - XLSX.js를 활용한 고품질 Excel 출력
- 👀 **실시간 미리보기** - HTML 테이블 형태로 데이터 확인
- ⌨️ **다중 선택 지원** - Shift 키를 누른 상태로 여러 영역 선택
- 🏢 **4가지 컨텐츠 타입** 지원:
  - 일자리 정보
  - 교육·문화 정보
  - 복지·건강 정보
  - 중장년 매거진
- 🔗 **빠른 카테고리 이동** - 원클릭으로 관련 페이지 이동

## 🏗️ 프로젝트 구조

```
root/
├── 📁 src/                    # 소스 코드
│   ├── 🧠 content.ts         # 크롤링 핵심 로직 (332줄)
│   ├── 🎨 App.tsx           # 팝업 UI 컴포넌트 (127줄)
│   ├── 🎨 App.module.css    # CSS 모듈 스타일 (78줄)
│   ├── 🚀 main.tsx          # React 앱 진입점
│   └── 📝 css.d.ts          # CSS 모듈 타입 정의
├── 📁 public/                # 정적 자산
│   ├── 🖼️ icons/logo.png    # 확장프로그램 아이콘
│   └── 📋 manifest.json     # Chrome 확장프로그램 매니페스트
├── ⚙️ package.json          # 의존성 및 스크립트
├── 🔧 biome.json            # Biome 린터/포매터 설정
├── ⚡ vite.config.ts        # Vite 빌드 설정
└── 📚 README.md             # 프로젝트 문서
```

## 🛠️ 기술 스택

### 프론트엔드

- **React 18.2.0** - 현대적인 UI 컴포넌트 시스템
- **TypeScript 5.2.2** - 타입 안전성 및 개발자 경험 향상
- **Vite 6.3.5** - 빠른 빌드 및 개발 서버

### 크롤링 & 데이터 처리

- **Selecto 1.26.3** - 드래그 기반 영역 선택 라이브러리
- **XLSX 0.18.5** - Excel 파일 생성 및 조작

### 개발 도구 & 품질 관리

- **Biome 2.0.6** - 린터/포매터 (ESLint 대체)
- **Chrome Extension API** - 브라우저 확장 기능

## 📦 설치 방법

### 개발 환경 설정

```bash
# 저장소 클론
git clone [repository-url]
cd excelecto

# 의존성 설치
npm install

# 개발 모드 실행 (자동 빌드)
npm run dev

# 프로덕션 빌드
npm run build
```

### Chrome 확장프로그램 설치

1. `npm run build` 실행
2. Chrome에서 `chrome://extensions/` 접속
3. "개발자 모드" 활성화
4. "압축해제된 확장프로그램을 로드합니다" 클릭
5. `dist` 폴더 선택

## 🎯 사용 방법

### 기본 크롤링

1. 서울시50플러스포털 페이지에서 확장프로그램 아이콘 클릭
2. "영역 선택 시작" 버튼 클릭
3. 원하는 영역을 드래그하여 선택
4. 여러 영역 선택 시 Shift 키를 누른 상태로 선택
5. 우측 상단의 "추출" 버튼 클릭
6. Excel 파일 다운로드 및 미리보기 확인

### 빠른 카테고리 이동

- **일자리** - 일자리 관련 정보 페이지로 이동
- **복지·건강** - 복지 및 건강 정보 페이지로 이동
- **교육·문화** - 교육 및 문화 정보 페이지로 이동
- **중장년 매거진** - 매거진 페이지로 이동

## 🔧 설정 및 커스터마이징

### Biome 설정 (biome.json)

```json
{
  "formatter": {
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "complexity": {
        "noForEach": "off"
      }
    }
  }
}
```

### Vite 빌드 설정

- **멀티 엔트리** 빌드 (popup + content script)
- **자동 감시** 모드 지원
- **TypeScript** 컴파일 통합

## 📊 데이터 처리 파이프라인

```
웹페이지 → 영역선택 → 데이터추출 → Excel변환 → 다운로드
     ↓           ↓         ↓         ↓         ↓
  Selecto    getAllTextNodes  XLSX.js   .xlsx파일
```

### 추출 데이터 타입

- **텍스트 노드** - 선택된 영역의 모든 텍스트
- **이미지 URL** - 이미지 소스 경로
- **링크 href** - 하이퍼링크 주소
- **URL 파라미터** - id 등 쿼리 파라미터

## 🎨 UI/UX 특징

### 반응형 디자인

- **320px** 팝업 너비로 최적화
- **Flexbox** 기반 현대적 레이아웃
- **모던한 버튼** 스타일 및 호버 효과

### 사용자 경험

- **Shift + 클릭** 다중 선택 지원
- **Escape 키** 선택 취소
- **실시간 미리보기** 기능
- **직관적인 아이콘** 및 버튼 배치

## 🔒 보안 및 권한

### Chrome 확장프로그램 권한

```json
{
  "permissions": ["activeTab", "scripting", "tabs"],
  "host_permissions": ["<all_urls>"]
}
```

- **activeTab** - 현재 활성 탭에만 접근
- **scripting** - 콘텐츠 스크립트 주입
- **tabs** - 탭 정보 조회

## 🚨 제한사항

- **Chrome 내장 페이지**에서는 사용 불가 (`chrome://` URL)
- **HTTPS 페이지**에서만 정상 작동
- **일부 동적 콘텐츠**는 JavaScript 실행 후에만 추출 가능

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 개발 가이드라인

- **TypeScript strict 모드** 준수
- **Biome 린터** 규칙 적용
- **CSS 모듈** 사용
- **에러 핸들링** 구현

## 📝 라이선스

MIT License

## 👥 팀

- **개발팀**: 비즈플랫폼 개발팀
- **담당자**: 최영원
- **문의**: 개발팀 내부 문의

## 🔄 업데이트 히스토리

### v1.0.0

- 초기 버전 릴리즈
- 기본 크롤링 기능 구현
- 4가지 컨텐츠 타입 지원
- Excel 내보내기 기능
- 현대적인 UI/UX 디자인
