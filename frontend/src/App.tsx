import React, { useState, useEffect } from 'react'
import { Layout, Typography, Button, Modal, List, Card, Tabs, Spin, Alert, Space, Tag, Divider } from 'antd'
import { UserOutlined, LinkOutlined, HistoryOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons'
import UrlInput from './components/UrlInput'
import ContentTabs from './components/ContentTabs'
import LoadingSpinner from './components/LoadingSpinner'
import { ContentData } from './types'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

interface AnalysisHistory {
  id: string
  url: string
  title: string
  summary: string
  originalContent: string
  originalHtml: string
  createdAt: string
}

const USER_IDS = [
  'user01', 'user02', 'user03', 'user04', 'user05',
  'user06', 'user07', 'user08', 'user09', 'user10'
]

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [contentData, setContentData] = useState<ContentData | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<AnalysisHistory[]>([])
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showIdModal, setShowIdModal] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isResummarizing, setIsResummarizing] = useState(false)

  // 유저 ID 로드
  useEffect(() => {
    const savedId = localStorage.getItem('userId')
    if (savedId && USER_IDS.includes(savedId)) {
      setUserId(savedId)
    } else {
      setShowIdModal(true)
    }
  }, [])

  // 히스토리 로드 (ID별)
  useEffect(() => {
    if (!userId) return
    const savedHistory = localStorage.getItem(`analysisHistory_${userId}`)
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('히스토리 로드 실패:', error)
      }
    } else {
      setHistory([])
    }
  }, [userId])

  // 히스토리 저장 (ID별)
  const saveHistory = (newHistory: AnalysisHistory[]) => {
    setHistory(newHistory)
    if (userId) {
      localStorage.setItem(`analysisHistory_${userId}`, JSON.stringify(newHistory))
    }
  }

  const handleUrlSubmit = async (url: string) => {
    setIsLoading(true)
    setError(null)
    setCurrentUrl(url)
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'URL 처리 중 오류가 발생했습니다.')
      }

      const data = await response.json()
      setContentData(data)

      // 히스토리에 추가 (originalHtml 포함)
      const newHistoryItem: AnalysisHistory = {
        id: Date.now().toString(),
        url,
        title: data.title || new URL(url).hostname,
        summary: data.summary,
        originalContent: data.originalContent,
        originalHtml: data.originalHtml,
        createdAt: new Date().toISOString()
      }

      const updatedHistory = [newHistoryItem, ...history]
      saveHistory(updatedHistory)
      setSelectedHistoryId(newHistoryItem.id)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectHistory = (historyItem: AnalysisHistory) => {
    setContentData({
      summary: historyItem.summary,
      originalContent: historyItem.originalContent,
      originalHtml: historyItem.originalHtml
    })
    setCurrentUrl(historyItem.url)
    setSelectedHistoryId(historyItem.id)
    setError(null)
  }

  const handleDeleteHistory = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id)
    saveHistory(updatedHistory)
    
    if (selectedHistoryId === id) {
      setContentData(null)
      setSelectedHistoryId(null)
    }
  }

  // 유저 ID 선택
  const handleIdSelect = (id: string) => {
    setUserId(id)
    localStorage.setItem('userId', id)
    setShowIdModal(false)
  }

  // ID 변경
  const handleChangeId = () => {
    setShowIdModal(true)
  }

  // 원본 링크 열기
  const openOriginalLink = (url: string) => {
    window.open(url, '_blank')
  }

  // 요약 재요청 핸들러
  const handleResummarize = async (prompt: string) => {
    if (!contentData || !currentUrl) return
    setIsResummarizing(true)
    setError(null)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: currentUrl, userPrompt: prompt })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '요약 재요청 중 오류가 발생했습니다.')
      }
      const data = await response.json()
      setContentData(data)
      // 히스토리 갱신 (해당 id만 업데이트)
      if (selectedHistoryId) {
        const updatedHistory = history.map(item =>
          item.id === selectedHistoryId
            ? { ...item, summary: data.summary }
            : item
        )
        saveHistory(updatedHistory)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '요약 재요청 중 오류가 발생했습니다.')
    } finally {
      setIsResummarizing(false)
    }
  }

  if (!userId || showIdModal) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        background: '#f0f2f5',
        padding: '16px'
      }}>
        <Card 
          style={{ 
            width: '100%', 
            maxWidth: 400,
            textAlign: 'center'
          }}
          title={
            <Space>
              <UserOutlined />
              <span>ID를 선택하세요</span>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {USER_IDS.map((id) => (
              <Button
                key={id}
                type="primary"
                size="large"
                block
                onClick={() => handleIdSelect(id)}
                icon={<UserOutlined />}
              >
                {id}
              </Button>
            ))}
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 모바일에서는 사이드바를 숨김 */}
      <Sider 
        breakpoint="lg" 
        collapsedWidth="0"
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0'
        }}
      >
        <div style={{ padding: '16px' }}>
          <Title level={5} style={{ margin: 0, marginBottom: '16px' }}>
            저장된 링크
          </Title>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#999' }}>
              <HistoryOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div>아직 분석 기록이 없습니다</div>
              <div style={{ fontSize: '12px' }}>URL을 입력하여 첫 번째 분석을 시작해보세요!</div>
            </div>
          ) : (
            <List
              dataSource={history}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: selectedHistoryId === item.id ? '#f0f7ff' : 'transparent',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onClick={() => handleSelectHistory(item)}
                  actions={[]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ fontSize: '14px', fontWeight: 500, position: 'relative' }}>
                        {item.title || new URL(item.url).hostname}
                        <Button
                          key="delete"
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteHistory(item.id)
                          }}
                          style={{
                            width: 24,
                            height: 24,
                            minWidth: 0,
                            minHeight: 0,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            position: 'absolute',
                            right: 0,
                            bottom: -32,
                            boxShadow: 'none',
                            background: 'none',
                            zIndex: 2
                          }}
                        />
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new URL(item.url).hostname}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {new Date(item.createdAt).toLocaleString('ko-KR')}
                        </Text>
                        <Button
                          type="link"
                          size="small"
                          icon={<LinkOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            openOriginalLink(item.url)
                          }}
                          style={{ padding: 0, height: 'auto' }}
                        >
                          원본 링크
                        </Button>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Sider>

      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              POC Service
            </Title>
            <Tag color="blue" style={{ marginLeft: '12px' }}>
              <UserOutlined /> {userId}
            </Tag>
          </div>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={handleChangeId}
          >
            ID 변경
          </Button>
        </Header>

        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <UrlInput onSubmit={handleUrlSubmit} />
            
            {error && (
              <Alert
                message="오류"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            {isLoading && <LoadingSpinner />}
            
            {contentData && !isLoading && (
              <ContentTabs
                contentData={contentData}
                currentUrl={currentUrl}
                onResummarize={handleResummarize}
                isResummarizing={isResummarizing}
              />
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
