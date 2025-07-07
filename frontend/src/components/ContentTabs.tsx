import React, { useState } from 'react'
import { Card, Tabs, Typography, Space, Button, Input, Spin } from 'antd'
import { FileTextOutlined, LinkOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { Readability } from '@mozilla/readability'

const { Text, Title } = Typography
const { TextArea } = Input

interface ContentData {
  summary: string
  originalContent: string
  originalHtml?: string
  title?: string
  url?: string
}

interface ContentTabsProps {
  contentData: ContentData
  currentUrl?: string
  onResummarize?: (prompt: string) => Promise<void>
  isResummarizing?: boolean
}

// Readability 결과 타입 명시
interface ReadableContent {
  title: string;
  content: string;
  excerpt: string;
  siteName: string;
  byline: string;
  length: number;
  mainImage: string | null;
}

const ContentTabs: React.FC<ContentTabsProps> = ({ contentData, currentUrl, onResummarize, isResummarizing }) => {
  // 이미지 URL을 절대 경로로 변환하는 함수
  const convertImageUrls = (html: string, baseUrl: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // 모든 img 태그의 src를 절대 경로로 변환
    const images = doc.querySelectorAll('img')
    images.forEach(img => {
      const src = img.getAttribute('src')
      if (src) {
        try {
          // 상대 경로를 절대 경로로 변환
          const absoluteUrl = new URL(src, baseUrl).href
          img.setAttribute('src', absoluteUrl)
        } catch (error) {
          console.log('이미지 URL 변환 실패:', src)
        }
      }
    })
    
    return doc.body.innerHTML
  }

  // 대표 이미지 추출 함수 (og:image > 본문 첫 img)
  const extractMainImage = (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    // og:image 우선
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
    if (ogImage) return ogImage
    // 본문 내 첫 번째 img
    const firstImg = doc.querySelector('article img, main img, .content img, .post-content img, .article-content img, .entry-content img, img') as HTMLImageElement | null
    if (firstImg && firstImg.src) return firstImg.src
    return null
  }

  // Readability를 사용하여 깔끔한 콘텐츠 추출
  const extractReadableContent = (html: string): ReadableContent => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const reader = new Readability(doc)
      const article = reader.parse()
      if (article && article.content) {
        // Readability 결과에서 이미지 개수 확인
        const articleDoc = parser.parseFromString(article.content, 'text/html')
        const articleImages = articleDoc.querySelectorAll('img')
        // 대표 이미지 추출 (Readability 결과에 이미지 없으면 원본에서 추출)
        let mainImage: string | null = null
        if (articleImages.length > 0) {
          mainImage = (articleImages[0] as HTMLImageElement).src
        } else {
          mainImage = extractMainImage(html)
        }
        // 이미지 URL을 절대 경로로 변환
        const contentWithAbsoluteImages = convertImageUrls(article.content, currentUrl || '')
        return {
          title: article.title ?? '제목 없음',
          content: contentWithAbsoluteImages ?? '',
          excerpt: article.excerpt ?? '',
          siteName: article.siteName ?? '',
          byline: article.byline ?? '',
          length: article.length ?? 0,
          mainImage
        }
      }
      // Readability 실패 시 최소한의 본문만
      return {
        title: doc.querySelector('h1')?.textContent?.trim() || doc.querySelector('title')?.textContent?.trim() || '제목 없음',
        content: '',
        excerpt: '',
        siteName: '',
        byline: '',
        length: 0,
        mainImage: extractMainImage(html)
      }
    } catch (error) {
      return {
        title: '제목 없음',
        content: '',
        excerpt: '',
        siteName: '',
        byline: '',
        length: 0,
        mainImage: null
      }
    }
  }

  // 원본 콘텐츠를 Readability로 파싱 (HTML이 있으면 HTML 사용, 없으면 텍스트 사용)
  const readableContent = extractReadableContent(contentData.originalHtml || contentData.originalContent)

  // 요약 프롬프트 상태
  const [userPrompt, setUserPrompt] = useState('')

  const handleResummarize = () => {
    if (onResummarize && userPrompt.trim()) {
      onResummarize(userPrompt.trim())
    }
  }

  // 원본 링크 열기
  const openOriginalLink = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank')
    }
  }

  const items = [
    {
      key: 'summary',
      label: (
        <Space>
          <FileTextOutlined />
          요약본
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          {isResummarizing ? (
            <div style={{ textAlign: 'center', margin: '32px 0' }}>
              <Spin tip="요약 중..." />
            </div>
          ) : (
            <ReactMarkdown>{contentData.summary}</ReactMarkdown>
          )}
          {/* 유저 프롬프트 입력창 및 버튼 - 하단으로 이동 */}
          <div style={{ marginTop: 24 }}>
            <TextArea
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              placeholder="요약에 추가로 반영할 요청사항을 입력하세요"
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={isResummarizing}
              style={{ marginBottom: 8 }}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleResummarize}
              loading={isResummarizing}
              disabled={!userPrompt.trim() || isResummarizing}
            >
              요약 다시하기
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'original',
      label: (
        <Space>
          <LinkOutlined />
          원본
        </Space>
      ),
      children: (
        <div style={{ padding: '16px 0' }}>
          <div style={{ 
            background: '#fff', 
            padding: 32, 
            borderRadius: 12, 
            border: '1px solid #f0f0f0',
            maxWidth: 700,
            margin: '0 auto',
            overflowY: 'auto',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            {/* 원본 링크 버튼 - 최상단 */}
            <div style={{ 
              marginBottom: 24, 
              textAlign: 'right',
            }}>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={openOriginalLink}
                size="middle"
                style={{ 
                  padding: '6px 18px',
                  height: 'auto',
                  fontSize: '15px',
                  borderRadius: 6
                }}
              >
                원본 링크 열기
              </Button>
            </div>
            {/* 대표 이미지 */}
            {readableContent.mainImage && (
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <img src={readableContent.mainImage} alt="대표 이미지" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
              </div>
            )}
            {/* 제목 */}
            <Title level={1} style={{ 
              marginBottom: 16, 
              color: '#262626',
              fontSize: '28px',
              lineHeight: '1.3',
              fontWeight: 'bold'
            }}>
              {readableContent.title}
            </Title>
            {/* 부제목/요약 */}
            {readableContent.excerpt && (
              <div style={{ 
                marginBottom: 24, 
                color: '#595959',
                fontSize: '18px',
                lineHeight: '1.6',
                fontStyle: 'italic',
                borderLeft: '4px solid #1890ff',
                paddingLeft: '16px'
              }}>
                {readableContent.excerpt}
              </div>
            )}
            {/* 메타 정보 */}
            {(readableContent.siteName || readableContent.byline) && (
              <div style={{ 
                marginBottom: 24, 
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: 8,
                fontSize: '14px',
                color: '#666'
              }}>
                {readableContent.siteName && (
                  <div style={{ marginBottom: 4 }}>
                    <strong>사이트:</strong> {readableContent.siteName}
                  </div>
                )}
                {readableContent.byline && (
                  <div>
                    <strong>작성자:</strong> {readableContent.byline}
                  </div>
                )}
              </div>
            )}
            {/* 본문 */}
            <div 
              style={{ 
                fontSize: '18px',
                lineHeight: '1.8',
                color: '#262626',
                wordBreak: 'keep-all'
              }}
              dangerouslySetInnerHTML={{ __html: readableContent.content || '' }}
            />
          </div>
        </div>
      )
    }
  ]

  return (
    <Card>
      <Tabs 
        defaultActiveKey="summary" 
        items={items}
        size="large"
      />
    </Card>
  )
}

export default ContentTabs 