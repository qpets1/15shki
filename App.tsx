import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TileValue } from './types';
import GameBoard from './components/GameBoard';
import Lottery from './components/Lottery';

const GRID_SIZE = 3;
const BOARD_SIZE = GRID_SIZE * GRID_SIZE;
const EMPTY_TILE_VALUE = 0;
const SOLVED_BOARD = [...Array(BOARD_SIZE - 1).keys()].map(i => i + 1).concat(EMPTY_TILE_VALUE);
const HINT_COST = 10;
const EXTRA_SPIN_COST = 25;

const DEFAULT_MUSIC_URL = "https://streams.ilovemusic.de/iloveradio109.mp3";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const MusicIcon = ({ isOn }: { isOn: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      {!isOn && <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" strokeWidth="2" />}
    </svg>
);

const SfxIcon = ({ isOn }: { isOn: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      {isOn ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M17.25 9.75L19.5 12M12 18.75l-4.5-4.5H4.5a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5h3l4.5-4.5v12.75z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l-2.25-2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.5 4.5m0 0l4.5 4.5m-4.5-4.5l-4.5 4.5m4.5-4.5l4.5-4.5m-9 13.5l-4.5-4.5H4.5a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5h3l4.5-4.5v12.75z" />
      )}
    </svg>
);

const App: React.FC = () => {
  const [tiles, setTiles] = useState<TileValue[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);
  const [coins, setCoins] = useState<number>(100);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [lastMovedTile, setLastMovedTile] = useState<TileValue | null>(null);

  const [isLotteryActive, setIsLotteryActive] = useState<boolean>(false);
  const [lotteryResult, setLotteryResult] = useState<(string)[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [prize, setPrize] = useState<string>('');
  const [hasSpun, setHasSpun] = useState<boolean>(false);
  const [winningLines, setWinningLines] = useState<number[][]>([]);

  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);
  const [musicVolume, setMusicVolume] = useState<number>(0.05);
  const [isSfxOn, setIsSfxOn] = useState<boolean>(true);
  
  const musicRef = useRef<HTMLAudioElement>(null);
  const moveSfxRef = useRef<HTMLAudioElement>(null);
  const winSfxRef = useRef<HTMLAudioElement>(null);
  const shuffleSfxRef = useRef<HTMLAudioElement>(null);
  const lotterySpinSfxRef = useRef<HTMLAudioElement>(null);
  const lotteryWinSfxRef = useRef<HTMLAudioElement>(null);

  const playSfx = useCallback((ref: React.RefObject<HTMLAudioElement>) => {
    if (isSfxOn && ref.current) {
        ref.current.currentTime = 0;
        ref.current.volume = musicVolume * 0.7;
        ref.current.play().catch(error => console.error("SFX play failed:", error));
    }
  }, [isSfxOn, musicVolume]);

  const shuffleBoard = useCallback(() => {
    let newTiles = [...SOLVED_BOARD];
    for (let i = newTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }

    const inversions = newTiles.filter(v => v !== EMPTY_TILE_VALUE).reduce((acc, current, i, arr) => {
        let currentInversions = 0;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] < current) {
                currentInversions++;
            }
        }
        return acc + currentInversions;
    }, 0);

    if (inversions % 2 !== 0) {
        const [first, second] = [newTiles.indexOf(1), newTiles.indexOf(2)];
        if(first !== -1 && second !== -1){
            [newTiles[first], newTiles[second]] = [newTiles[second], newTiles[first]];
        }
    }

    setTiles(newTiles);
  }, []);

  const resetGame = useCallback(() => {
    playSfx(shuffleSfxRef);
    shuffleBoard();
    setMoves(0);
    setTime(0);
    setIsSolved(false);
    setGameStarted(false);
    setIsLotteryActive(false);
    setLotteryResult([]);
    setPrize('');
    setHasSpun(false);
    setLastMovedTile(null);
    setWinningLines([]);
  }, [shuffleBoard, playSfx]);

  useEffect(() => {
    shuffleBoard();
  }, [shuffleBoard]);

  useEffect(() => {
    if (gameStarted && !isSolved) {
      const timer = setInterval(() => setTime(prevTime => prevTime + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, isSolved]);
  
  useEffect(() => {
    const audioEl = musicRef.current;
    if (audioEl) audioEl.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    const audioEl = musicRef.current;
    if (userInteracted && audioEl) {
      if (isMusicOn) {
        audioEl.play().catch(e => console.error("Music play failed:", e));
      } else {
        audioEl.pause();
      }
    }
  }, [isMusicOn, userInteracted]);
  
  const checkWinCondition = useCallback(() => {
    if (tiles.length === 0 || isSolved) return;
    if (tiles.every((val, index) => val === SOLVED_BOARD[index])) {
      setIsSolved(true);
      setGameStarted(false);
      playSfx(winSfxRef);
      setTimeout(() => setIsLotteryActive(true), 500);
    }
  }, [tiles, playSfx, isSolved]);

  useEffect(() => { checkWinCondition(); }, [checkWinCondition]);

  const handleTileClick = (index: number) => {
    if (isSolved || tiles[index] === EMPTY_TILE_VALUE) return;
    if (!userInteracted) setUserInteracted(true);
    if (!gameStarted) setGameStarted(true);

    const emptyIndex = tiles.indexOf(EMPTY_TILE_VALUE);
    const { row: tileRow, col: tileCol } = { row: Math.floor(index / GRID_SIZE), col: index % GRID_SIZE };
    const { row: emptyRow, col: emptyCol } = { row: Math.floor(emptyIndex / GRID_SIZE), col: emptyIndex % GRID_SIZE };

    if (Math.abs(tileRow - emptyRow) + Math.abs(tileCol - emptyCol) === 1) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(prevMoves => prevMoves + 1);
      setLastMovedTile(tiles[index]); // Запоминаем последнюю передвинутую плитку
      playSfx(moveSfxRef);
    }
  };
  
  const handleUseHint = () => {
    if (coins < HINT_COST || isSolved) return;
    setCoins(c => c - HINT_COST);
    const emptyIndex = tiles.indexOf(EMPTY_TILE_VALUE);
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;

    let possibleMoves: number[] = [];
    if (emptyRow > 0) possibleMoves.push(emptyIndex - GRID_SIZE);
    if (emptyRow < GRID_SIZE - 1) possibleMoves.push(emptyIndex + GRID_SIZE);
    if (emptyCol > 0) possibleMoves.push(emptyIndex - 1);
    if (emptyCol < GRID_SIZE - 1) possibleMoves.push(emptyIndex + 1);

    // Фильтруем ход, который отменит последнее действие
    let preferredMoves = possibleMoves.filter(index => tiles[index] !== lastMovedTile);
    
    // Если после фильтрации не осталось ходов (например, в углу), используем все возможные
    if (preferredMoves.length === 0) {
        preferredMoves = possibleMoves;
    }

    // Ищем плитку не на своем месте среди предпочтительных ходов
    for (const moveIndex of preferredMoves) {
        if (tiles[moveIndex] !== SOLVED_BOARD[moveIndex]) {
            setHintIndex(moveIndex);
            setTimeout(() => setHintIndex(null), 1000);
            return;
        }
    }

    // Если все плитки на своих местах (редко), просто подсказываем первый возможный ход
    if (preferredMoves.length > 0) {
        setHintIndex(preferredMoves[0]);
        setTimeout(() => setHintIndex(null), 1000);
    }
  };

  const handleSpinLottery = () => {
    setIsSpinning(true);
    setHasSpun(true);
    setPrize('');
    setWinningLines([]);
    playSfx(lotterySpinSfxRef);

    setTimeout(() => {
        const SYMBOLS = ['💎', '💰', '🎁', '⭐️', '꽝'];
        const newResult = Array(BOARD_SIZE).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        setLotteryResult(newResult);

        let winPrize = 0;
        const newWinningLines: number[][] = [];
        const lines = [ [0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6] ];

        for (const line of lines) {
            const [a, b, c] = line;
            if (newResult[a] !== '꽝' && newResult[a] === newResult[b] && newResult[a] === newResult[c]) {
                switch (newResult[a]) {
                    case '💎': winPrize += 500; break;
                    case '💰': winPrize += 250; break;
                    case '🎁': winPrize += 100; break;
                    case '⭐️': winPrize += 50; break;
                }
                newWinningLines.push(line);
            }
        }
        setWinningLines(newWinningLines);

        if (winPrize > 0) {
            setPrize(`Вы выиграли ${winPrize} 💰!`);
            setCoins(prev => prev + winPrize);
            playSfx(lotteryWinSfxRef);
        } else {
            setPrize('Попробуйте еще раз!');
        }
        setIsSpinning(false);
    }, 1500);
  };

  const handleBuySpin = () => {
    if (coins < EXTRA_SPIN_COST) return;
    setCoins(c => c - EXTRA_SPIN_COST);
    handleSpinLottery();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white font-sans">
      <audio ref={musicRef} src={DEFAULT_MUSIC_URL} loop crossOrigin="anonymous" />
      <audio ref={moveSfxRef} src="https://raw.githubusercontent.com/qpets1/15shki/main/mixkit-unlock-game-notification-253.wav" />
      <audio ref={winSfxRef} src="https://raw.githubusercontent.com/qpets1/15shki/main/mixkit-game-level-completed-2059.wav" />
      <audio ref={shuffleSfxRef} src="https://raw.githubusercontent.com/qpets1/15shki/main/mixkit-player-losing-or-failing-2042.wav" />
      <audio ref={lotterySpinSfxRef} src="https://assets.mixkit.co/sfx/preview/mixkit-slot-machine-spin-1911.mp3" />
      <audio ref={lotteryWinSfxRef} src="https://assets.mixkit.co/sfx/preview/mixkit-bonus-earned-in-video-game-2058.mp3" />
      
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-sky-400">ПЯТНАШКИ & УДАЧА</h1>
          <p className="text-slate-400">Собери пазл, затем испытай удачу!</p>
        </header>

        <main className="flex flex-col gap-4">
          <section className="w-full flex flex-col gap-4">
            <GameBoard tiles={tiles} onTileClick={handleTileClick} isSolved={isSolved} hintIndex={hintIndex}/>
            <div className="flex gap-2">
                <button
                    onClick={resetGame}
                    className="w-full py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-500 transition-colors duration-200"
                >
                    Перемешать
                </button>
                <button
                    onClick={handleUseHint}
                    disabled={coins < HINT_COST || isSolved}
                    className="w-full py-3 bg-yellow-600 text-white font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    Подсказка ({HINT_COST} 💰)
                </button>
            </div>
          </section>
          
          <section className="w-full flex flex-col gap-4">
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
              <div className="flex-1 flex gap-4">
                  <div className="text-center"><span className="text-slate-400 text-sm">Ходы</span><p className="font-bold text-2xl">{moves}</p></div>
                  <div className="text-center"><span className="text-slate-400 text-sm">Время</span><p className="font-bold text-2xl">{formatTime(time)}</p></div>
                  <div className="text-center"><span className="text-slate-400 text-sm">Монеты</span><p className="font-bold text-2xl">{coins} 💰</p></div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1">
                    <button onClick={() => { setUserInteracted(true); setIsMusicOn(v => !v); }} className={`p-2 rounded-full ${isMusicOn ? 'bg-sky-500' : 'bg-slate-700'}`}><MusicIcon isOn={isMusicOn} /></button>
                    <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        className={`w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500 transition-opacity ${!isMusicOn ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!isMusicOn}
                    />
                 </div>
                <button onClick={() => setIsSfxOn(v => !v)} className={`p-2 rounded-full ${isSfxOn ? 'bg-sky-500' : 'bg-slate-700'}`}><SfxIcon isOn={isSfxOn} /></button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {isLotteryActive && (
        <Lottery 
            coins={coins}
            isSpinning={isSpinning}
            result={lotteryResult}
            prize={prize}
            onSpin={handleSpinLottery}
            onPlayAgain={resetGame}
            onBuySpin={handleBuySpin}
            canAffordSpin={coins >= EXTRA_SPIN_COST}
            hasSpun={hasSpun}
            winningLines={winningLines}
        />
      )}
    </div>
  );
};

export default App;