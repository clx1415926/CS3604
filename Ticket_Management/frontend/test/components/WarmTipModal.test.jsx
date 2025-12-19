/**
 * 测试范围：WarmTipModal
 * - 验证温馨提示弹窗的渲染与按钮回调
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import WarmTipModal from '../../src/components/WarmTipModal';

describe('Feature: WarmTipModal', () => {
  it('should render title/content and call onConfirm', () => {
    // 场景：仅提供确认回调（无取消按钮）
    const onConfirm = vi.fn();
    render(<WarmTipModal onConfirm={onConfirm} />);

    // 断言：标题与内容存在
    expect(screen.getByText('温馨提示')).toBeInTheDocument();
    expect(screen.getByText(/请确认乘车人身份信息真实有效/)).toBeInTheDocument();

    // 交互：点击“确认”
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    // 断言：触发 onConfirm
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // 断言：未传入 onCancel 时不渲染“取消”按钮
    expect(screen.queryByRole('button', { name: '取消' })).toBeNull();
  });

  it('should call onCancel when cancel button is clicked', () => {
    // 场景：提供取消回调时，弹窗应渲染“取消”按钮
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<WarmTipModal onConfirm={onConfirm} onCancel={onCancel} />);

    // 交互：点击“取消”
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    // 断言：触发 onCancel（且不影响 onConfirm）
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(0);
  });
});

