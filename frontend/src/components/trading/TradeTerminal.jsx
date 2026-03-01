import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { ExternalLink, DollarSign, Activity } from 'lucide-react';

export function TradeTerminal({ stock, onCancel }) {
    const { user, refreshBalance } = useAuth();
    const [action, setAction] = useState('BUY'); // 'BUY' or 'SELL'
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Parse formatted string like "1,393.90" to pure float 1393.90
    const rawPriceString = String(stock?.price || '0').replace(/,/g, '');
    const price = parseFloat(rawPriceString) || 0;
    const totalValue = (price * quantity).toFixed(2);

    const executeTrade = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await axios.post('/api/trade/execute', {
                symbol: stock.sym,
                type: action,
                quantity: parseInt(quantity, 10),
                price: price
            });
            setMessage(`Successfully ${action === 'BUY' ? 'purchased' : 'sold'} ${quantity} shares of ${stock.sym}.`);
            await refreshBalance(); // update local user Context state

            // Optionally clear after 3s
            setTimeout(() => {
                setMessage('');
                if (onCancel) onCancel();
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${action.toLowerCase()} stock.`);
        } finally {
            setLoading(false);
        }
    };

    if (!stock) return null;

    return (
        <div className="flex flex-col h-[460px] animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={onCancel} className="text-text-muted hover:text-white transition-colors text-sm font-mono">&lt; BACK</button>
                    <h3 className="font-bold font-mono tracking-tight ml-2">TERMINAL: {stock.sym}</h3>
                </div>
                <div className="text-right">
                    <span className="text-xs text-text-muted mr-2">Market Price:</span>
                    <span className="font-mono text-white">${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>

            <div className="flex-1 bg-black/20 rounded-xl p-5 border border-white/5 flex flex-col gap-4 relative overflow-hidden">
                {/* Visual decoration */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>

                {message && <div className="p-3 bg-success/20 border border-success/50 text-success text-sm rounded-lg">{message}</div>}
                {error && <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-500 text-sm rounded-lg">{error}</div>}

                {/* BUY / SELL Switcher */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/5 z-10">
                    <button
                        type="button"
                        onClick={() => setAction('BUY')}
                        className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${action === 'BUY' ? 'bg-success text-black shadow-[0_0_15px_rgba(0,255,204,0.3)]' : 'text-neutral-400 hover:text-white'}`}
                    >
                        BUY
                    </button>
                    <button
                        type="button"
                        onClick={() => setAction('SELL')}
                        className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${action === 'SELL' ? 'bg-danger text-white shadow-[0_0_15px_rgba(255,51,102,0.3)]' : 'text-neutral-400 hover:text-white'}`}
                    >
                        SELL
                    </button>
                </div>

                <form onSubmit={executeTrade} className="flex-1 flex flex-col gap-4 z-10">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-muted font-mono uppercase">Quantity (Shares)</label>
                        <div className="relative">
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="number"
                                min="1"
                                required
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-background/80 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-white font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-muted font-mono uppercase">Total {action === 'BUY' ? 'Cost' : 'Return'}</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                type="text"
                                disabled
                                value={totalValue.toLocaleString()}
                                className="w-full bg-background/50 border border-white/5 opacity-70 rounded-lg py-2.5 pl-9 pr-4 text-white font-mono cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="flex justify-between items-center text-xs text-text-muted mb-3 font-mono">
                            <span>Available BP:</span>
                            <span className={action === 'BUY' && (price * quantity) > parseFloat(user?.cashBalance || 0) ? 'text-red-400 font-bold' : 'text-white'}>
                                ${parseFloat(user?.cashBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !user}
                            className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${action === 'BUY'
                                ? 'bg-success hover:bg-[#00e6b8] text-black shadow-[0_0_20px_rgba(0,255,204,0.4)]'
                                : 'bg-danger hover:bg-[#e62e5c] text-white shadow-[0_0_20px_rgba(255,51,102,0.4)]'
                                }`}
                        >
                            {loading ? 'EXECUTING...' : `EXECUTE ${action}`}
                            {!loading && <ExternalLink size={16} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
