
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TileValue, Score } from './types';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';

const GRID_SIZE = 4;
const BOARD_SIZE = GRID_SIZE * GRID_SIZE;
const EMPTY_TILE_VALUE = 0;
const SOLVED_BOARD = [...Array(BOARD_SIZE - 1).keys()].map(i => i + 1).concat(EMPTY_TILE_VALUE);

const DEFAULT_MUSIC_URL = "https://streams.ilovemusic.de/iloveradio109.mp3";
const HIGH_SCORES_KEY = 'fifteen-puzzle-high-scores';
const MAX_SCORES = 5;

// Helper function to load scores from localStorage
const getInitialHighScores = (): Score[] => {
    try {
        const storedScores = localStorage.getItem(HIGH_SCORES_KEY);
        if (storedScores) {
            const parsed = JSON.parse(storedScores);
            // Basic validation to ensure it's an array of scores
            if (Array.isArray(parsed) && parsed.every(item => 'name' in item && 'moves' in item && 'time' in item)) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to load or parse high scores from localStorage:", error);
        // If there's an error, it's safer to clear any corrupted data
        localStorage.removeItem(HIGH_SCORES_KEY);
    }
    return [];
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

// SVG Icon components for audio controls
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

  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);
  const [musicVolume, setMusicVolume] = useState<number>(0.3);
  const [isSfxOn, setIsSfxOn] = useState<boolean>(true);

  const [customMusicUrl, setCustomMusicUrl] = useState<string>('');
  const [musicUrlInput, setMusicUrlInput] = useState<string>('');
  const [musicUrlError, setMusicUrlError] = useState<string>('');
  
  const [highScores, setHighScores] = useState<Score[]>(getInitialHighScores());
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>('');

  const musicRef = useRef<HTMLAudioElement>(null);
  const moveSfxRef = useRef<HTMLAudioElement>(null);
  const winSfxRef = useRef<HTMLAudioElement>(null);
  const shuffleSfxRef = useRef<HTMLAudioElement>(null);

  const playSfx = useCallback((ref: React.RefObject<HTMLAudioElement>) => {
    if (isSfxOn && ref.current) {
        ref.current.currentTime = 0;
        ref.current.volume = musicVolume * 0.7; // Set SFX volume 30% lower than music
        ref.current.play().catch(error => console.error("SFX play failed:", error));
    }
  }, [isSfxOn, musicVolume]);

  const shuffleBoard = useCallback(() => {
    let newTiles = [...SOLVED_BOARD];
    let emptyIndex = newTiles.indexOf(EMPTY_TILE_VALUE);

    // Perform a large number of random valid moves to shuffle the board
    const shuffleMoves = 1000;
    for (let i = 0; i < shuffleMoves; i++) {
      const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
      const emptyCol = emptyIndex % GRID_SIZE;

      const possibleMoves: number[] = [];
      // Up
      if (emptyRow > 0) possibleMoves.push(emptyIndex - GRID_SIZE);
      // Down
      if (emptyRow < GRID_SIZE - 1) possibleMoves.push(emptyIndex + GRID_SIZE);
      // Left
      if (emptyCol > 0) possibleMoves.push(emptyIndex - 1);
      // Right
      if (emptyCol < GRID_SIZE - 1) possibleMoves.push(emptyIndex + 1);

      const moveIndex = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

      // Swap tiles
      [newTiles[emptyIndex], newTiles[moveIndex]] = [newTiles[moveIndex], newTiles[emptyIndex]];
      emptyIndex = moveIndex;
    }

    // A rare edge case: the board could be shuffled back to the solved state.
    // If so, make one last move to ensure it's not solved from the start.
    const isAlreadySolved = newTiles.every((val, index) => val === SOLVED_BOARD[index]);
    if (isAlreadySolved) {
      const lastEmptyIndex = newTiles.indexOf(EMPTY_TILE_VALUE);
      // move up (guaranteed to be valid from solved state)
      const tileToSwapIndex = lastEmptyIndex - GRID_SIZE;
      [newTiles[lastEmptyIndex], newTiles[tileToSwapIndex]] = [newTiles[tileToSwapIndex], newTiles[lastEmptyIndex]];
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
    setIsNewHighScore(false);
    setPlayerName('');
  }, [shuffleBoard, playSfx]);

  useEffect(() => {
    shuffleBoard(); // Initial shuffle without sound
  }, [shuffleBoard]);

  useEffect(() => {
    if (gameStarted && !isSolved) {
      const timer = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, isSolved]);
  
  useEffect(() => {
    const audioEl = musicRef.current;
    if (audioEl) {
      audioEl.volume = musicVolume;
    }
  }, [musicVolume]);

  useEffect(() => {
    const audioEl = musicRef.current;
    if (userInteracted && audioEl) {
      if (isMusicOn) {
        if (audioEl.readyState >= 2) { // Ensure file can be played
          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              if (error.name !== 'AbortError') {
                console.error("Music play failed:", error);
              }
            });
          }
        }
      } else {
        audioEl.pause();
      }
    }
  }, [isMusicOn, userInteracted, customMusicUrl, musicVolume]);

  const checkWinCondition = useCallback(() => {
    if (tiles.length === 0 || isSolved) return;
    for (let i = 0; i < SOLVED_BOARD.length; i++) {
      if (tiles[i] !== SOLVED_BOARD[i]) {
        return;
      }
    }
    
    setIsSolved(true);
    setGameStarted(false);
    playSfx(winSfxRef);

    const worstScore = highScores.length > 0 ? highScores[highScores.length - 1] : null;
    if (highScores.length < MAX_SCORES || !worstScore || moves < worstScore.moves || (moves === worstScore.moves && time < worstScore.time)) {
        setIsNewHighScore(true);
    }

  }, [tiles, playSfx, isSolved, highScores, moves, time]);

  useEffect(() => {
    checkWinCondition();
  }, [checkWinCondition]);

  const handleTileClick = (index: number) => {
    if (isSolved || tiles[index] === EMPTY_TILE_VALUE) return;

    if (!userInteracted) {
      setUserInteracted(true);
    }
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
      playSfx(moveSfxRef);
    }
  };

  const handleApplyCustomMusic = () => {
    setUserInteracted(true);
    setMusicUrlError('');
    setCustomMusicUrl(musicUrlInput);
  };
  
  const handleMusicError = () => {
    if (customMusicUrl && customMusicUrl !== DEFAULT_MUSIC_URL) {
      setMusicUrlError('Не удалось загрузить аудио. Включаю музыку по умолчанию.');
      setCustomMusicUrl(DEFAULT_MUSIC_URL);
    }
  };

  const handleMusicCanPlay = () => {
    setMusicUrlError('');
    const audioEl = musicRef.current;
    if (audioEl && isMusicOn && userInteracted) {
      audioEl.play().catch(e => console.error("Autoplay after load failed:", e));
    }
  };
  
  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    // Load the latest scores directly from storage to prevent race conditions or stale state issues.
    const currentHighScores = getInitialHighScores();

    const newScore: Score = { name: playerName.trim(), moves, time };
    const newHighScores = [...currentHighScores, newScore]
        .sort((a, b) => {
            if (a.moves !== b.moves) {
                return a.moves - b.moves;
            }
            return a.time - b.time;
        })
        .slice(0, MAX_SCORES);

    try {
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(newHighScores));
        setHighScores(newHighScores);
    } catch (error) {
        console.error("Failed to save high scores:", error);
    }
    
    resetGame();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white font-sans">
      <audio 
        ref={musicRef} 
        src={customMusicUrl || DEFAULT_MUSIC_URL} 
        loop 
        crossOrigin="anonymous"
        onError={handleMusicError}
        onCanPlay={handleMusicCanPlay}
      />
      <audio ref={moveSfxRef} src="https://raw.githubusercontent.com/qpets1/15shki/main/mixkit-unlock-game-notification-253.wav" />
      <audio ref={winSfxRef} src="https://raw.githubusercontent.com/qpets1/15shki/main/mixkit-game-level-completed-2059.wav" />
      <audio ref={shuffleSfxRef} src="https://raw.githubusercontent.com/qpets1/15shki/main/mixkit-player-losing-or-failing-2042.wav" />
      
      <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-sky-400">ПЯТНАШКИ</h1>
          <p className="text-slate-400">Передвиньте плитки, чтобы собрать их по порядку</p>
        </header>

        <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
          <div className="flex gap-2">
            <div className="text-center">
              <span className="text-slate-400 text-sm">Ходы</span>
              <p className="font-bold text-2xl">{moves}</p>
            </div>
            <div className="text-center">
              <span className="text-slate-400 text-sm">Время</span>
              <p className="font-bold text-2xl">{formatTime(time)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => { setUserInteracted(true); setIsMusicOn(v => !v); }} 
                className={`p-2 rounded-full transition-colors duration-200 ${isMusicOn ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                aria-label={isMusicOn ? "Выключить музыку" : "Включить музыку"}>
              <MusicIcon isOn={isMusicOn} />
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                aria-label="Громкость музыки"
            />
            <button 
                onClick={() => setIsSfxOn(v => !v)} 
                className={`p-2 rounded-full transition-colors duration-200 ${isSfxOn ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                aria-label={isSfxOn ? "Выключить звуки" : "Включить звуки"}>
              <SfxIcon isOn={isSfxOn} />
            </button>
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

        <div className="mt-2 p-4 bg-slate-800/50 rounded-lg">
          <label htmlFor="music-url" className="block text-sm font-medium text-slate-400 mb-2">
            Своя фоновая музыка (URL)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="music-url"
              value={musicUrlInput}
              onChange={(e) => setMusicUrlInput(e.target.value)}
              placeholder={DEFAULT_MUSIC_URL}
              className="flex-grow bg-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={handleApplyCustomMusic}
              className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-500 transition-colors"
            >
              Применить
            </button>
          </div>
          {musicUrlError && <p className="text-red-500 text-xs mt-2">{musicUrlError}</p>}
        </div>

        <Leaderboard scores={highScores} />
      </div>

      {isSolved && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-10 p-4">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border-2 border-green-500 animate-fade-in w-full max-w-sm">
            <h2 className={`text-4xl font-bold mb-2 ${isNewHighScore ? 'text-yellow-400' : 'text-green-400'}`}>
              {isNewHighScore ? 'Новый рекорд!' : 'Победа!'}
            </h2>
            <p className="text-slate-300 mb-4">Вы решили головоломку.</p>
            <div className="text-lg mb-6">
              <p>Ходов: <span className="font-bold text-white">{moves}</span></p>
              <p>Время: <span className="font-bold text-white">{formatTime(time)}</span></p>
            </div>
            
            {isNewHighScore ? (
              <form onSubmit={handleSaveScore}>
                 <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Введите ваше имя"
                  maxLength={15}
                  className="w-full bg-slate-700 text-white rounded-md px-3 py-2 text-center mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                  aria-label="Имя игрока для таблицы рекордов"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-yellow-600 text-white font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-colors duration-200"
                >
                  Сохранить и играть снова
                </button>
              </form>
            ) : (
              <button
                onClick={resetGame}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-500 transition-colors duration-200"
              >
                Играть снова
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;