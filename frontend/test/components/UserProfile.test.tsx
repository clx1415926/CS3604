import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UserProfile from '../../src/components/UserProfile.jsx';

// Mock API calls
const mockGetUserProfile = vi.fn();
const mockUpdateUserProfile = vi.fn();
const mockUploadAvatar = vi.fn();
const mockGetUserTravelHistory = vi.fn();
const mockGetUserPreferences = vi.fn();
const mockUpdateUserPreferences = vi.fn();

vi.mock('../../src/api/user', () => ({
  getUserProfile: mockGetUserProfile,
  updateUserProfile: mockUpdateUserProfile,
  uploadAvatar: mockUploadAvatar,
  getUserTravelHistory: mockGetUserTravelHistory,
  getUserPreferences: mockGetUserPreferences,
  updateUserPreferences: mockUpdateUserPreferences,
}));

describe('UserProfile Component Tests', () => {
  const mockOnProfileUpdate = vi.fn();
  const mockOnAvatarChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的用户资料响应
    mockGetUserProfile.mockResolvedValue({
      id: 'user123',
      nickname: '张三',
      realName: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      idCard: '110101199001011234',
      avatar: 'https://example.com/avatar.jpg',
      gender: 'male',
      birthday: '1990-01-01',
      address: '北京市朝阳区',
      emergencyContact: {
        name: '李四',
        phone: '13900139000',
        relationship: 'spouse'
      },
      verificationStatus: {
        phone: true,
        email: true,
        idCard: true,
        realName: true
      },
      memberLevel: 'gold',
      points: 12580,
      registrationDate: '2020-01-15T10:30:00Z',
      lastLoginTime: '2025-01-20T08:45:00Z'
    });

    mockGetUserTravelHistory.mockResolvedValue({
      totalTrips: 156,
      totalDistance: 125600,
      favoriteRoutes: [
        { from: '北京', to: '上海', count: 12 },
        { from: '北京', to: '广州', count: 8 }
      ],
      recentTrips: [
        {
          id: 'trip001',
          trainNumber: 'G1',
          from: '北京南',
          to: '上海虹桥',
          date: '2025-01-18',
          seatType: '二等座'
        }
      ]
    });

    mockGetUserPreferences.mockResolvedValue({
      preferredSeatTypes: ['二等座', '一等座'],
      preferredTrainTypes: ['高速动车', '动车'],
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      privacy: {
        showTravelHistory: false,
        allowRecommendations: true
      },
      language: 'zh-CN',
      theme: 'light'
    });

    mockUpdateUserProfile.mockResolvedValue({ success: true });
    mockUploadAvatar.mockResolvedValue({ 
      success: true, 
      avatarUrl: 'https://example.com/new-avatar.jpg' 
    });
    mockUpdateUserPreferences.mockResolvedValue({ success: true });
  });

  describe('组件渲染测试', () => {
    it('应该渲染用户资料标题', () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      expect(screen.getByText('个人资料')).toBeInTheDocument();
    });

    it('应该渲染编辑按钮', () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      expect(screen.getByRole('button', { name: /编辑资料/i })).toBeInTheDocument();
    });

    it('应该渲染保存按钮（编辑模式下）', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      // 进入编辑模式
      const editButton = screen.getByRole('button', { name: /编辑资料/i });
      fireEvent.click(editButton);

      expect(screen.getByRole('button', { name: /保存/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();
    });

    it('初始加载时应显示加载状态', () => {
      mockGetUserProfile.mockImplementation(() => new Promise(() => {})); // 永不resolve

      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('正在加载用户资料...')).toBeInTheDocument();
    });
  });

  describe('用户资料数据加载测试', () => {
    it('组件挂载时应调用API获取用户资料', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(mockGetUserProfile).toHaveBeenCalled();
        expect(mockGetUserTravelHistory).toHaveBeenCalled();
        expect(mockGetUserPreferences).toHaveBeenCalled();
      });
    });

    it('应该显示用户基本信息', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('13800138000')).toBeInTheDocument();
        expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
        expect(screen.getByText('110101199001011234')).toBeInTheDocument();
      });
    });

    it('应该显示用户头像', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const avatar = screen.getByRole('img', { name: /用户头像/i });
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      });
    });

    it('应该显示会员等级和积分', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('黄金会员')).toBeInTheDocument();
        expect(screen.getByText('12,580积分')).toBeInTheDocument();
      });
    });

    it('应该显示注册时间和最后登录时间', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('2020-01-15')).toBeInTheDocument();
        expect(screen.getByText('2025-01-20 08:45')).toBeInTheDocument();
      });
    });
  });

  describe('认证状态显示测试', () => {
    it('应该显示各项认证状态', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('phone-verified')).toBeInTheDocument();
        expect(screen.getByTestId('email-verified')).toBeInTheDocument();
        expect(screen.getByTestId('idcard-verified')).toBeInTheDocument();
        expect(screen.getByTestId('realname-verified')).toBeInTheDocument();
      });
    });

    it('已认证项目应显示绿色勾选标识', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('phone-verified')).toHaveClass('verified');
        expect(screen.getByTestId('email-verified')).toHaveClass('verified');
        expect(screen.getByTestId('idcard-verified')).toHaveClass('verified');
        expect(screen.getByTestId('realname-verified')).toHaveClass('verified');
      });
    });

    it('未认证项目应显示待认证状态', async () => {
      mockGetUserProfile.mockResolvedValue({
        ...mockGetUserProfile.mockResolvedValue(),
        verificationStatus: {
          phone: true,
          email: false,
          idCard: false,
          realName: true
        }
      });

      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('email-unverified')).toBeInTheDocument();
        expect(screen.getByTestId('idcard-unverified')).toBeInTheDocument();
      });
    });

    it('应该显示认证完成度', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('认证完成度: 100%')).toBeInTheDocument();
      });
    });
  });

  describe('出行统计显示测试', () => {
    it('应该显示出行统计信息', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('总出行次数: 156次')).toBeInTheDocument();
        expect(screen.getByText('总里程: 125,600公里')).toBeInTheDocument();
      });
    });

    it('应该显示常用路线', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('北京 → 上海 (12次)')).toBeInTheDocument();
        expect(screen.getByText('北京 → 广州 (8次)')).toBeInTheDocument();
      });
    });

    it('应该显示最近出行记录', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('G1')).toBeInTheDocument();
        expect(screen.getByText('北京南 → 上海虹桥')).toBeInTheDocument();
        expect(screen.getByText('2025-01-18')).toBeInTheDocument();
        expect(screen.getByText('二等座')).toBeInTheDocument();
      });
    });
  });

  describe('头像上传功能测试', () => {
    it('应该显示头像上传按钮', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /更换头像/i })).toBeInTheDocument();
      });
    });

    it('点击更换头像应触发文件选择', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /更换头像/i });
        fireEvent.click(uploadButton);
      });

      expect(screen.getByTestId('avatar-file-input')).toBeInTheDocument();
    });

    it('选择头像文件应调用上传API', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const fileInput = screen.getByTestId('avatar-file-input');
        const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(mockUploadAvatar).toHaveBeenCalledWith(expect.any(File));
      });
    });

    it('头像上传成功应更新显示并调用回调', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const fileInput = screen.getByTestId('avatar-file-input');
        const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        const avatar = screen.getByRole('img', { name: /用户头像/i });
        expect(avatar).toHaveAttribute('src', 'https://example.com/new-avatar.jpg');
        expect(mockOnAvatarChange).toHaveBeenCalledWith('https://example.com/new-avatar.jpg');
      });
    });

    it('应该验证头像文件格式', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const fileInput = screen.getByTestId('avatar-file-input');
        const file = new File(['document'], 'document.pdf', { type: 'application/pdf' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('请选择图片文件（JPG、PNG、GIF）')).toBeInTheDocument();
      });

      expect(mockUploadAvatar).not.toHaveBeenCalled();
    });

    it('应该验证头像文件大小', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const fileInput = screen.getByTestId('avatar-file-input');
        // 创建一个超过5MB的文件
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
        
        fireEvent.change(fileInput, { target: { files: [largeFile] } });
      });

      await waitFor(() => {
        expect(screen.getByText('头像文件大小不能超过5MB')).toBeInTheDocument();
      });

      expect(mockUploadAvatar).not.toHaveBeenCalled();
    });
  });

  describe('资料编辑功能测试', () => {
    it('点击编辑按钮应进入编辑模式', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑资料/i });
        fireEvent.click(editButton);
      });

      // 应该显示输入框而不是静态文本
      expect(screen.getByDisplayValue('张三')).toBeInTheDocument();
      expect(screen.getByDisplayValue('zhangsan@example.com')).toBeInTheDocument();
    });

    it('编辑模式下应该显示所有可编辑字段', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑资料/i });
        fireEvent.click(editButton);
      });

      expect(screen.getByLabelText('昵称')).toBeInTheDocument();
      expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
      expect(screen.getByLabelText('性别')).toBeInTheDocument();
      expect(screen.getByLabelText('生日')).toBeInTheDocument();
      expect(screen.getByLabelText('地址')).toBeInTheDocument();
    });

    it('应该验证必填字段', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑资料/i });
        fireEvent.click(editButton);
      });

      // 清空昵称
      const nicknameInput = screen.getByLabelText('昵称');
      fireEvent.change(nicknameInput, { target: { value: '' } });

      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('昵称不能为空')).toBeInTheDocument();
      });

      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('应该验证邮箱格式', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑资料/i });
        fireEvent.click(editButton);
      });

      const emailInput = screen.getByLabelText('邮箱');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
      });

      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('保存成功应调用API并退出编辑模式', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑资料/i });
        fireEvent.click(editButton);
      });

      const nicknameInput = screen.getByLabelText('昵称');
      fireEvent.change(nicknameInput, { target: { value: '新昵称' } });

      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateUserProfile).toHaveBeenCalledWith({
          nickname: '新昵称',
          email: 'zhangsan@example.com',
          gender: 'male',
          birthday: '1990-01-01',
          address: '北京市朝阳区'
        });
      });

      await waitFor(() => {
        expect(mockOnProfileUpdate).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /编辑资料/i })).toBeInTheDocument();
      });
    });

    it('点击取消应退出编辑模式且不保存', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑资料/i });
        fireEvent.click(editButton);
      });

      const nicknameInput = screen.getByLabelText('昵称');
      fireEvent.change(nicknameInput, { target: { value: '新昵称' } });

      const cancelButton = screen.getByRole('button', { name: /取消/i });
      fireEvent.click(cancelButton);

      expect(mockUpdateUserProfile).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /编辑资料/i })).toBeInTheDocument();
      expect(screen.getByText('张三')).toBeInTheDocument(); // 应该恢复原值
    });
  });

  describe('紧急联系人管理测试', () => {
    it('应该显示紧急联系人信息', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('紧急联系人')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
        expect(screen.getByText('13900139000')).toBeInTheDocument();
        expect(screen.getByText('配偶')).toBeInTheDocument();
      });
    });

    it('应该提供编辑紧急联系人功能', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑紧急联系人/i });
        fireEvent.click(editButton);
      });

      expect(screen.getByLabelText('联系人姓名')).toBeInTheDocument();
      expect(screen.getByLabelText('联系人电话')).toBeInTheDocument();
      expect(screen.getByLabelText('关系')).toBeInTheDocument();
    });

    it('应该验证紧急联系人电话格式', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑紧急联系人/i });
        fireEvent.click(editButton);
      });

      const phoneInput = screen.getByLabelText('联系人电话');
      fireEvent.change(phoneInput, { target: { value: '123' } });

      const saveButton = screen.getByRole('button', { name: /保存联系人/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('请输入有效的手机号码')).toBeInTheDocument();
      });
    });
  });

  describe('偏好设置测试', () => {
    it('应该显示用户偏好设置', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('偏好设置')).toBeInTheDocument();
        expect(screen.getByText('首选座位类型')).toBeInTheDocument();
        expect(screen.getByText('首选列车类型')).toBeInTheDocument();
      });
    });

    it('应该显示通知设置', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('通知设置')).toBeInTheDocument();
        expect(screen.getByLabelText('邮件通知')).toBeChecked();
        expect(screen.getByLabelText('短信通知')).toBeChecked();
        expect(screen.getByLabelText('推送通知')).toBeChecked();
      });
    });

    it('应该显示隐私设置', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('隐私设置')).toBeInTheDocument();
        expect(screen.getByLabelText('显示出行历史')).not.toBeChecked();
        expect(screen.getByLabelText('允许个性化推荐')).toBeChecked();
      });
    });

    it('修改偏好设置应调用API', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const emailNotification = screen.getByLabelText('邮件通知');
        fireEvent.click(emailNotification);
      });

      await waitFor(() => {
        expect(mockUpdateUserPreferences).toHaveBeenCalledWith({
          notifications: {
            email: false,
            sms: true,
            push: true
          }
        });
      });
    });
  });

  describe('标签页切换测试', () => {
    it('应该显示标签页导航', () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      expect(screen.getByRole('tab', { name: '基本信息' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '出行统计' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '偏好设置' })).toBeInTheDocument();
    });

    it('默认应该显示基本信息标签页', () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      expect(screen.getByRole('tab', { name: '基本信息' })).toHaveAttribute('aria-selected', 'true');
    });

    it('点击标签页应切换内容', async () => {
      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      const travelTab = screen.getByRole('tab', { name: '出行统计' });
      fireEvent.click(travelTab);

      await waitFor(() => {
        expect(screen.getByText('总出行次数: 156次')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理测试', () => {
    it('API调用失败时应显示错误信息', async () => {
      mockGetUserProfile.mockRejectedValue(new Error('网络错误'));

      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByText('加载用户资料失败')).toBeInTheDocument();
        expect(screen.getByText('网络连接异常，请检查网络后重试')).toBeInTheDocument();
      });
    });

    it('更新资料失败时应显示错误提示', async () => {
      mockUpdateUserProfile.mockRejectedValue(new Error('更新失败'));

      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /编辑资料/i });
        fireEvent.click(editButton);
      });

      const saveButton = screen.getByRole('button', { name: /保存/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('更新资料失败，请重试')).toBeInTheDocument();
      });
    });

    it('头像上传失败时应显示错误提示', async () => {
      mockUploadAvatar.mockRejectedValue(new Error('上传失败'));

      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const fileInput = screen.getByTestId('avatar-file-input');
        const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('头像上传失败，请重试')).toBeInTheDocument();
      });
    });

    it('错误状态时应提供重试按钮', async () => {
      mockGetUserProfile.mockRejectedValue(new Error('网络错误'));

      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
      });
    });
  });

  describe('响应式设计测试', () => {
    it('应该在移动端自适应显示', () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      const container = screen.getByTestId('user-profile-container');
      expect(container).toHaveClass('mobile-responsive');
    });

    it('移动端应该使用垂直布局', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<UserProfile onProfileUpdate={mockOnProfileUpdate} onAvatarChange={mockOnAvatarChange} />);

      await waitFor(() => {
        const profileLayout = screen.getByTestId('profile-layout');
        expect(profileLayout).toHaveClass('vertical-layout');
      });
    });
  });
});