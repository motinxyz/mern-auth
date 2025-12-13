import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./shared";
import { Navbar } from "./shared/components/Navbar";
import "./i18n"; // Initialize i18n

// Lazy load heavy components for code splitting
const LoginForm = lazy(() => import("./features/auth/components/LoginForm"));
const RegisterForm = lazy(
  () => import("./features/auth/components/RegisterForm")
);

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
  </div>
);

const Dashboard = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 flex flex-col pt-16">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
