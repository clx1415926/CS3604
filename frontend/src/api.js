import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401未授权错误
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      // 可以在这里触发登录页面跳转
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 用户登录
  login: async (loginData) => {
    console.log('API调用 - 登录数据:', loginData);
    try {
      const response = await api.post('/auth/login', loginData);
      console.log('API响应 - 登录成功:', response);
      return response.data;
    } catch (error) {
      console.error('API错误 - 登录失败:', error);
      throw error;
    }
  },

  // 发送验证码
  sendVerificationCode: async (data) => {
    const response = await api.post('/auth/send-code', data);
    return response.data;
  },

  // 重置密码
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  // 用户登出
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default api;