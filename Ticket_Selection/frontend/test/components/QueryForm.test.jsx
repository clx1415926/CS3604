import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QueryForm from '../../src/components/QueryForm';

// 查询表单：验证输入校验、提交 payload、出发/到达站交换
describe('Feature: Query form', () => {
  // 提交时若出发/到达站不在建议列表里，应阻止提交并展示错误提示
  test('should validate stations against suggestions list on submit', () => {
    const onQuery = jest.fn();
    render(
      <QueryForm
        onQuery={onQuery}
        stations={['北京', '上海', '广州', '深圳']}
        disabled={false}
        initialFrom=""
        initialTo=""
        initialDate="2025-12-15"
      />
    );

    fireEvent.change(screen.getByLabelText('出发地'), { target: { value: '不存在' } });
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: '上海' } });
    fireEvent.click(screen.getByRole('button', { name: '查询' }));

    expect(onQuery).not.toHaveBeenCalled();
    expect(screen.getByText('出发地或目的地无效，请从建议列表中选择。')).toBeInTheDocument();
  });

  // 输入有效时应调用 onQuery，并传递后端所需查询参数结构
  test('should submit query payload when inputs are valid', () => {
    const onQuery = jest.fn();
    render(
      <QueryForm
        onQuery={onQuery}
        stations={['北京', '上海', '广州', '深圳']}
        disabled={false}
        initialFrom=""
        initialTo=""
        initialDate="2025-12-15"
      />
    );

    fireEvent.change(screen.getByLabelText('出发地'), { target: { value: '北京' } });
    fireEvent.change(screen.getByLabelText('目的地'), { target: { value: '上海' } });
    fireEvent.change(screen.getByLabelText('出发日'), { target: { value: '2025-12-15' } });
    fireEvent.click(screen.getByRole('button', { name: '查询' }));

    expect(onQuery).toHaveBeenCalledWith({ fromStation: '北京', toStation: '上海', departDate: '2025-12-15' });
  });

  // 点击交换按钮应互换出发地与目的地输入值
  test('should swap from/to when clicking swap button', () => {
    const onQuery = jest.fn();
    render(
      <QueryForm
        onQuery={onQuery}
        stations={['北京', '上海', '广州', '深圳']}
        disabled={false}
        initialFrom="北京"
        initialTo="上海"
        initialDate="2025-12-15"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '⇄' }));

    expect(screen.getByLabelText('出发地')).toHaveValue('上海');
    expect(screen.getByLabelText('目的地')).toHaveValue('北京');
  });
});
