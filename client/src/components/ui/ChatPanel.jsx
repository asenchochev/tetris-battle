import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

const RANK_COLORS = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700', Diamond: '#b9f2ff', Master: '#ff00ff' };

function ChatMessage({ msg }) {
  const rankColor = RANK_COLORS[msg.rank] || '#888';
  const isSystem = msg.type === 'system';
  return (
    <div className={`flex gap-2 items-start text-xs py-0.5 ${isSystem ? 'justify-center' : ''}`}>
      {isSystem ? (
        <span className="text-gray-600 italic font-mono">{msg.message}</span>
      ) : (
        <>
          <span className="shrink-0 text-base leading-none">{msg.avatar || '🎮'}</span>
          <div className="min-w-0">
            <span className="font-mono font-bold mr-1" style={{ color: rankColor }}>{msg.nickname}</span>
            <span className="text-gray-300 break-words">{msg.message}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function ChatPanel() {
  const { globalMessages, roomMessages, socket, currentRoom, activeTab, showChat, toggleChat } = useGameStore();
  const [input, setInput] = useState('');
  const [chatTab, setChatTab] = useState('global');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const messages = chatTab === 'global' ? globalMessages : roomMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const msg = input.trim();
    if (!msg || !socket) return;
    if (chatTab === 'global') {
      socket.emit('chat:global', msg);
    } else {
      socket.emit('chat:room', msg);
    }
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white border-opacity-5 flex-shrink-0">
        <div className="flex gap-1">
          {['global', 'room'].map(tab => (
            <button
              key={tab}
              disabled={tab === 'room' && !currentRoom}
              className={`px-3 py-1 rounded text-xs font-display uppercase tracking-wider transition-all ${chatTab === tab ? 'bg-blue-500 bg-opacity-20 text-blue-400' : 'text-gray-600 hover:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed'}`}
              onClick={() => setChatTab(tab)}
            >{tab}</button>
          ))}
        </div>
        <button
          className="text-gray-600 hover:text-gray-400 transition-colors text-xs"
          onClick={toggleChat}
        >{showChat ? '✕' : '💬'}</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id || Math.random()}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChatMessage msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
        {messages.length === 0 && (
          <div className="text-center text-gray-700 text-xs font-mono mt-4">No messages yet</div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-white border-opacity-5 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 bg-dark-900 border border-white border-opacity-10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-blue-500 focus:border-opacity-50 font-body"
            placeholder={`${chatTab === 'global' ? 'Global' : 'Room'} chat...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            maxLength={200}
          />
          <button
            className="px-2 py-1.5 rounded border border-blue-500 border-opacity-30 text-blue-400 text-xs hover:bg-blue-500 hover:bg-opacity-10 transition-all font-mono"
            onClick={sendMessage}
          >→</button>
        </div>
      </div>
    </div>
  );
}
