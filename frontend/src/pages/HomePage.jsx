import React from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { LoginOutlined, UserAddOutlined } from '@ant-design/icons'

const HomePage = () => {
  const navigate = useNavigate()

  return (
    <div className="page-container">
      <div className="home-container">
        <h1 className="home-title">12306 铁路客票服务</h1>
        <p className="home-subtitle">中国铁路客户服务中心</p>
        <div className="home-actions">
          <Button 
            type="primary" 
            size="large" 
            icon={<LoginOutlined />}
            onClick={() => navigate('/login')}
          >
            登录
          </Button>
          <Button 
            size="large" 
            icon={<UserAddOutlined />}
            onClick={() => navigate('/register')}
          >
            注册
          </Button>
        </div>
      </div>
    </div>
  )
}

export default HomePage