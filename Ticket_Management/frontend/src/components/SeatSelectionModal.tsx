import React from 'react';

type Props = {
  locks: any[];
  onConfirm: () => void;
};

export default function SeatSelectionModal({ locks, onConfirm }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 16, width: 420 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>座位锁定成功</div>
        <div style={{ marginBottom: 12 }}>
          {locks && locks.length > 0 ? (
            locks.map((lock, idx) => (
              <div key={idx}>
                车厢: {lock.carriage_no || '10'} 座位: {lock.seat_no || '16A'}
              </div>
            ))
          ) : (
            <div>座位信息加载中...</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onConfirm}>确认并提交订单</button>
        </div>
      </div>
    </div>
  );
}