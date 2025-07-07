import React from 'react'
import { Spin, Card } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const LoadingSpinner: React.FC = () => {
  return (
    <Card style={{ textAlign: 'center', padding: '32px' }}>
      <Spin 
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
        tip="분석 중..."
      />
    </Card>
  )
}

export default LoadingSpinner 