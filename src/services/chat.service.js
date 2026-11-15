import { supabase, isMockMode } from '../lib/supabase';

const CONVERSATIONS_KEY = 'aura_mock_conversations';
const MESSAGES_KEY = 'aura_mock_messages';

// Mock users known to the system
export const MOCK_USERS = {
  'user-elena-001': { id: 'user-elena-001', username: 'elena_v', display_name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80', gender: 'female' },
  'user-admin-002': { id: 'user-admin-002', username: 'aura_admin', display_name: 'AURA Beta Mod', avatar: null, gender: 'male' },
  'user-marcus-003': { id: 'user-marcus-003', username: 'marcus_k', display_name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80', gender: 'male' },
  'user-sylvia-004': { id: 'user-sylvia-004', username: 'sylvia_art', display_name: 'Sylvia Chen', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80', gender: 'female' },
};

const DEFAULT_CONVERSATIONS = [
  {
    id: 'conv-sample-1',
    participants: ['user-elena-001', 'user-marcus-003'],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'conv-sample-2',
    participants: ['user-elena-001', 'user-sylvia-004'],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'conv-sample-3',
    participants: ['user-elena-001', 'user-admin-002'],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

const DEFAULT_MESSAGES = [
  {
    id: 'msg-s1',
    conversationId: 'conv-sample-1',
    senderId: 'user-marcus-003',
    body: 'Hey Elena! Loved your new chromatic study in the feed. The color harmonics are stunning.',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'msg-s2',
    conversationId: 'conv-sample-1',
    senderId: 'user-elena-001',
    body: 'Thanks Marcus! I mapped the frequency curves to procedural noise. How is your analog synth album coming along?',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-s3',
    conversationId: 'conv-sample-1',
    senderId: 'user-marcus-003',
    body: 'Mastering the first 4 stems today. Aiming to publish with Creator Pro farm capacity this Friday!',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'msg-s4',
    conversationId: 'conv-sample-2',
    senderId: 'user-sylvia-004',
    body: 'Congrats on hitting Rank #1 Daily Queen yesterday! Your Aura Score velocity is incredible.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'msg-s5',
    conversationId: 'conv-sample-3',
    senderId: 'user-admin-002',
    body: 'Welcome to the AURA Beta creator cluster. Let us know if you run into any storage adapter sync delays.',
    createdAt: new Date(Date.now() - 3600000 * 46).toISOString(),
  },
];

function getConvStore() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(DEFAULT_CONVERSATIONS));
      return DEFAULT_CONVERSATIONS;
    }
    return JSON.parse(raw) || [];
  } catch {
    return DEFAULT_CONVERSATIONS;
  }
}

function getMsgStore() {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(DEFAULT_MESSAGES));
      return DEFAULT_MESSAGES;
    }
    return JSON.parse(raw) || [];
  } catch {
    return DEFAULT_MESSAGES;
  }
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
