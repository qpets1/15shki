import React, { useState, useEffect, useCallback } from 'react';
import { TileValue } from './types';
import GameBoard from './components/GameBoard';

const GRID_SIZE = 4;
const BOARD_SIZE = GRID_SIZE * GRID_SIZE;
const EMPTY_TILE_VALUE = 0;
const SOLVED_BOARD = [...Array(BOARD_SIZE - 1).keys()].map(i => i + 1).concat(EMPTY_TILE_VALUE);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const App: React.FC = () => {
  const [tiles, setTiles] = useState<TileValue[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const isSolvable = (board: TileValue[]): boolean => {
    let inversions = 0;
    const boardWithoutEmpty = board.filter(t => t !== EMPTY_TILE_VALUE);
    for (let i = 0; i < boardWithoutEmpty.length - 1; i++) {
      for (let j = i + 1; j < boardWithoutEmpty.length; j++) {
        if (boardWithoutEmpty[i] > boardWithoutEmpty[j]) {
          inversions++;
        }
      }
    }

    const emptyTileRow = Math.floor(board.indexOf(EMPTY_TILE_VALUE) / GRID_SIZE);
    
    if (GRID_SIZE % 2 === 1) { // Odd grid
      return inversions % 2 === 0;
    } else { // Even grid
      return (inversions + emptyTileRow) % 2 === 1;
    }
  };

  const shuffleBoard = useCallback(() => {
    let newTiles: TileValue[];
    do {
        newTiles = [...SOLVED_BOARD].sort(() => Math.random() - 0.5);
    } while (!isSolvable(newTiles));
    
    setTiles(newTiles);
  }, []);

  const resetGame = useCallback(() => {
    shuffleBoard();
    setMoves(0);
    setTime(0);
    setIsSolved(false);
    setGameStarted(false);
  }, [shuffleBoard]);

  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fix: The type `NodeJS.Timeout` is not available in the browser.
  // Refactored to correctly infer the timer ID type from `setInterval`
  // and to ensure `clearInterval` is only called when a timer is set,
  // preventing a potential runtime error.
  useEffect(() => {
    if (gameStarted && !isSolved) {
      const timer = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, isSolved]);

  const checkWinCondition = useCallback(() => {
    if (tiles.length === 0) return;
    for (let i = 0; i < SOLVED_BOARD.length; i++) {
      if (tiles[i] !== SOLVED_BOARD[i]) {
        return;
      }
    }
    setIsSolved(true);
    setGameStarted(false);
  }, [tiles]);

  useEffect(() => {
    checkWinCondition();
  }, [checkWinCondition]);

  const handleTileClick = (index: number) => {
    if (isSolved || tiles[index] === EMPTY_TILE_VALUE) return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    const emptyIndex = tiles.indexOf(EMPTY_TILE_VALUE);
    const { row: tileRow, col: tileCol } = { row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE };
    const { row: emptyRow, col: emptyCol } = { row: Math.floor(emptyIndex / GRID_SIZE), col: emptyIndex % GRID_SIZE };

    const isAdjacent = Math.abs(tileRow - emptyRow) + Math.abs(tileCol - emptyCol) === 1;

    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(prevMoves => prevMoves + 1);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white font-sans">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-sky-400">ПЯТНАШКИ</h1>
          <p className="text-slate-400">Передвиньте плитки, чтобы собрать их по порядку</p>
        </header>

        <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
          <div className="text-center">
            <span className="text-slate-400 text-sm">ХОДЫ</span>
            <p className="font-bold text-2xl">{moves}</p>
          </div>
          <div className="text-center">
            <span className="text-slate-400 text-sm">ВРЕМЯ</span>
            <p className="font-bold text-2xl">{formatTime(time)}</p>
          </div>
        </div>

        {tiles.length > 0 ? (
          <GameBoard tiles={tiles} onTileClick={handleTileClick} isSolved={isSolved} />
        ) : (
          <div className="w-full aspect-square bg-slate-800 rounded-xl flex items-center justify-center">
            <p>Загрузка...</p>
          </div>
        )}

        <button
          onClick={resetGame}
          className="w-full py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
        >
          {isSolved ? 'Играть снова' : 'Перемешать'}
        </button>
      </div>

      {isSolved && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-10">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border-2 border-green-500 animate-fade-in">
            <h2 className="text-4xl font-bold text-green-400 mb-2">Победа!</h2>
            <p className="text-slate-300 mb-4">Вы решили головоломку.</p>
            <div className="text-lg">
              <p>Ходов: <span className="font-bold text-white">{moves}</span></p>
              <p>Время: <span className="font-bold text-white">{formatTime(time)}</span></p>
            </div>
            <button
              onClick={resetGame}
              className="mt-6 w-full py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-500 transition-colors duration-200"
            >
              Играть снова
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
