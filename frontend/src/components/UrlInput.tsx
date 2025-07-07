import React, { useState } from 'react'
import { Input, Button, Form, Space, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

interface UrlInputProps {
  onSubmit: (url: string) => void
}

const UrlInput: React.FC<UrlInputProps> = ({ onSubmit }) => {
  const [form] = Form.useForm()

  const handleSubmit = (values: { url: string }) => {
    if (values.url?.trim()) {
      onSubmit(values.url.trim())
      form.resetFields()
    }
  }

  return (
    <Card style={{ marginBottom: 24 }}>
      <Form form={form} onFinish={handleSubmit}>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name="url"
            style={{ flex: 1, margin: 0 }}
            rules={[
              { required: true, message: 'URL을 입력해주세요' },
              { type: 'url', message: '유효한 URL을 입력해주세요' }
            ]}
          >
            <Input
              size="large"
              placeholder="분석할 URL을 입력하세요 (예: https://example.com)"
              prefix={<SearchOutlined />}
            />
          </Form.Item>
          <Form.Item style={{ margin: 0 }}>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              icon={<SearchOutlined />}
            >
              분석하기
            </Button>
          </Form.Item>
        </Space.Compact>
      </Form>
    </Card>
  )
}

export default UrlInput 