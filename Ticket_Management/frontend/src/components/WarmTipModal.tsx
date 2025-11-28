import React from 'react';

type Props = {
  open: boolean;
  onConfirm: () => void;
};

export default function WarmTipModal({ open, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="modal">
      <div className="modal-title">温馨提示</div>
      <div className="modal-content">请确认乘车人身份信息真实有效...</div>
      <button className="btn-primary" onClick={onConfirm}>确认</button>
    </div>
  );
}

