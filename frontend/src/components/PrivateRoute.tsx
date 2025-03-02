import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { ReactNode } from "react";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user } = useSelector((state: RootState) => state.auth);

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
