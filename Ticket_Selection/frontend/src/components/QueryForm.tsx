import React from 'react';

// @InterfaceID: UI-QueryForm
const QueryForm: React.FC = () => {
  // TODO: Implement form state and submission logic
  return (
    <div>
      <input type="text" placeholder="出发地" />
      <input type="text" placeholder="目的地" />
      <input type="date" />
      <button>查询</button>
    </div>
  );
};

export default QueryForm;