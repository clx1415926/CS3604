import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FilterPanel from '../../src/components/FilterPanel';

// 筛选面板：验证筛选条件变更时对外 emit 的 payload，以及初始化/重置行为
describe('Feature: Filter panel', () => {
  // 勾选车次类型时，应触发 onFilterChange，trainTypes 中包含对应类型
  test('should emit filter payload when toggling train type', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        onFilterChange={onFilterChange}
        availableFromStations={[]}
        availableToStations={[]}
        initialTrainTypes={[]}
        initialStudent={false}
      />
    );

    fireEvent.click(screen.getByLabelText('高铁 (G)'));

    await waitFor(() => {
      const last = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1][0];
      expect(last).toEqual({ trainTypes: ['G'], seatTypes: [], fromStations: [], toStations: [], student: '0' });
    });
  });

  // initialTrainTypes/initialStudent 生效：组件挂载后应自动勾选对应 checkbox
  test('should apply initial train types and student selection', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        onFilterChange={onFilterChange}
        availableFromStations={[]}
        availableToStations={[]}
        initialTrainTypes={['G', 'D']}
        initialStudent={true}
      />
    );

    await waitFor(() => {
      const g = screen.getByLabelText('高铁 (G)');
      const d = screen.getByLabelText('动车 (D)');
      const student = screen.getByLabelText('学生');
      expect(g).toBeChecked();
      expect(d).toBeChecked();
      expect(student).toBeChecked();
    });
  });

  // 出发车站的“全部”开关：应一次性选中所有 availableFromStations 并发出更新
  test('should select all available from-stations with the "全部" toggle', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        onFilterChange={onFilterChange}
        availableFromStations={['北京南站', '北京西站']}
        availableToStations={[]}
        initialTrainTypes={[]}
        initialStudent={false}
      />
    );

    const allFrom = screen.getAllByLabelText('全部')[0];
    fireEvent.click(allFrom);

    await waitFor(() => {
      const last = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1][0];
      expect(last.fromStations).toEqual(['北京南站', '北京西站']);
    });
  });

  // 点击“重置”应清空所有筛选项（trainTypes/student 等），并发出空 payload
  test('should reset all filters when clicking reset button', async () => {
    const onFilterChange = jest.fn();
    render(
      <FilterPanel
        onFilterChange={onFilterChange}
        availableFromStations={['北京南站']}
        availableToStations={['上海虹桥站']}
        initialTrainTypes={[]}
        initialStudent={false}
      />
    );

    fireEvent.click(screen.getByLabelText('高铁 (G)'));
    fireEvent.click(screen.getByLabelText('学生'));
    fireEvent.click(screen.getByText('重置'));

    await waitFor(() => {
      expect(screen.getByLabelText('高铁 (G)')).not.toBeChecked();
      expect(screen.getByLabelText('学生')).not.toBeChecked();
      const last = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1][0];
      expect(last).toEqual({ trainTypes: [], seatTypes: [], fromStations: [], toStations: [], student: '0' });
    });
  });
});
