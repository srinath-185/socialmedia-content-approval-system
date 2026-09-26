import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Loading data...',
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="relative w-10 h-10">
      <div className="w-10 h-10 rounded-full border-2 border-indigo-200 animate-spin border-t-indigo-600" />
    </div>
    <p className="mt-3 text-sm text-slate-500 font-medium">{message}</p>
  </div>
);
