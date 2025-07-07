import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import axios from 'axios'
import * as cheerio from 'cheerio'
import OpenAI from 'openai'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import dotenv from 'dotenv'
dotenv.config()

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// 요청 제한 설정 (분당 10회)
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 10, // 최대 10회
  duration: 60, // 1분
})

const app = express()
app.use(cors())
app.use(helmet())
app.use(compression())
app.use(express.json())

// 요청 제한 미들웨어
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip)
    next()
  } catch (rejRes) {
    res.status(429).json({ 
      error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' 
    })
  }
})

// URL 유효성 검사
const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return url.startsWith('http://') || url.startsWith('https://')
  } catch {
    return false
  }
}

// URL 크롤링 함수
const crawlUrl = async (url: string): Promise<{ title: string; content: string; html: string }> => {
  const response = await axios.get(url, {
    timeout: 10000, // 10초 타임아웃
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  const $ = cheerio.load(response.data)
  
  // 불필요한 태그들만 제거 (이미지는 유지)
  $('script, style').remove()
  
  const title = $('title').text().trim() || $('h1').first().text().trim() || '제목 없음'
  const content = $('body').text().replace(/\s+/g, ' ').trim()
  const html = $.html() // 전체 HTML 유지
  
  // 콘텐츠 크기 제한 (1MB)
  const maxContentSize = 1024 * 1024
  const truncatedContent = content.length > maxContentSize 
    ? content.substring(0, maxContentSize) + '... (내용이 너무 길어 잘렸습니다)'
    : content

  return { title, content: truncatedContent, html }
}

// GPT-4o를 사용한 마크다운 요약 생성
const generateSummary = async (content: string, title: string, userPrompt?: string): Promise<string> => {
  let prompt = `
다음 웹페이지의 내용을 마크다운 형식으로 요약해주세요:

제목: ${title}

내용:
${content}

요구사항:
1. 마크다운 문법을 사용하여 구조화된 요약을 작성
2. 주요 내용을 섹션별로 나누어 정리
3. 핵심 포인트를 불릿 포인트로 표시
4. 인용문이 있다면 > 기호를 사용
5. 중요한 내용은 **굵게** 표시
6. 제목은 #, ##, ### 등으로 계층화
7. 한글로 작성
`
  if (userPrompt) {
    prompt += `\n\n추가 요청사항:\n${userPrompt}`
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "당신은 웹페이지 내용을 마크다운 형식으로 요약하는 전문가입니다."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 2000,
    temperature: 0.7
  })

  return completion.choices[0]?.message?.content || '요약을 생성할 수 없습니다.'
}

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// URL 분석 및 요약 API
app.post('/api/analyze', async (req, res) => {
  try {
    const { url, userPrompt } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL이 필요합니다.' })
    }

    if (!validateUrl(url)) {
      return res.status(400).json({ error: '유효하지 않은 URL입니다.' })
    }

    // URL 크롤링
    const { title, content, html } = await crawlUrl(url)
    
    // 시스템 프롬프트에 유저 프롬프트 추가
    let summaryPrompt = undefined
    if (userPrompt && typeof userPrompt === 'string' && userPrompt.trim().length > 0) {
      summaryPrompt = userPrompt.trim()
    }

    // GPT-4o를 사용한 요약 생성
    const summary = await generateSummary(content, title, summaryPrompt)

    res.json({
      summary,
      originalContent: content,
      originalHtml: html,
      title
    })

  } catch (error) {
    console.error('URL 분석 중 오류:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return res.status(408).json({ error: 'URL 접근 시간이 초과되었습니다.' })
      }
      if (error.message.includes('404')) {
        return res.status(404).json({ error: '페이지를 찾을 수 없습니다.' })
      }
    }
    
    res.status(500).json({ error: 'URL 처리 중 오류가 발생했습니다.' })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`)
}) 