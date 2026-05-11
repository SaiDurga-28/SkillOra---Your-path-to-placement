import { createContext, useContext, useState } from "react";
const AuthContext = createContext(null);
function readStoredUser() {
    try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
    }
    catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
    }
}
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(readStoredUser);
    const login = (newToken, newUser) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };
    const updateUser = (updates) => {
        if (!user)
            return;
        const nextUser = { ...user, ...updates };
        localStorage.setItem("user", JSON.stringify(nextUser));
        try {
            const users = JSON.parse(localStorage.getItem("job-prep-users") ?? "[]");
            localStorage.setItem("job-prep-users", JSON.stringify(users.map(account => account.email === nextUser.email ? { ...account, ...updates } : account)));
        }
        catch {
        }
        setUser(nextUser);
    };
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };
    return (<AuthContext.Provider value={{ token, user, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
