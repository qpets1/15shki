import React, { useState } from 'react';
import { PersonalStats } from '../types';

interface StatisticsProps {
  stats: PersonalStats;
  onReset: () => void;
}

const formatTime = (seconds: number): string => {
  if (seconds === Infinity || isNaN(seconds) || seconds === null) return '-';
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const StatItem: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-400">{label}</span>
    <span className="font-bold text-white">{value ?? '-'}</span>
  </div>
);

const Statistics: React.FC<StatisticsProps> = ({ stats, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full p-4 bg-slate-800/50 rounded-lg">
      <button
        className="w-full flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h2 className="text-xl font-bold text-sky-400">Ваша статистика</h2>
        <svg
          className={`w-5 h-5 text-sky-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-3 animate-fade-in-down">
          <StatItem label="Сыграно игр" value={stats.gamesPlayed} />
          <StatItem label="Побед" value={stats.gamesWon} />
          <StatItem label="Лучшее время" value={stats.bestTime !== null ? formatTime(stats.bestTime) : null} />
          <StatItem label="Лучшие ходы" value={stats.bestMoves} />
          <StatItem label="Всего ходов" value={stats.totalMoves} />
          <StatItem label="Общее время" value={formatTime(stats.totalTime)} />
          <button
            onClick={onReset}
            className="w-full mt-4 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Сбросить статистику
          </button>
        </div>
      )}
    </div>
  );
};

export default Statistics;
