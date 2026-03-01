import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Atom, ChevronRight } from 'lucide-react';

export const Login = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = isRegistering
            ? await register(name, email, password)
            : await login(email, password);

        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="flex items-center space-x-3 mb-12">
                <Atom className="text-primary w-10 h-10 animate-[spin_4s_linear_infinite]" />
                <span className="text-3xl font-bold font-mono tracking-tighter text-white">
                    NEXUS<span className="text-primary">TRADE</span>
                </span>
            </div>

            <div className="w-full max-w-md bg-secondary/30 backdrop-blur-md border border-neutral-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                {/* Decorative glowing orb */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />

                <h2 className="text-2xl font-bold text-white mb-2 relative z-10">
                    {isRegistering ? 'INITIALIZE_ACCOUNT' : 'SECURE_LOGIN'}
                </h2>
                <p className="text-neutral-400 mb-8 font-mono text-sm relative z-10">
                    {isRegistering ? 'Deploy your $100,000 virtual balance.' : 'Authenticate to access the terminal.'}
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 relative z-10">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    {isRegistering && (
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Alias / Name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-background/50 border border-neutral-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                            type="email"
                            placeholder="Email Coordinates"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background/50 border border-neutral-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background/50 border border-neutral-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group/btn"
                    >
                        <span>{loading ? 'PROCESSING...' : (isRegistering ? 'EXECUTE SYNTHESIS' : 'ACCESS TERMINAL')}</span>
                        {!loading && <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                    </button>
                </form>

                <div className="mt-8 text-center relative z-10">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                        className="text-neutral-400 hover:text-white text-sm font-mono transition-colors"
                    >
                        {isRegistering ? 'Already established? [LOGIN]' : 'Need clearance? [REGISTER]'}
                    </button>
                </div>
            </div>
        </div>
    );
};
