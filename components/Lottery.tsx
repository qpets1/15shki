import React from 'react';

interface LotteryProps {
  coins: number;
  isSpinning: boolean;
  result: string[];
  prize: string;
  hasSpun: boolean;
  onSpin: () => void;
  onPlayAgain: () => void;
  onBuySpin: () => void;
  canAffordSpin: boolean;
  winningLines: number[][];
}

const Lottery: React.FC<LotteryProps> = ({ coins, isSpinning, result, prize, hasSpun, onSpin, onPlayAgain, onBuySpin, canAffordSpin, winningLines }) => {
  const spinningChar = ['💎', '💰', '🎁', '⭐️', '꽝'][Math.floor(Math.random() * 5)];

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-10 p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border-2 border-yellow-500 animate-fade-in w-full max-w-sm">
        <h2 className='text-4xl font-bold mb-4 text-yellow-400'>
          ЛОТЕРЕЯ!
        </h2>
        <div className="grid grid-cols-3 gap-3 bg-slate-900/50 p-4 rounded-lg mb-6">
          {Array.from({ length: 9 }).map((_, index) => {
            const isWinningCell = !isSpinning && winningLines.flat().includes(index);
            return (
              <div 
                key={index} 
                className={`
                  w-full aspect-square bg-slate-700 rounded-md flex items-center justify-center text-4xl
                  transition-colors duration-300
                  ${isWinningCell ? 'win-highlight' : ''}
                `}
              >
                {isSpinning ? (
                  <span className="animate-ping">{spinningChar}</span>
                ) : (
                  result[index] || '?'
                )}
              </div>
            )
          })}
        </div>
        
        {prize && !isSpinning && (
          <p className="text-lg font-semibold text-white mb-6 animate-fade-in-down">{prize}</p>
        )}
        
        <div className="mb-4 text-slate-400">
            Ваш баланс: <span className="font-bold text-white">{coins} 💰</span>
        </div>

        <div className="flex flex-col gap-3">
          {!hasSpun ? (
             <button
                onClick={onSpin}
                disabled={isSpinning}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-500 transition-colors duration-200 disabled:bg-slate-600"
              >
                {isSpinning ? 'Вращение...' : 'Испытать удачу!'}
              </button>
          ) : (
            <>
              <button
                onClick={onBuySpin}
                disabled={isSpinning || !canAffordSpin}
                className="w-full py-3 bg-yellow-600 text-white font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {isSpinning ? 'Вращение...' : 'Еще попытка (25 💰)'}
              </button>
              <button
                onClick={onPlayAgain}
                disabled={isSpinning}
                className="w-full py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-500 transition-colors duration-200"
              >
                Играть снова
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lottery;