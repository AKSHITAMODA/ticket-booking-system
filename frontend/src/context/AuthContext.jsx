import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= LOAD CURRENT USER =================

  useEffect(() => {

    const loadUser = async () => {

      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {

        const response = await api.get(
          "/api/auth/me"
        );

        const data = response.data;

        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: String(data.role).toUpperCase(),
        });

      } catch (error) {

        console.error(
          "Authentication check failed:",
          error
        );

        localStorage.removeItem("token");
        setUser(null);

      } finally {

        setLoading(false);

      }
    };

    loadUser();

  }, []);

  // ================= LOGIN =================

  const login = async (
    email,
    password
  ) => {

    const response = await api.post(
      "/api/auth/login",
      {
        email,
        password,
      }
    );

    const data = response.data;

    localStorage.setItem(
      "token",
      data.token
    );

    const loggedInUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: String(data.role).toUpperCase(),
    };

    setUser(loggedInUser);

    return data;
  };

  // ================= REGISTER =================

  const register = async (
    name,
    email,
    password
  ) => {

    const response = await api.post(
      "/api/auth/register",
      {
        name,
        email,
        password,
      }
    );

    return response.data;
  };

  // ================= LOGOUT =================

  const logout = () => {

    localStorage.removeItem("token");

    setUser(null);

  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}