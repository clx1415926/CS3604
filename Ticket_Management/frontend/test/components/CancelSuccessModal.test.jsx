/**
 * 测试范围：CancelSuccessModal
 * - 验证取消成功弹窗的基础渲染是否正确
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CancelSuccessModal from '../../src/components/CancelSuccessModal';

describe('Feature: CancelSuccessModal', () => {
  it('should render success text and confirm button', () => {
    // 场景：弹窗组件渲染
    render(<CancelSuccessModal />);

    // 断言：展示“取消订单成功”提示与“确定”按钮
    expect(screen.getByText('取消订单成功')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
  });
});

