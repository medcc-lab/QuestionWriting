import { User } from "./auth";

export interface Lecture {
  _id: string;
  title: string;
  description?: string;
  faculty: User;
  students: User[];
  questions: string[]; // Changed from Question[] to string[] to match actual data structure
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLectureDto {
  title: string;
  description?: string;
  students?: string[];
}

export interface UpdateLectureDto {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface LectureState {
  lectures: Lecture[];
  activeLecture: Lecture | null;
  loading: boolean;
  error: string | null;
}
