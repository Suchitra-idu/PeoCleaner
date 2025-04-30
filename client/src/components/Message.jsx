import { useEffect, useState } from 'react';

export default function Message({ type = 'info', text = '', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const baseStyles = 'fixed top-5 right-5 px-4 py-3 rounded-md shadow-lg text-sm font-medium transition-opacity z-50';
  const typeStyles = {
    success: 'bg-green-100 text-green-800 border border-green-300',
    error: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  };

  return (
    <div className={`${baseStyles} ${typeStyles[type] || typeStyles.info}`}>
      {text}
      <button
        className="ml-4 text-xs text-gray-500 hover:text-gray-700"
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
      >
        ×
      </button>
    </div>
  );
}
