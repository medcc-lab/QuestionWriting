import { Routes as RouterRoutes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import QuestionList from "./pages/QuestionList";
import QuestionCreate from "./pages/QuestionCreate";
import QuestionDetail from "./pages/QuestionDetail";
import ScoringConfig from "./pages/ScoringConfig";
import LectureList from "./pages/LectureList";
import LectureEdit from "./pages/LectureEdit";
import UserManagement from "./pages/UserManagement";
import ResetPassword from "./pages/ResetPassword";

export const Routes = () => {
  return (
    <RouterRoutes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Private routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <LectureList />
          </PrivateRoute>
        }
      />

      {/* Lecture routes */}
      <Route
        path="/lectures"
        element={
          <PrivateRoute>
            <LectureList />
          </PrivateRoute>
        }
      />
      <Route
        path="/lectures/:id/edit"
        element={
          <PrivateRoute>
            <LectureEdit />
          </PrivateRoute>
        }
      />

      {/* Question routes */}
      <Route
        path="/questions"
        element={
          <PrivateRoute>
            <QuestionList />
          </PrivateRoute>
        }
      />
      <Route
        path="/questions/create"
        element={
          <PrivateRoute>
            <QuestionCreate />
          </PrivateRoute>
        }
      />
      <Route
        path="/questions/:id"
        element={
          <PrivateRoute>
            <QuestionDetail />
          </PrivateRoute>
        }
      />

      {/* User management routes */}
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <UserManagement />
          </PrivateRoute>
        }
      />

      {/* Other routes */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/scoring"
        element={
          <PrivateRoute>
            <ScoringConfig />
          </PrivateRoute>
        }
      />
    </RouterRoutes>
  );
};
