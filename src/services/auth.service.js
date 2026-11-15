import { supabase, isMockMode } from '../lib/supabase';

// Persistent mock state for seamless local beta testing
const MOCK_STORAGE_KEY = 'aura_beta_auth_session';

// No hardcoded demo users — all accounts are real user registrations
const DEMO_USERS = [];

export const authService = {
  async getCurrentSession() {
    if (isMockMode) {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback
        }
      }
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email,
      ...profile,
      role: profile?.user_roles?.[0]?.role || 'user',
    };
  },

  async login(email, password) {
    if (isMockMode) {
      // In mock mode, any email/password combo creates or retrieves a session
      const existing = localStorage.getItem(MOCK_STORAGE_KEY);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed.email === email) return parsed;
        } catch { /* continue */ }
      }
      const user = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        username: email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
        display_name: email.split('@')[0],
        avatar: null,
        bio: '',
        is_private: false,
        role: 'user',
        balance: 100,
        auraScore: 100,
        tier: 'Novice',
        farms: [],
        gender: 'other',
      };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
      return user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return this.getCurrentSession();
  },

  async register(email, password, username, displayName, gender) {
    if (isMockMode) {
      const newUser = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        display_name: displayName,
        avatar: null,
        bio: '',
        is_private: false,
        role: 'user',
        balance: 100, // 100 AP Welcome Bonus
        auraScore: 100,
        tier: 'Novice',
        farms: [],
        gender: gender || 'other',
      };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newUser));
      return newUser;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: displayName, gender },
      },
    });
    if (error) throw error;
    return data.user;
  },

  async forgotPassword(email) {
    if (isMockMode) {
      await new Promise(r => setTimeout(r, 1000));
      return { success: true };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
    return { success: true };
  },

  async updateProfile(userId, updates) {
    if (isMockMode) {
      const stored = localStorage.getItem(MOCK_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        if (user.id === userId) {
          Object.assign(user, updates);
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
          return user;
        }
      }
      return null;
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async logout() {
    if (isMockMode) {
      localStorage.removeItem(MOCK_STORAGE_KEY);
      return;
    }
    await supabase.auth.signOut();
  },
};
