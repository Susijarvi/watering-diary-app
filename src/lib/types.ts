export interface DiaryEntry {
  date: string;          // YYYY-MM-DD
  hadDiaper: boolean;
  diaperWet: boolean | null;
  bedWet: boolean;
  userEmail?: string;
  userId?: string;
  updatedAt?: string;
}

export interface AuthInfo {
  userId: string;
  userDetails: string;   // email
  identityProvider: string;
  userRoles: string[];
}

export interface ClientPrincipal {
  clientPrincipal: AuthInfo | null;
}
