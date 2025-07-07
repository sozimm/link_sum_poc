import React from 'react'

interface AnalysisHistory {
  id: string
  url: string
  title: string
  summary: string
  originalContent: string
  createdAt: string
}

interface HistoryLNBProps {
  history: AnalysisHistory[]
  onSelectHistory: (history: AnalysisHistory) => void
  onDeleteHistory: (id: string) => void
  selectedHistoryId?: string
}

const HistoryLNB: React.FC<HistoryLNBProps> = ({ 
  history, 
  onSelectHistory, 
  onDeleteHistory, 
  selectedHistoryId 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <div className="history-lnb">
      <div className="history-title">분석 히스토리</div>
      <ul className="history-list">
        {history.length === 0 ? (
          <li style={{textAlign: 'center', color: '#888', padding: '32px 0'}}>
            아직 분석 기록이 없습니다<br />
            URL을 입력하여 첫 번째 분석을 시작해보세요!
          </li>
        ) : (
          history.map((item) => (
            <li
              key={item.id}
              className={`history-item${selectedHistoryId === item.id ? ' selected' : ''}`}
              onClick={() => onSelectHistory(item)}
            >
              <div style={{fontWeight: 500, marginBottom: 4}}>{item.title || getDomainFromUrl(item.url)}</div>
              <div style={{fontSize: 12, color: '#888', marginBottom: 2}}>{getDomainFromUrl(item.url)}</div>
              <div style={{fontSize: 11, color: '#bbb'}}>{formatDate(item.createdAt)}</div>
              <button
                onClick={e => { e.stopPropagation(); onDeleteHistory(item.id); }}
                style={{float: 'right', background: 'none', border: 'none', color: '#b71c1c', fontSize: 12, cursor: 'pointer'}}
                title="삭제"
              >
                삭제
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

export default HistoryLNB 