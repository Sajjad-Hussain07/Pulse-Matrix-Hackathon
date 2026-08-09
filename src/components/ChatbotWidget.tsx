import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage } from '../types';
import { calculateBiometrics } from '../utils/biometrics';
import { getSystemPromptConfig, getGeminiKeyOverride } from '../utils/localStorage';
import { MessageSquare, X, Send, Bot, User, Sparkles, MapPin, RefreshCw, ChevronDown } from 'lucide-react';

interface ChatbotWidgetProps {
  activeUser: UserProfile;
  streakCount: number;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ activeUser, streakCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const biometrics = calculateBiometrics(activeUser);

  const [messages, setMessages] = useState<ChatMessage[]>([
  {
    id: 'msg_1',
    sender: 'assistant',
    text: `Hello ${activeUser?.name || 'Member'}! I am PULSE BOT 3.0, your AI Performance Specialist at Pulse Matrix Performance Club, Auto Bahn Road, Hyderabad.
I am synced with your current **${activeUser?.goal || 'Fitness'}** plan (${biometrics?.targetCalories || 2000} kcal/day target & ${streakCount || 0}-day streak). How can I optimize your performance today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Close Chatbot Widget when user clicks outside the chatbot box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const quickReplyChips = [
    'Give me a 10-min home finisher workout',
    'What should I eat post-workout?',
    'How do I fix forward head posture?',
    'Where is Pulse Matrix located?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const systemConfig = getSystemPromptConfig();
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: activeUser,
          biometrics: biometrics,
          streak: streakCount,
          message: queryText,
          customSystemPrompt: systemConfig.chatbotPrompt,
          customApiKey: getGeminiKeyOverride() || undefined,
        }),
      });

      const data = await res.json();
      const assistantText = data.reply || 'Keep pushing your daily fitness targets!';

      const assistantMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: `Stay focused on your ${biometrics.targetCalories} kcal daily target and maintain your ${streakCount}-day streak!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50">
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="btn-open-chatbot-widget"
          onClick={() => setIsOpen(true)}
          className="relative p-4 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 text-gray-950 shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
          title="Open AI Performance Chatbot"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-gray-950" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[550px] bg-[#14171D] border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header Bar */}
          <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-lime-400 p-0.5 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-[#0D0F12] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black uppercase text-white tracking-wide">PULSE BOT 3.0</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-gray-400 font-mono">Gemini 3.6-Flash • Context Aware</p>
              </div>
            </div>

            <button
              id="btn-close-chatbot-widget"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Context Bar Pill */}
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-[11px] font-mono text-emerald-400">
            <span>Context: {activeUser.name} ({activeUser.goal})</span>
            <span>{biometrics.targetCalories} kcal</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[80%] p-3.5 rounded-2xl ${
                    isUser
                      ? 'bg-emerald-500 text-gray-950 font-medium rounded-tr-none'
                      : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className={`text-[9px] font-mono block mt-1 ${isUser ? 'text-gray-900' : 'text-gray-500'}`}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gray-800 text-gray-300 flex items-center justify-center shrink-0 border border-gray-700">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-2xl w-max border border-emerald-500/20">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>PULSE BOT is formulating response...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick-reply chips */}
          <div className="px-3 py-2 bg-gray-900/90 border-t border-gray-800 flex overflow-x-auto gap-1.5 no-scrollbar">
            {quickReplyChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-emerald-300 text-[10px] font-medium rounded-full whitespace-nowrap transition border border-gray-700 shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-gray-900 border-t border-gray-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask PULSE BOT anything..."
              className="flex-1 bg-[#14171D] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:border-emerald-500 outline-none"
            />
            <button
              id="btn-send-chat-message"
              disabled={loading}
              onClick={() => handleSendMessage()}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl transition font-bold disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
