import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Universities from './pages/Universities';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import UniversityDashboard from './pages/dashboards/UniversityDashboard';
import ModeratorDashboard from './pages/dashboards/ModeratorDashboard';
import Profile from './pages/Profile';
import AcceptInvite from './pages/AcceptInvite';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthRoute from './components/AuthRoute';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/applicationStore';
import { useUsersStore } from './store/usersStore';

function AppInit() {
  const init = useAuthStore(s => s.init);
  const user = useAuthStore(s => s.user);
  const hydrated = useAuthStore(s => s.hydrated);

  const loadMine = useAppStore(s => s.loadMine);
  const loadAll  = useAppStore(s => s.loadAll);
  const loadUsers = useUsersStore(s => s.load);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (!hydrated || !user) return;
    if (user.role === 'student') loadMine();
    else { loadAll(); loadUsers(); }
  }, [hydrated, user, loadMine, loadAll, loadUsers]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/universities" element={<Universities />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />

          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/student" element={<StudentDashboard />} />
          </Route>
          <Route element={<ProtectedRoute role="university" />}>
            <Route path="/university" element={<UniversityDashboard />} />
          </Route>
          <Route element={<ProtectedRoute role="moderator" />}>
            <Route path="/moderator" element={<ModeratorDashboard />} />
          </Route>

          <Route element={<AuthRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
