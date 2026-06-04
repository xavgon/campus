export interface OnlineUserSummary {
  userId: string;
  nome: string;
}

export interface OnlineSnapshot {
  count: number;
  users: OnlineUserSummary[];
}
