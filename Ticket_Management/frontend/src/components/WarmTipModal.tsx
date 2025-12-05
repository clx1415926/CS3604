import React from 'react';

type Props = {
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function WarmTipModal({ onConfirm, onCancel }: Props) {
  return (
    <div className="modal">
      <div className="modal-title">温馨提示</div>
      <div className="modal-content">请确认乘车人身份信息真实有效...</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        {onCancel && <button className="btn-secondary" onClick={onCancel}>取消</button>}
        <button className="btn-primary" onClick={onConfirm}>确认</button>
      </div>
    </div>
  );
}

