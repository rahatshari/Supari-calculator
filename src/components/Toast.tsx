import React from 'react';

interface ToastProps {
  message: string | React.ReactNode | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div id="toast" className="show no-print">
      {message}
    </div>
  );
};
