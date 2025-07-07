export interface ContentData {
  summary: string
  originalContent: string
  originalHtml?: string
  title?: string
  url?: string
}

export interface AnalysisHistory {
  id: string
  url: string
  title: string
  summary: string
  originalContent: string
  originalHtml: string
  createdAt: string
}

export interface UrlInputProps {
  onSubmit: (url: string) => void
}

export interface ContentTabsProps {
  contentData: ContentData
  currentUrl?: string
}

export interface LoadingSpinnerProps {
  // 현재는 props가 없지만 향후 확장 가능
} 