import { supabase, isMockMode } from '../lib/supabase';

// Persistent mock state for seamless local beta testing
const MOCK_STORAGE_KEY = 'aura_beta_auth_session';

const DEMO_USERS = [
  {
    id: 'user-elena-001',
    email: 'elena@aura.network',
    username: 'elena_v',
    display_name: 'Elena Rostova',
    bio: 'Digital artist & photographer exploring generative visual patterns.',
    is_private: false,
    role: 'user',
    balance: 420,
    auraScore: 780,
    tier: 'Artisan',
    farms: ['farm-pioneer'],
    gender: 'female',
  },
  {
    id: 'user-admin-002',
    email: 'moderator@aura.network',
    username: 'aura_admin',
    display_name: 'AURA Beta Mod',
    bio: 'Platform integrity, community guidelines, and beta operations.',
    is_private: false,
    role: 'admin',
    balance: 1500,
    auraScore: 2450,
    tier: 'Legend',
    farms: ['farm-creator-pro'],
    gender: 'male',
  },
];

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
      // Return Elena as default demo user
      const defaultUser = DEMO_USERS[0];
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(defaultUser));
      return defaultUser;
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
      const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        username: email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase(),
        display_name: email.split('@')[0],
        bio: 'AURA Beta Member',
        is_private: false,
        role: 'user',
        balance: 100,
        auraScore: 100,
        tier: 'Novice',
        farms: ['farm-free'],
      };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(found));
      return found;
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
        bio: 'New AURA Explorer',
        is_private: false,
        role: 'user',
        balance: 100, // 100 AP Welcome Bonus
        auraScore: 100,
        tier: 'Novice',
        farms: ['farm-free'],
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

  async switchDemoAccount(targetEmail) {
    const user = DEMO_USERS.find(u => u.email === targetEmail) || DEMO_USERS[0];
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async logout() {
    if (isMockMode) {
      localStorage.removeItem(MOCK_STORAGE_KEY);
      return;
    }
    await supabase.auth.signOut();
  },
};
