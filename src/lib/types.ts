export interface DiaryEntry {
  date: string;          // YYYY-MM-DD
  hadDiaper: boolean;
  diaperWet: boolean | null;
  bedWet: boolean;
  userEmail?: string;    // who last entered/edited this row
  updatedAt?: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  picture?: string;
}

export interface AuthMeResponse {
  user: AuthUser | null;
  googleClientId: string | null;
}
