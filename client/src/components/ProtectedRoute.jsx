import { Navigate } from "react-router-dom";
import { getUserSession } from "@/utils/auth";

export function ProtectedRoute({ children, allowedRoles }) {
    const user = getUserSession();
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}