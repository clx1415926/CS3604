import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import OrderManagement from './pages/OrderManagement';
import OrderFilling from './components/OrderFilling';

const hash = window.location.hash;
const Page = hash === '#order-filling' ? OrderFilling : OrderManagement;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);