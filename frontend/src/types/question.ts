import { User } from "./auth";

export interface Answer {
  _id?: string;
  text: string;
  isCorrect: boolean;
  grades: Grade[];
}

export interface Grade {
  student: User;
  score: 1 | 2 | 3;
}

export interface EditSuggestion {
  _id?: string;
  student: User;
  suggestedQuestion?: string;
  suggestedAnswers?: Answer[];
  status: "pending" | "accepted" | "rejected";
  rebuttalComment?: string;
  createdAt: Date;
}

export interface FacultyComment {
  faculty: User;
  comment: string;
  createdAt: Date;
}

export interface Question {
  _id: string;
  owner: User;
  question: string;
  answers: Answer[];
  isFinal: boolean;
  editSuggestions: EditSuggestion[];
  grades: Grade[];
  facultyComments: FacultyComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateQuestionData {
  question: string;
  answers: Omit<Answer, "_id" | "grades">[];
}

export interface EditSuggestionData {
  suggestedQuestion?: string;
  suggestedAnswers?: Omit<Answer, "_id" | "grades">[];
}

export interface GradeSubmissionData {
  questionScore?: number;
  answerGrades: {
    answerId: string;
    score: 1 | 2 | 3;
  }[];
}
