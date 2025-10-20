import React from 'react';

export default function LoadingSkeleton({ count = 6 }) {
  const cards = Array.from({ length: count });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((_, index) => (
        <div key={index} className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/60 p-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="shimmer-box h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="shimmer-line h-4 w-3/4" />
              <div className="shimmer-line h-3 w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex gap-3">
              <div className="shimmer-pill h-6 w-16" />
              <div className="shimmer-pill h-6 w-16" />
            </div>
            <div className="shimmer-line h-3 w-full" />
            <div className="shimmer-line h-3 w-2/3" />
          </div>
        </div>
      ))}
      <style jsx>{`
        .shimmer-box,
        .shimmer-line,
        .shimmer-pill {
          position: relative;
          overflow: hidden;
          background: rgba(71, 85, 105, 0.55);
        }

        .shimmer-box::after,
        .shimmer-line::after,
        .shimmer-pill::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            rgba(71, 85, 105, 0),
            rgba(148, 163, 184, 0.6),
            rgba(71, 85, 105, 0)
          );
          animation: shimmer 1.6s infinite;
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
