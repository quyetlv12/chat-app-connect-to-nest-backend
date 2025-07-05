import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

async function realLogin(email: string, password: string) {
  const res = await fetch("https://vietsocial-be-production.up.railway.app/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Đăng nhập
          </button>
        </form>
        {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
        <div className="mt-6 text-gray-500 text-center text-sm">
          Demo: admin@example.com / 123456789
        </div>
      </div>
    </div>
  );
};

export default LoginScreen; 