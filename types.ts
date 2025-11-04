
export type TileValue = number;

// Fix: Add and export the Score interface for the leaderboard.
export interface Score {
  name: string;
  moves: number;
  time: number;
}

// Fix: Add and export the PersonalStats interface for the statistics component.
export interface PersonalStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number | null;
  bestMoves: number | null;
  totalMoves: number;
  totalTime: number;
}
