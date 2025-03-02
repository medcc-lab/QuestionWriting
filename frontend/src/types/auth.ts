export interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "faculty";
  score: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: "student" | "faculty";
}
