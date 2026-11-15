import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Search,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Check,
  CheckCheck,
  User,
  X
} from 'lucide-react';
import { chatService } from '../../services/chat.service';
import { Avatar } from '../../components/common/Avatar';
import clsx from 'clsx';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ChatView({ currentUser }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [knownUsers, setKnownUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations on mount or currentUser change
  const refreshConversations = async () => {
    if (!currentUser) return;
    const list = await chatService.getConversations(currentUser.id);
    setConversations(list);
    if (!activeConversationId && list.length > 0) {
      // On desktop, auto-select first conversation
      if (window.innerWidth >= 768) {
        setActiveConversationId(list[0].id);
      }
    }
  };

  useEffect(() => {
    refreshConversations();
    if (currentUser) {
      chatService.getKnownUsers(currentUser.id).then(setKnownUsers);
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    chatService.getMessages(activeConversationId).then(setMessages);
  }, [activeConversationId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId || !currentUser) return;
    const text = messageInput;
    setMessageInput('');
    const newMsg = await chatService.sendMessage(activeConversationId, currentUser.id, text);
    if (newMsg) {
      setMessages(prev => [...prev, newMsg]);
      await refreshConversations();
    }
  };

  const handleStartNewChat = async (targetUser) => {
    if (!currentUser) return;
    setLoading(true);
    const conv = await chatService.startConversation(currentUser.id, targetUser.id);
    setNewChatModalOpen(false);
    setLoading(false);
    await refreshConversations();
    setActiveConversationId(conv.id);
  };

  const filteredConversations = conversations.filter(c => {
    const name = c.otherUser?.display_name || '';
    const username = c.otherUser?.username || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || username.toLowerCase().includes(q);
  });

  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden h-[calc(100dvh-150px)] min-h-[460px] flex flex-col sm:flex-row relative foldable-split-container">
      {/* ─── LEFT: Conversation List (Dual-pane on foldables & tablets) ── */}
      <div
        className={clsx(
          'w-full sm:w-64 md:w-72 lg:w-80 border-r border-slate-800 flex flex-col flex-shrink-0 bg-slate-950/40 foldable-left-pane',
          activeConversationId ? 'hidden sm:flex' : 'flex'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <h2 className="font-black text-white text-base">Direct Messages</h2>
          </div>
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white transition"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-3">
              <p>No conversations yet.</p>
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 font-bold hover:bg-purple-600 hover:text-white transition"
              >
                Start a Chat
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              const other = conv.otherUser;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={clsx(
                    'p-3.5 flex items-center gap-3 cursor-pointer transition',
                    isSelected
                      ? 'bg-purple-600/20 border-l-4 border-purple-500'
                      : 'hover:bg-slate-900/50'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={other.avatar}
                      userId={other.id}
                      displayName={other.display_name}
                      username={other.username}
                      size="md"
                      ring="ring-purple-500/20"
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 ring-2 ring-slate-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate">
                        {other.display_name}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatTime(conv.lastMessage?.createdAt || conv.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[11px] text-slate-400 truncate pr-2">
                        {conv.lastMessage ? conv.lastMessage.body : 'Conversation started'}
                      </p>
                      {other.gender && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 border border-slate-700">
                          {other.gender === 'female' ? '♀' : '♂'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT: Active Thread ─────────────────────────────────────── */}
      <div
        className={clsx(
          'flex-1 flex flex-col bg-slate-900/20 foldable-right-pane',
          !activeConversationId ? 'hidden sm:flex' : 'flex'
        )}
      >
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="p-3 sm:p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 backdrop-blur-md">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Mobile Back Button (only on small phone / cover screen) */}
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="sm:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  <Avatar
                    src={activeConversation.otherUser?.avatar}
                    userId={activeConversation.otherUser?.id}
                    displayName={activeConversation.otherUser?.display_name}
                    username={activeConversation.otherUser?.username}
                    size="sm"
                    ring="ring-purple-500/30"
                  />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0 ring-1.5 ring-slate-950" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">
                      {activeConversation.otherUser?.display_name}
                    </h3>
                    <span className="text-[10px] text-purple-400 font-mono">
                      @{activeConversation.otherUser?.username}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    Active in Beta Network
                  </span>
                </div>
              </div>

              {activeConversation.otherUser?.gender && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                  {activeConversation.otherUser.gender === 'female' ? '👑 Aura Queen' : '👑 Aura King'}
                </span>
              )}
            </div>

            {/* Message Thread Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-12">
                  <Sparkles className="w-8 h-8 text-purple-400/50" />
                  <p className="text-xs">No messages yet. Send a greeting to start chatting!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={clsx('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}
                    >
                      {!isMine && (
                        <Avatar
                          src={activeConversation.otherUser?.avatar}
                          userId={activeConversation.otherUser?.id}
                          displayName={activeConversation.otherUser?.display_name}
                          username={activeConversation.otherUser?.username}
                          size="xs"
                          ring="ring-purple-500/30 mb-0.5"
                        />
                      )}

                      <div
                        className={clsx(
                          'max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md leading-relaxed break-words',
                          isMine
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                        )}
                      >
                        <p>{msg.body}</p>
                        <div
                          className={clsx(
                            'text-[9px] mt-1 flex items-center gap-1',
                            isMine ? 'text-purple-200 justify-end' : 'text-slate-400'
                          )}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMine && <CheckCheck className="w-3 h-3 text-purple-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Message @${activeConversation.otherUser?.username || 'user'}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-600/20 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 text-base">Your Conversations</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Select an existing conversation from the list or start a new thread with creators in the beta network.
              </p>
            </div>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold hover:from-purple-500 hover:to-pink-500 transition shadow-md shadow-purple-500/20"
            >
              Start New Message
            </button>
          </div>
        )}
      </div>

      {/* ─── Modal: New Chat Picker ───────────────────────────────────── */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl border border-slate-700 w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <h3 className="font-black text-white text-base">New Message</h3>
              </div>
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select a creator from the verified AURA network to start a direct message:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {knownUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartNewChat(user)}
                  className="pt-2 pb-2 px-3 rounded-2xl flex items-center justify-between hover:bg-slate-800/60 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user.avatar}
                      userId={user.id}
                      displayName={user.display_name}
                      username={user.username}
                      size="md"
                      ring="ring-purple-500/20"
                    />
                    <div>
                      <span className="font-bold text-xs text-white block">{user.display_name}</span>
                      <span className="text-[11px] text-purple-400 font-mono">@{user.username}</span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/20">
                    {user.gender === 'female' ? '👑 Queen' : '👑 King'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
