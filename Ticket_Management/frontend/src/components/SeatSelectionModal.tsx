import React, { useEffect, useState } from 'react';

type Props = {
  trainId: string;
  travelDate: string;
  onConfirm: (locks: any[], passengers: any[]) => void;
  onClose: () => void;
};

export default function SeatSelectionModal({ trainId, travelDate, onConfirm, onClose }: Props) {
  const [seatClass, setSeatClass] = useState<'二等座' | '一等座'>('二等座');
  const [selected, setSelected] = useState<string>('A');
  const [info, setInfo] = useState<{ window: boolean } | null>(null);

  useEffect(() => {
    const mapColumnToWindow: Record<string, boolean> = { A: true, B: false, C: false, D: false, F: true };
    setInfo({ window: mapColumnToWindow[selected] });
  }, [selected]);

  const lock = async () => {
    const seatNo = `16${selected}`;
    const r = await fetch('http://localhost:3001/api/v1/seats/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ train_id: trainId, travel_date: travelDate, seats: [{ seat_class: seatClass, carriage_no: '10', seat_no: seatNo, passenger_id: 'p-001' }] })
    });
    const data = await r.json();
    if (r.ok && Array.isArray(data.locks) && data.locks.length > 0) {
      const locks = data.locks;
      const passengers = [{ passenger_id: 'p-001', name: '系统管理员', ticket_type: '成人票' }];
      onConfirm(locks, passengers);
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: 16, width: 420 }}>
        <div style={{ marginBottom: 8 }}>二等座</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {['A', 'B', 'C', 'D', 'F'].map(c => (
            <button key={c} className={selected === c ? 'btn-primary' : ''} onClick={() => setSelected(c)}>{c}</button>
          ))}
        </div>
        <div style={{ marginBottom: 8 }}>{info?.window ? '窗户' : '过道'}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={lock}>确认</button>
        </div>
      </div>
    </div>
  );
}