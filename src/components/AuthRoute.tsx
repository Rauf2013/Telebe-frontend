import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthRoute() {
  const user = useAuthStore(s => s.user);
  const hydrated = useAuthStore(s => s.hydrated);

  if (!hydrated) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-slate-500 text-sm">
        Yüklənir...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
