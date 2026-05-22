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

export type Score = {
  id: string;
  player_name: string;
  score: number;
  total_pairs: number;
  question_set_id: string | null;
  time_seconds: number | null;
  played_at: string;
};

export type GameRound = {
  questionSet: QuestionSet;
  optionsA: Option[];
  optionsB: Option[];
};
