export interface Exercise {
  id: string;
  title: string;
  objective: string;
  instructions: string;
  topic: string;
  difficulty: string;
  starterCode: string;
  example: string;
}

export interface RunResult {
  passed: boolean;
  summary: string;
  output: string;
}

export interface HintResult {
  hint: string;
}
