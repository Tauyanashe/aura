import { supabase, isMockMode } from '../lib/supabase';

const CONVERSATIONS_KEY = 'aura_mock_conversations';
const MESSAGES_KEY = 'aura_mock_messages';

// No hardcoded mock users — populated dynamically from registered users
export const MOCK_USERS = {};

function getConvStore() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) || [] : [];
  } catch { return []; }
}

function getMsgStore() {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) || [] : [];
  } catch { return []; }
}

function saveConvStore(d) { localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(d)); }
function saveMsgStore(d) { localStorage.setItem(MESSAGES_KEY, JSON.stringify(d)); }

export const chatService = {
  async getConversations(userId) {
    if (isMockMode) {
      const convs = getConvStore().filter(c => c.participants.includes(userId));
      const msgs = getMsgStore();
      return convs.map(c => {
        const otherId = c.participants.find(p => p !== userId);
        const otherUser = MOCK_USERS[otherId] || { id: otherId, username: 'unknown', display_name: 'Unknown User', avatar: null };
        const lastMsg = msgs.filter(m => m.conversationId === c.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        return { ...c, otherUser, lastMessage: lastMsg || null };
      }).sort((a,b) => {
        const ta = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.createdAt);
        const tb = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.createdAt);
        return tb - ta;
      });
    }
    return [];
  },

  async getMessages(conversationId) {
    if (isMockMode) {
      return getMsgStore().filter(m => m.conversationId === conversationId).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    return [];
  },

  async sendMessage(conversationId, senderId, body) {
    if (isMockMode) {
      const msg = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
        conversationId,
        senderId,
        body: body.trim(),
        createdAt: new Date().toISOString()
      };
      const store = getMsgStore();
      store.push(msg);
      saveMsgStore(store);
      return msg;
    }
    return null;
  },

  async startConversation(userId, targetUserId) {
    if (isMockMode) {
      const convs = getConvStore();
      const existing = convs.find(c => c.participants.includes(userId) && c.participants.includes(targetUserId));
      if (existing) return existing;
      const newConv = {
        id: 'conv-' + Date.now(),
        participants: [userId, targetUserId],
        createdAt: new Date().toISOString()
      };
      convs.push(newConv);
      saveConvStore(convs);
      return newConv;
    }
    return null;
  },

  async getKnownUsers(excludeUserId) {
    if (isMockMode) {
      return Object.values(MOCK_USERS).filter(u => u.id !== excludeUserId);
    }
    return [];
  },

  getMockUsers() { return MOCK_USERS; },
};
