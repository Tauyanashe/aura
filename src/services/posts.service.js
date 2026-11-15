import { supabase, isMockMode } from '../lib/supabase';
import { AP_REWARDS } from '../lib/constants';

const MOCK_POSTS_KEY = 'aura_mock_posts';

// No hardcoded test posts — feed starts empty for real users
const INITIAL_MOCK_POSTS = [];

export const postsService = {
  async getFeed(currentUserId, filter = 'latest') {
    if (isMockMode) {
      let posts = JSON.parse(localStorage.getItem(MOCK_POSTS_KEY) || 'null');
      if (!posts) {
        posts = INITIAL_MOCK_POSTS;
        localStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(posts));
      }

      // Filter visible
      let visible = posts.filter(p => p.status === 'published');

      if (filter === 'top-rated') {
        visible.sort((a, b) => b.ratingAverage - a.ratingAverage);
      } else {
        visible.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return visible;
    }

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, username, display_name, avatar_media_id),
        media_assets(*),
        likes(user_id),
        ratings(user_id, score)
      `)
      .eq('status', 'published');

    if (filter === 'top-rated') {
      query = query.order('rating_average', { ascending: false });
    } else {
      query = query.order('published_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(p => ({
      ...p,
      author: p.profiles,
      mediaAsset: p.media_assets?.[0],
      hasLiked: p.likes?.some(l => l.user_id === currentUserId),
      userRating: p.ratings?.find(r => r.user_id === currentUserId)?.score || null,
    }));
  },

  async publishPost({ currentUserId, currentUser, caption, media, visibility = 'public' }) {
    if (isMockMode) {
      const posts = JSON.parse(localStorage.getItem(MOCK_POSTS_KEY) || JSON.stringify(INITIAL_MOCK_POSTS));
      const newPostId = 'post-' + Math.random().toString(36).substring(2, 9);

      const newPost = {
        id: newPostId,
        userId: currentUserId,
        author: {
          id: currentUserId,
          username: currentUser.username,
          displayName: currentUser.display_name,
          avatar: currentUser.avatar || null,
          tier: currentUser.tier || 'Novice',
        },
        caption,
        status: 'published',
        visibility,
        mediaAsset: {
          id: media.id,
          mimeType: media.mime_type || 'image/jpeg',
          sizeBytes: media.size_bytes || 2000000,
          url: media.dataUrl || media.url,
        },
        likesCount: 0,
        commentsCount: 0,
        ratingsCount: 0,
        ratingAverage: 0.0,
        hasLiked: false,
        userRating: null,
        createdAt: new Date().toISOString(),
        comments: [],
      };

      posts.unshift(newPost);
      localStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(posts));

      // Award mock AP
      const walletKey = `aura_mock_wallets_${currentUserId}`;
      const wallet = JSON.parse(localStorage.getItem(walletKey) || '{"balance": 100, "transactions": []}');
      wallet.balance += AP_REWARDS.POST_PUBLISH;
      wallet.transactions.unshift({
        id: 'tx-' + Math.random().toString(36).substring(2, 9),
        amount: AP_REWARDS.POST_PUBLISH,
        transactionType: 'post_published',
        description: `Published: ${caption.substring(0, 30)}...`,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(walletKey, JSON.stringify(wallet));

      return newPost;
    }

    // Call Supabase Edge Function 'publish-post'
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Create draft post first
    const { data: postDraft, error: draftErr } = await supabase
      .from('posts')
      .insert({
        user_id: currentUserId,
        caption,
        visibility,
        status: 'draft',
      })
      .select()
      .single();

    if (draftErr) throw draftErr;

    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        postId: postDraft.id,
        mediaId: media.id,
        reservationId: media.reservationId,
        caption,
        visibility,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Failed to publish post');
    }

    return resp.json();
  },

  async deletePost(postId, currentUserId) {
    if (isMockMode) {
      let posts = JSON.parse(localStorage.getItem(MOCK_POSTS_KEY) || '[]');
      posts = posts.filter(p => p.id !== postId);
      localStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(posts));
      return { success: true };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ postId }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Delete failed');
    }

    return resp.json();
  },

  async toggleLike(postId, currentUserId) {
    if (isMockMode) {
      const posts = JSON.parse(localStorage.getItem(MOCK_POSTS_KEY) || '[]');
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.hasLiked = !post.hasLiked;
        post.likesCount += post.hasLiked ? 1 : -1;
        localStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(posts));
      }
      return { hasLiked: post?.hasLiked, likesCount: post?.likesCount };
    }

    const { data, error } = await supabase.rpc('fn_process_social_engagement', {
      p_user_id: currentUserId,
      p_post_id: postId,
      p_action: 'like',
    });

    if (error) throw error;
    return data;
  },

  async submitRating(postId, currentUserId, score) {
    if (isMockMode) {
      const posts = JSON.parse(localStorage.getItem(MOCK_POSTS_KEY) || '[]');
      const post = posts.find(p => p.id === postId);
      if (post) {
        if (post.userId === currentUserId) {
          throw new Error('Anti-fraud rule: You cannot rate your own post.');
        }
        post.userRating = score;
        post.ratingsCount += 1;
        post.ratingAverage = Number(((post.ratingAverage * (post.ratingsCount - 1) + score) / post.ratingsCount).toFixed(2));
        localStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(posts));
      }
      return { ratingAverage: post?.ratingAverage, ratingsCount: post?.ratingsCount, userRating: score };
    }

    const { data, error } = await supabase.rpc('fn_process_social_engagement', {
      p_user_id: currentUserId,
      p_post_id: postId,
      p_action: 'rate',
      p_rating_score: score,
    });

    if (error) throw error;
    return data;
  },

  async addComment(postId, currentUserId, currentUser, body) {
    if (isMockMode) {
      const posts = JSON.parse(localStorage.getItem(MOCK_POSTS_KEY) || '[]');
      const post = posts.find(p => p.id === postId);
      if (post) {
        const comment = {
          id: 'c-' + Math.random().toString(36).substring(2, 9),
          username: currentUser.username,
          displayName: currentUser.display_name,
          body,
          createdAt: new Date().toISOString(),
        };
        post.comments = post.comments || [];
        post.comments.push(comment);
        post.commentsCount = post.comments.length;
        localStorage.setItem(MOCK_POSTS_KEY, JSON.stringify(posts));
        return comment;
      }
      throw new Error('Post not found');
    }

    const { data, error } = await supabase.rpc('fn_process_social_engagement', {
      p_user_id: currentUserId,
      p_post_id: postId,
      p_action: 'comment',
      p_comment_body: body,
    });

    if (error) throw error;
    return data;
  },
};
