import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginForm, RegisterForm } from "./features/auth";
import { ProtectedRoute } from "./shared";
import { Navbar } from "./shared/components/Navbar";
import "./i18n"; // Initialize i18n

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
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
