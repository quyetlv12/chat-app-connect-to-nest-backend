import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

async function realLogin(email: string, password: string) {
  const res = await fetch(
    "https://vietsocial-be-production.up.railway.app/api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Đăng nhập thất bại");
  }
  const data = await res.json();
  if (!data.token) throw new Error("Không nhận được token");
  return { token: data.token, userId: data.user?.id || "" };
}

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await realLogin(email, password);
      localStorage.setItem("token", res.token);
      localStorage.setItem("userId", res.userId);
      navigate("/chats");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-semibold text-center text-blue-700 mb-2">
          Đăng nhập
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          Vào trò chuyện ngay 🚀
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            placeholder="Mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition"
          >
            Đăng nhập
          </button>
        </form>

        {error && (
          <div className="mt-4 text-center text-sm text-red-500 animate-pulse">
            {error}
          </div>
        )}

        <div className="mt-6 text-gray-400 text-center text-xs">
          Demo tài khoản: <br />
          <p>
            {" "}
            <strong>admin@example.com</strong> / <strong>123456789</strong>
          </p>
          <p>
            <strong>user@example.com</strong> / <strong>123456789</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
