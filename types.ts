export type TileValue = number;

export interface Score {
  name: string;
  moves: number;
  time: number;
}

export interface PersonalStats {
  gamesPlayed: number;
  gamesWon: number;
  totalMoves: number;
  totalTime: number;
  bestMoves: number | null;
  bestTime: number | null;
}
