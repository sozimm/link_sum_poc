# Link Summary POC

웹페이지 요약 및 읽기모드 서비스

## 🚀 기능

- 웹페이지 URL 입력으로 자동 요약
- 읽기모드 (Safari 스타일) 지원
- 사용자별 히스토리 저장
- 커스텀 요약 프롬프트 지원
- 반응형 모바일 UI

## 🛠 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- Ant Design
- Tailwind CSS
- @mozilla/readability

### Backend
- Node.js + Express
- TypeScript
- OpenAI API
- Prisma (SQLite)
- Cheerio

## 📦 설치 및 실행

### 로컬 개발

1. **백엔드 설정**
```bash
cd backend
npm install
cp env.example .env
# .env 파일에 OPENAI_API_KEY 설정
npm run dev
```

2. **프론트엔드 설정**
```bash
cd frontend
npm install
npm run dev
```

3. **데이터베이스 설정**
```bash
cd backend
npx prisma generate
npx prisma db push
```

## 🌐 배포

### Vercel (프론트엔드)

1. [Vercel](https://vercel.com)에 가입
2. GitHub 저장소 연결
3. 프로젝트 설정:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 환경변수 설정 (필요시)

### Railway/Render (백엔드)

1. [Railway](https://railway.app) 또는 [Render](https://render.com)에 가입
2. GitHub 저장소 연결
3. 환경변수 설정:
   - `OPENAI_API_KEY`
   - `PORT`
   - `NODE_ENV=production`
   - `CORS_ORIGIN` (프론트엔드 도메인)

## 🔧 환경변수

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key
PORT=4000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
CORS_ORIGIN=http://localhost:3000
```

## 📱 사용법

1. 사용자 ID 선택
2. 분석할 웹페이지 URL 입력
3. 요약 결과 확인
4. 원본/읽기모드 탭으로 전환
5. 필요시 추가 프롬프트로 재요약

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## �� 라이선스

MIT License
