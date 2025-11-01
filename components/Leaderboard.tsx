import React from 'react';
import { Score } from '../types';

interface LeaderboardProps {
  scores: Score[];
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  return (
    <div className="w-full mt-2 p-4 bg-slate-800/50 rounded-lg">
      <h2 className="text-xl font-bold text-sky-400 mb-3 text-center">Лучшие результаты</h2>
      {scores.length > 0 ? (
        <ol className="space-y-2">
          {scores.map((score, index) => (
            <li key={index} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md text-sm">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-400 w-6 text-center">{index + 1}.</span>
                <span className="font-semibold text-white truncate" title={score.name}>{score.name}</span>
              </div>
              <div className="flex gap-4 font-mono text-slate-300 flex-shrink-0">
                <span>{score.moves} ходов</span>
                <span>{formatTime(score.time)}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-slate-400 text-center text-sm">Пока нет рекордов. Сыграйте, чтобы стать первым!</p>
      )}
    </div>
  );
};

export default Leaderboard;
