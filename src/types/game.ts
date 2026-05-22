export type QuestionSet = {
  id: string;
  title: string;
  created_at: string;
};

export type Option = {
  id: string;
  question_set_id: string;
  side: "A" | "B";
  label: string;
  pair_id: string;
  sort_order: number;
};

export type LobbyStatus = "waiting" | "playing" | "ended";

export type LobbyResult = {
  player_name: string;
  score: number;
  total_pairs: number;
  time_seconds: number;
  question_set_title: string;
  finished_at: string;
};

export type Lobby = {
  id: string;
  code: string;
  host_name: string;
  created_at: string;
  ends_at: string | null;
  status: LobbyStatus;
  results: LobbyResult[];
};

export type LobbyPlayer = {
  id: string;
  lobby_id: string;
  player_name: string;
  joined_at: string;
};

export type GameRound = {
  questionSet: QuestionSet;
  optionsA: Option[];
  optionsB: Option[];
};
