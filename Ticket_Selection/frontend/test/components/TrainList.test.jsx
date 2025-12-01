const React = require('react');
const { render, screen } = require('@testing-library/react');
const TrainList = require('../../src/components/TrainList').default || require('../../src/components/TrainList');

// @InterfaceID: UI-TrainList
// @AcceptanceCriteria: #1
test('should render train list correctly', () => {
  render(React.createElement(TrainList, { trains: [] }));
  expect(screen.getByText('没有符合条件的车次。')).toBeInTheDocument();
});