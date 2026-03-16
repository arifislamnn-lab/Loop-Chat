import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Loader2, UserX, UserPlus, MessageSquarePlus, Users, X, Infinity, Smile, Reply, FastForward, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'partner';
  timestamp: number;
  replyTo?: {
    id: string;
    text: string;
    sender: 'me' | 'partner';
  };
}

type ConnectionState = 'disconnected' | 'searching' | 'connected';

export const ChatInterface: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isPartnerDisconnected, setIsPartnerDisconnected] = useState(false);
  const [stats, setStats] = useState({ activeUsers: 0, totalChats: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('stats_update', (newStats: { activeUsers: number; totalChats: number }) => {
      setStats(newStats);
    });

    newSocket.on('waiting_for_partner', () => {
      setConnectionState('searching');
      setIsPartnerDisconnected(false);
      setMessages([]);
    });

    newSocket.on('partner_found', () => {
      setConnectionState('connected');
      setIsPartnerDisconnected(false);
      setMessages([]);
    });

    newSocket.on('receive_message', (data: { message: string; senderId: string; replyTo?: Message['replyTo'] }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          text: data.message,
          sender: 'partner',
          timestamp: Date.now(),
          replyTo: data.replyTo,
        },
      ]);
      setIsPartnerTyping(false);
    });

    newSocket.on('partner_typing', (isTyping: boolean) => {
      setIsPartnerTyping(isTyping);
    });

    newSocket.on('partner_left', () => {
      setIsPartnerDisconnected(true);
      setIsPartnerTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'system-left',
          text: 'Stranger has disconnected.',
          sender: 'partner',
          timestamp: Date.now(),
        },
      ]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const startSearching = () => {
    if (socket) {
      setConnectionState('searching');
      setIsPartnerDisconnected(false);
      setMessages([]);
      socket.emit('find_partner');
    }
  };

  const stopChatting = () => {
    if (socket) {
      socket.emit('leave_chat');
      setConnectionState('disconnected');
      setIsPartnerDisconnected(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || connectionState !== 'connected' || !socket) return;

    const messageText = inputValue.trim();
    const replyData = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text,
      sender: replyingTo.sender
    } : undefined;

    setInputValue('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing', false);

    socket.emit('send_message', { message: messageText, replyTo: replyData });
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        text: messageText,
        sender: 'me',
        timestamp: Date.now(),
        replyTo: replyData,
      },
    ]);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputValue((prev) => prev + emojiData.emoji);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (connectionState !== 'connected' || !socket) return;

    socket.emit('typing', true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false);
    }, 1500);
  };

  const nextChat = () => {
    if (socket) {
      socket.emit('leave_chat');
      setConnectionState('searching');
      setIsPartnerDisconnected(false);
      setMessages([]);
      // Small delay to ensure leave_chat is processed before finding a new partner
      setTimeout(() => {
        socket.emit('find_partner');
      }, 100);
    }
  };

  if (connectionState === 'disconnected') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="max-w-md w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-8 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-blue-500/30">
            <Infinity className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">Loop Chat</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-lg leading-relaxed">
            Connect with random strangers around the world instantly and anonymously.
          </p>
          
          <div className="flex gap-6 mb-10 w-full justify-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.activeUsers}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">Online Now</span>
            </div>
            <div className="w-px bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalChats}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">Total Chats</span>
            </div>
          </div>

          <button
            onClick={startSearching}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-lg transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            Start Chatting
          </button>
        </motion.div>
      </div>
    );
  }

  if (connectionState === 'searching') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full flex flex-col items-center"
        >
          <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900/30 rounded-full animate-ping [animation-duration:3s]" />
            <div className="absolute inset-4 border-4 border-blue-300 dark:border-blue-800/40 rounded-full animate-ping [animation-duration:2s]" />
            <div className="relative bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl shadow-blue-600/40">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">Looking for someone...</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 text-lg">Please wait while we connect you with a stranger.</p>
          <button
            onClick={stopChatting}
            className="px-8 py-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-full font-medium transition-all active:scale-95 shadow-sm"
          >
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-white dark:bg-zinc-950 shadow-sm sm:border-x border-zinc-200 dark:border-zinc-800 relative">
      {/* Status Bar */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-3 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {!isPartnerDisconnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={clsx("relative inline-flex rounded-full h-3 w-3", isPartnerDisconnected ? "bg-zinc-400" : "bg-emerald-500")}></span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-900 dark:text-zinc-100 text-sm font-semibold leading-tight">Stranger</span>
            <span className={clsx("text-xs font-medium", isPartnerDisconnected ? "text-zinc-500" : "text-emerald-500 dark:text-emerald-400")}>
              {isPartnerDisconnected ? 'Disconnected' : 'Online'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={stopChatting}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5"
            title="Leave Chat"
          >
            <span>Leave Chat</span>
            <StopCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-transparent">
        {messages.length === 0 && (
          <div className="flex justify-center mt-8">
            <div className="bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm text-zinc-500 dark:text-zinc-400 text-sm py-2 px-5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
              You're now chatting with a random stranger. Say hi!
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={clsx(
                'flex max-w-[90%] sm:max-w-[75%] md:max-w-[65%] group relative',
                msg.sender === 'me' ? 'ml-auto justify-end' : 'mr-auto justify-start'
              )}
            >
              {msg.sender === 'me' && msg.id !== 'system-left' && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -left-10 sm:-left-12 top-1/2 -translate-y-1/2">
                  <button 
                    onClick={() => setReplyingTo(msg)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-col">
                {msg.replyTo && (
                  <div className={clsx(
                    "text-xs px-3 py-1.5 mb-1 rounded-xl truncate max-w-[200px] sm:max-w-[300px] opacity-80",
                    msg.sender === 'me' 
                      ? "bg-blue-700/50 text-blue-100 self-end rounded-br-sm" 
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 self-start rounded-bl-sm"
                  )}>
                    <span className="font-semibold mr-1">{msg.replyTo.sender === 'me' ? 'You' : 'Stranger'}:</span>
                    {msg.replyTo.text}
                  </div>
                )}
                <div
                  className={clsx(
                    'px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl sm:rounded-3xl text-[14px] sm:text-[15px] leading-relaxed break-words shadow-sm',
                    msg.sender === 'me'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : msg.id === 'system-left'
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm italic w-full text-center rounded-2xl shadow-none border border-zinc-200/50 dark:border-zinc-800/50'
                      : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200/50 dark:border-zinc-800/50 rounded-bl-sm'
                  )}
                >
                  {msg.text}
                </div>
              </div>
              {msg.sender === 'partner' && msg.id !== 'system-left' && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-10 sm:-right-12 top-1/2 -translate-y-1/2">
                  <button 
                    onClick={() => setReplyingTo(msg)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isPartnerTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex mr-auto justify-start max-w-[80%]"
          >
            <div className="px-5 py-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 sm:p-4 md:p-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 shrink-0 z-10 relative">
        {isPartnerDisconnected ? (
          <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
            <button
              onClick={nextChat}
              className="px-6 py-3 sm:px-8 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm sm:text-base transition-all active:scale-95 shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              Find a new stranger
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex flex-col relative">
            {replyingTo && (
              <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 sm:px-4 sm:py-2 rounded-t-2xl border-x border-t border-zinc-200/50 dark:border-zinc-700/50 -mb-2 pb-4">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Replying to {replyingTo.sender === 'me' ? 'yourself' : 'stranger'}
                  </span>
                  <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 truncate">
                    {replyingTo.text}
                  </span>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className={clsx("flex items-center gap-2 sm:gap-3 relative z-10", replyingTo ? "" : "")}>
              <div className="relative flex-1 flex items-center bg-zinc-100/80 dark:bg-zinc-800/80 border border-transparent focus-within:border-blue-300 dark:focus-within:border-blue-600 rounded-full shadow-inner transition-all">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent px-4 py-3 sm:px-6 sm:py-3.5 text-[14px] sm:text-[15px] text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400"
                />
                <div className="relative pr-1 sm:pr-2" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-[-40px] sm:right-0 mb-2 z-50">
                      <EmojiPicker 
                        onEmojiClick={onEmojiClick}
                        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                      />
                    </div>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-3 sm:p-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white rounded-full transition-all flex-shrink-0 shadow-md shadow-blue-600/20 disabled:shadow-none active:scale-95"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
