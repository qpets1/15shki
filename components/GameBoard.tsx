
import React from 'react';
import { TileValue } from '../types';
import Tile from './Tile';

interface GameBoardProps {
  tiles: TileValue[];
  onTileClick: (index: number) => void;
  isSolved: boolean;
  hintIndex: number | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ tiles, onTileClick, isSolved, hintIndex }) => {
  return (
    <div className="p-2 sm:p-4 bg-slate-800 rounded-xl shadow-2xl">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {tiles.map((value, index) => (
          <Tile
            key={index}
            value={value}
            onClick={() => onTileClick(index)}
            isSolved={isSolved}
            isHint={index === hintIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
