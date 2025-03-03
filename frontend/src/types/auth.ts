export interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "faculty" | "admin";
  score: number;
  active?: boolean;
  passwordReset?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  activeUsers: User[];
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
}

export interface SetPasswordData {
  userId: string;
  password: string;
}

export interface PendingUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: "student" | "faculty" | "admin";
}

export interface ActivateUserData {
  role: "student" | "faculty" | "admin";
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  userId: string;
  password: string;
}
