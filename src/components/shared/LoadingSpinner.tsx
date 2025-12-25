'use client';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gold-light border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">❄</span>
        </div>
      </div>
    </div>
  );
}
