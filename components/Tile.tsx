
import React from 'react';
import { TileValue } from '../types';

interface TileProps {
  value: TileValue;
  onClick: () => void;
  isSolved: boolean;
  isHint: boolean;
}

const Tile: React.FC<TileProps> = ({ value, onClick, isSolved, isHint }) => {
  if (value === 0) {
    return <div className="rounded-lg bg-slate-800/50 aspect-square"></div>;
  }

  const baseStyle = "w-full h-full rounded-lg flex items-center justify-center text-3xl md:text-4xl font-bold shadow-lg cursor-pointer transition-all duration-300 ease-in-out";
  const activeStyle = "bg-sky-500 text-white hover:bg-sky-400 active:scale-95";
  const solvedStyle = "bg-green-500 text-white cursor-default";
  const hintStyle = "ring-2 ring-yellow-400 animate-pulse";

  return (
    <button
      onClick={onClick}
      disabled={isSolved}
      className={`${baseStyle} ${isSolved ? solvedStyle : activeStyle} ${isHint ? hintStyle : ''}`}
    >
      {value}
    </button>
  );
};

export default Tile;
