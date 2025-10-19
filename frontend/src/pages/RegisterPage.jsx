import React from 'react'
import { Link } from 'react-router-dom'
import RegisterForm from '../components/RegisterForm'

const RegisterPage = () => {
  return (
    <div className="page-container">
      <div className="form-container">
        <h2 className="form-title">用户注册</h2>
        <RegisterForm />
        <div className="form-footer">
          <Link to="/login">已有账号？立即登录</Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage