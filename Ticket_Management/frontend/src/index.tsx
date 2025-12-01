import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import OrderManagement from './pages/OrderManagement';
import OrderFilling from './components/OrderFilling';
import Payment from './pages/Payment';

function Router() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash || '';
      if (h.startsWith('#order-filling')) {
        const hasSidInHash = /sid=([^&]+)/.test(h);
        const sidStored = localStorage.getItem('SESSION_ID');
        const hasSid = hasSidInHash || !!sidStored;
        if (!hasSid) {
          window.location.hash = '#?loginRequired=1';
        }
      }
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  let Page: any = OrderManagement;
  if (hash.startsWith('#order-filling')) Page = OrderFilling;
  else if (hash.startsWith('#payment')) Page = Payment;
  return <Page />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
