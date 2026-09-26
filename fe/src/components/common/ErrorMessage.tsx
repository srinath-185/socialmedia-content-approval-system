import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => (
  <div className="rounded-xl border border-red-200 bg-red-50/70 p-6 text-center max-w-lg mx-auto my-6">
    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600 mb-3">
      <AlertCircle className="w-5 h-5" />
    </div>
    <h3 className="text-base font-semibold text-red-900 mb-1">{title}</h3>
    <p className="text-sm text-red-700 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    )}
  </div>
);
