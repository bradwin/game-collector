import { Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { AddGamePage } from "../pages/AddGamePage";
import { LibraryPage } from "../pages/LibraryPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";

const ProtectedRoute = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppShell = () => {
  const { user, logout } = useAuth();
  return (
    <div className="layout">
      <header className="topbar">
        <div>
          <strong>Game Collector</strong>
          <p className="subtle">Signed in as {user?.email}</p>
        </div>
        <nav className="nav-links">
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/add-game">Add game</NavLink>
          <button className="ghost" onClick={logout}>Logout</button>
        </nav>
      </header>
      <main className="content"><Outlet /></main>
    </div>
  );
};

const HomeRedirect = () => {
  const { token } = useAuth();
  return <Navigate to={token ? "/library" : "/login"} replace />;
};

export const App = () => (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/add-game" element={<AddGamePage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
