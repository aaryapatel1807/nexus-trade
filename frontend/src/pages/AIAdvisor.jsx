import { useState, useRef, useEffect } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Send, Bot, User, Mic, Paperclip, Download, MoreVertical, TrendingUp, Activity } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import ReactMarkdown from 'react-markdown'

// Placeholder for smaller components
const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-surface/60 backdrop-blur-lg border border-white/5 rounded-2xl p-6 ${className}`}>
        {children}
    </div>
)

export function AIAdvisor() {
    const { user } = useAuth()
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hello ${user ? user.name || 'there' : 'Trader'}! I am Nexus, your AI trading analyst powered by Google Gemini. How can I help you analyze the market today?`,
            isInitial: true
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [liveInsights, setLiveInsights] = useState([])
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await fetch('/api/scanner')
                const data = await res.json()
                if (Array.isArray(data)) {
                    // Find actual strong buys to feature in the sidebar
                    const strongBuys = data.filter(d => d.signal === 'Strong Buy' || d.signal === 'Buy')
                    setLiveInsights(strongBuys.slice(0, 4))
                }
            } catch (err) { }
        }
        fetchInsights()
    }, [])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim() || isTyping) return

        const userMessage = { role: 'user', content: input }
        const updatedMessages = [...messages, userMessage]

        setMessages(updatedMessages)
        setInput('')
        setIsTyping(true)

        try {
            const token = localStorage.getItem('nexus_token')
            const res = await axios.post('/api/chat/ask', {
                messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const aiResponse = {
                role: 'assistant',
                content: res.data.reply || "I'm sorry, I couldn't process that request.",
                hasChart: false
            }
            setMessages(prev => [...prev, aiResponse])
        } catch (error) {
            console.error('Chat error:', error);
            const status = error.response?.status;
            const errorCode = error.response?.data?.error;

            let content = "⚠️ I'm having trouble connecting to the Nexus intelligence network. Please try again shortly.";

            if (status === 429) {
                if (errorCode === 'RATE_LIMIT') {
                    content = "⏳ **AI quota exceeded.** Your Gemini API key has hit its daily limit (free tier = 1,500 requests/day).\n\n**To fix this:**\n1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and create a **new API key**\n2. Open the file `backend/.env`\n3. Replace the `GEMINI_API_KEY` value with your new key\n4. Restart the backend server\n\nThe quota resets every 24 hours automatically.";
                } else {
                    content = "⏳ AI is rate limited. Please wait 1-2 minutes and try again.";
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content }])
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="flex gap-6 w-full max-w-[1600px] mx-auto h-[calc(100vh-8rem)]">

                {/* MAIN CHAT AREA */}
                <GlassCard className="flex-[2] flex flex-col p-0 overflow-hidden relative border-white/10 shadow-[0_0_50px_rgba(112,0,255,0.05)]">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-white/5 bg-surface/50 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30">
                                <Bot size={20} className="text-secondary" />
                            </div>
                            <div>
                                <h2 className="font-medium text-white">Nexus AI Analyst</h2>
                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                                    Google Gemini Engine • Online
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 text-text-muted">
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Download size={18} /></button>
                            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><MoreVertical size={18} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.role === 'assistant'
                                    ? 'bg-secondary/10 border-secondary/30 text-secondary'
                                    : 'bg-primary/10 border-primary/30 text-primary'
                                    }`}>
                                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                </div>

                                <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 overflow-x-auto max-w-none ${msg.role === 'user'
                                        ? 'bg-primary text-background font-medium rounded-tr-sm'
                                        : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-sm shadow-lg'
                                        }`}>
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>

                                    {/* Inline Chart Simulation */}
                                    {msg.hasChart && (
                                        <div className="w-full max-w-[400px] h-[200px] mt-2 bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col">
                                            <div className="flex justify-between text-xs text-text-muted mb-2">
                                                <span>RELIANCE 1D Analysis</span>
                                                <span className="text-success flex items-center gap-1"><TrendingUp size={12} /> Bullish</span>
                                            </div>
                                            <div className="flex-1 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-text-muted">
                                                [Chart Component Rendered by AI]
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-secondary/10 border border-secondary/30 text-secondary flex items-center justify-center">
                                    <Bot size={16} />
                                </div>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Box */}
                    <div className="p-4 border-t border-white/5 bg-surface/80 blur-backdrop-md z-10">
                        <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-black/30 border border-white/10 rounded-2xl p-2 focus-within:border-secondary/50 focus-within:ring-1 focus-within:ring-secondary/50 transition-all">
                            <button type="button" className="p-2 text-text-muted hover:text-white transition-colors">
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                placeholder="Ask about a stock, sector, or trading strategy..."
                                className="flex-1 max-h-[150px] min-h-[44px] bg-transparent resize-none outline-none py-3 text-sm text-white placeholder-text-muted/60"
                                rows={1}
                            />
                            <button type="button" className="p-2 text-text-muted hover:text-white transition-colors">
                                <Mic size={20} />
                            </button>
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-white disabled:opacity-50 disabled:hover:bg-secondary transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
                            {["What's the outlook for RELIANCE?", "Scan for breakout patterns", "Explain RSI indicator"].map(q => (
                                <button
                                    key={q}
                                    onClick={() => setInput(q)}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                {/* RIGHT CONTEXT PANEL */}
                <div className="flex-1 flex flex-col gap-6 hidden xl:flex">

                    <GlassCard className="flex flex-col flex-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[50px] rounded-full pointer-events-none"></div>

                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-secondary" /> Contextual Data
                        </h3>
                        <p className="text-sm text-text-muted mb-4">The AI automatically pulls relevant data based on your conversation.</p>

                        <div className="flex-1 border border-white/5 bg-black/20 rounded-xl flex items-center justify-center p-6 text-center text-sm text-text-muted/60">
                            Ask about a specific stock to view its fundamental data, recent news, and technical indicators here.
                        </div>
                    </GlassCard>

                    <GlassCard className="h-[300px] flex flex-col">
                        <h3 className="font-medium mb-4">Live Market Signals</h3>
                        <ul className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
                            {liveInsights.length > 0 ? liveInsights.map((p, i) => (
                                <li key={i} className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-white/5 text-sm">
                                    <div>
                                        <span className="font-medium font-mono">{p.sym}</span>
                                        <span className="text-xs text-text-muted block mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{p.name}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${p.signal.includes('Buy') ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                        {p.signal}
                                    </span>
                                </li>
                            )) : (
                                <li className="text-xs text-text-muted text-center py-4">Scanning for live signals...</li>
                            )}
                        </ul>
                    </GlassCard>

                </div>
            </div>
        </DashboardLayout>
    )
}
