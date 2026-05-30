import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/index.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { setLoading(false); return; }
    api.me()
      .then((u) => setUser(u))
      .catch(() => { localStorage.removeItem("auth_token"); localStorage.removeItem("auth_user"); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    setError("");
    try {
      const res = await api.login(email, password);
      localStorage.setItem("auth_token", res.token);
      localStorage.setItem("auth_user", JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  const signupReq = async (data) => {
    setError("");
    try {
      return await api.signup(data);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  const isAdmin = user?.role === "admin";
  const isCompany = user?.role === "company";

  return (
    <AuthCtx.Provider value={{ user, loading, error, login, logout, signup: signupReq, isAdmin, isCompany }}>
      {children}
    </AuthCtx.Provider>
  );
}
