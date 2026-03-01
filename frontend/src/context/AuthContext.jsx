import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [avatarSeed, setAvatarSeedState] = useState(localStorage.getItem('nexus_avatar') || 'Felix');

    const setAvatarSeed = (seed) => {
        setAvatarSeedState(seed);
        localStorage.setItem('nexus_avatar', seed);
    };

    useEffect(() => {
        const token = localStorage.getItem('nexus_token');
        const userData = localStorage.getItem('nexus_user');

        if (token && userData && userData !== 'undefined' && userData !== 'null') {
            try {
                setUser(JSON.parse(userData));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (e) {
                // Corrupted data — clear it so the app can start fresh
                localStorage.removeItem('nexus_token');
                localStorage.removeItem('nexus_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            const { token, user: loggedInUser } = res.data;

            localStorage.setItem('nexus_token', token);
            localStorage.setItem('nexus_user', JSON.stringify(loggedInUser));

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(loggedInUser);
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (name, email, password) => {
        try {
            const res = await axios.post('/api/auth/register', { name, email, password });
            const { token, user: newUser } = res.data;

            localStorage.setItem('nexus_token', token);
            localStorage.setItem('nexus_user', JSON.stringify(newUser));

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(newUser);
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const refreshBalance = async () => {
        try {
            const res = await axios.get('/api/auth/me');
            if (res.data) {
                setUser(res.data);
                localStorage.setItem('nexus_user', JSON.stringify(res.data));
            }
        } catch (error) {
            console.error('Failed to refresh user balance', error);
        }
    };

    if (loading) return <div className="h-screen w-screen bg-background flex items-center justify-center text-primary font-mono text-xl animate-pulse">AUTHENTICATING...</div>;

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, refreshBalance, avatarSeed, setAvatarSeed }}>
            {children}
        </AuthContext.Provider>
    );
};
