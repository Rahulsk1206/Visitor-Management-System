import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Securely fetch the API key from the local .env file
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(API_KEY);

// Context for the AI to "know" about the building
const SYSTEM_PROMPT = `
You are 'Aura', the friendly and professional AI Concierge for the 'VisitorMS' facility.
You are interacting with visitors who are using the self-check-in kiosk in the main lobby.
Keep your answers brief, polite, and helpful (max 2-3 sentences). Do not use markdown headers.

Here is what you know about the facility:
- **Wi-Fi**: Network is 'Guest_Net' and password is 'Welcome2026!'
- **Restrooms**: Down the hallway to the left of the reception desk.
- **Cafeteria**: On the 2nd floor, open from 8:00 AM to 3:00 PM.
- **Parking**: Validation is available at the reception desk for the underground garage.
- **Meeting Rooms**: Block A is on the 3rd floor, Block B is on the 4th floor.
- **Marketing Department**: Located on the 5th floor.
- **Human Resources (HR)**: Located on the 2nd floor, room 204.
- **Security / Lost & Found**: Located near the main entrance.
- **How to Check-in**: Visitors must fill out the form on this screen.

If a visitor asks a question unrelated to the facility (like general trivia or coding), politely remind them that you are the building's digital receptionist and can only help with facility-related questions.
`;

const INITIAL_MSG = { role: 'model', parts: [{ text: "Hi! I'm Aura, the digital concierge. Ask me about Wi-Fi, restrooms, or where to find your meeting room." }] };

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [inputTitle, setInputTitle] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Setup Gemini chat instance
  useEffect(() => {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }], role: 'system' }
      });
      chatRef.current = model.startChat({ history: [] });
    } catch (e) {
      console.error("Failed to init AI:", e);
    }
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputTitle.trim() || loading || !chatRef.current) return;

    const userMsg = inputTitle.trim();
    setInputTitle('');
    setMessages((prev) => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    setLoading(true);

    const startTime = Date.now();

    try {
      // Send the message to Gemini
      const result = await chatRef.current.sendMessage(userMsg);
      const botResponse = result.response.text();
      
      // Force the system to wait AT LEAST 20 seconds before showing the answer
      const elapsed = Date.now() - startTime;
      if (elapsed < 20000) {
        await new Promise(resolve => setTimeout(resolve, 20000 - elapsed));
      }

      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: botResponse }] }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      
      // Also force the 20-second wait on errors so it doesn't fail instantly
      const elapsed = Date.now() - startTime;
      if (elapsed < 20000) {
        await new Promise(resolve => setTimeout(resolve, 20000 - elapsed));
      }
      
      setMessages((prev) => [...prev, { role: 'model', parts: [{ text: "Sorry, I am currently recalibrating my AI core. Please check back with me soon or ask the reception desk!" }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Toggle Button ─────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl z-[100]
                   flex items-center justify-center transition-transform hover:scale-110 active:scale-95
                   ${isOpen ? 'bg-slate-700 text-white' : 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-brand-900/50'}`}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? (
          <svg className="w-6 h-6 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* ── Chat Window ────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] max-h-[500px] h-[calc(100vh-140px)] z-[100]
                        bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl
                        shadow-2xl flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-900/80 to-slate-900 p-4 border-b border-slate-800 flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                A
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Aura Concierge</h3>
              <p className="text-brand-300 text-[11px] flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Assistant connected
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-brand-600 text-white rounded-tr-sm' 
                          : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-sm shadow-sm'
                      }`}>
                    {msg.parts[0].text}
                  </div>
                </div>
              );
            })}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="Ask about Wi-Fi, restrooms..."
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-4 pr-12 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all placeholder:text-slate-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!inputTitle.trim() || loading}
                className="absolute right-2 p-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-brand-600"
              >
                <svg className="w-4 h-4 translate-x-px translate-y-px" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-500">Powered by ✨ Google Gemini AI</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
