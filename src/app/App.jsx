import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from '../components/navigation/Navbar';
import { Sidebar } from '../components/navigation/Sidebar';
import { RightSidebar } from '../components/navigation/RightSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { StoriesBar } from '../features/feed/StoriesBar';
import { PostCard } from '../components/cards/PostCard';
import { WalletCard } from '../components/cards/WalletCard';
import { FarmsView } from '../features/farms/FarmsView';
import { AuraScoreView } from '../features/aura-score/AuraScoreView';
import { LeaderboardView } from '../features/leaderboard/LeaderboardView';
import { ModerationDashboard } from '../features/moderation/ModerationDashboard';
import { ProfileView } from '../features/profile/ProfileView';
import { ExploreView } from '../features/explore/ExploreView';
import { AnalyticsView } from '../features/analytics/AnalyticsView';
import { SavedPostsView } from '../features/saved/SavedPostsView';
import { CreatePostModal } from '../features/posts/CreatePostModal';
import { ReportModal } from '../features/moderation/ReportModal';
import { ShareModal } from '../components/common/ShareModal';
import { NotificationsDrawer } from '../features/notifications/NotificationsDrawer';
import { LandingPage } from '../features/landing/LandingPage';
import { AuthPage } from '../features/auth/AuthPage';
import { ChatView } from '../features/chat/ChatView';
import { authService } from '../services/auth.service';
import { postsService } from '../services/posts.service';
import { farmsService } from '../services/farms.service';
import { auraService } from '../services/aura.service';

// ─── View mode states ───────────────────────────────────────────────────────
// 'landing' → public landing/rankings page
// 'auth'    → sign in / sign up / password recovery
// 'app'     → main authenticated app shell

export function App() {
  const [viewMode, setViewMode] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [feedFilter, setFeedFilter] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [farmStatus, setFarmStatus] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [auraScore, setAuraScore] = useState(null);
  const [savedPostIds, setSavedPostIds] = useState(new Set(['post-101']));

  // Modals & Drawers
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Public profile viewer — clicking another user's name/avatar
  const [viewingProfileUser, setViewingProfileUser] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ─── Data loading ─────────────────────────────────────────────────────────
  const loadUserData = async (user) => {
    if (!user) return;
    try {
      const [status, userWallet, score, feedPosts, cat] = await Promise.all([
        farmsService.getUserFarmStatus(user.id),
        auraService.getWallet(user.id),
        auraService.getAuraScore(user.id),
        postsService.getFeed(user.id, feedFilter),
        farmsService.getCatalogue(),
      ]);
      setFarmStatus(status);
      setWallet(userWallet);
      setAuraScore(score);
      setPosts(feedPosts);
      setCatalogue(cat);
    } catch (err) {
      console.error('Error loading initial app data:', err);
    }
  };

  // On mount: check for existing session — skip landing if already logged in
  useEffect(() => {
    authService.getCurrentSession().then((user) => {
      if (user) {
        setCurrentUser(user);
        setViewMode('app');
        loadUserData(user);
      }
      // Otherwise stay on landing
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload feed when filter changes (only while in app)
  useEffect(() => {
    if (currentUser && viewMode === 'app') {
      postsService.getFeed(currentUser.id, feedFilter).then(setPosts).catch(console.error);
    }
  }, [feedFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auth handlers ────────────────────────────────────────────────────────
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setViewMode('app');
    await loadUserData(user);
    showToast(`Welcome back, ${user.display_name}! 🌟`);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setPosts([]);
    setFarmStatus(null);
    setWallet(null);
    setAuraScore(null);
    setActiveTab('feed');
    setViewMode('landing');
    showToast('Signed out successfully.');
  };

  const handleSwitchDemo = async (email) => {
    const user = await authService.switchDemoAccount(email);
    setCurrentUser(user);
    await loadUserData(user);
    showToast(`Switched persona: ${user.display_name} (${user.role})`);
  };

  // ─── Post actions ─────────────────────────────────────────────────────────
  const handlePublish = async (postData) => {
    try {
      await postsService.publishPost({
        currentUserId: currentUser.id,
        currentUser,
        caption: postData.caption,
        media: postData.media,
        visibility: postData.visibility,
      });
      showToast('Post published! +25 AP earned.');
      await loadUserData(currentUser);
    } catch (err) {
      alert(`Error publishing post: ${err.message}`);
    }
  };

  const handleLike = async (postId) => {
    const res = await postsService.toggleLike(postId, currentUser.id);
    setPosts(posts.map(p => p.id === postId ? { ...p, hasLiked: res.hasLiked, likesCount: res.likesCount } : p));
  };

  const handleRate = async (postId, score) => {
    try {
      const res = await postsService.submitRating(postId, currentUser.id, score);
      setPosts(posts.map(p => p.id === postId ? { ...p, ratingAverage: res.ratingAverage, ratingsCount: res.ratingsCount, userRating: res.userRating } : p));
      showToast(`Rating recorded! +2 AP earned.`);
      await loadUserData(currentUser);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleComment = async (postId, body) => {
    const newComment = await postsService.addComment(postId, currentUser.id, currentUser, body);
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: (p.commentsCount || 0) + 1,
          comments: [...(p.comments || []), newComment],
        };
      }
      return p;
    }));
    showToast('Comment posted! +5 AP awarded.');
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This will release storage quota.')) return;
    await postsService.deletePost(postId, currentUser.id);
    showToast('Post deleted and storage quota reclaimed.');
    await loadUserData(currentUser);
  };

  const handleAcquireFarm = async (farmSlug) => {
    await farmsService.acquireSimulatedFarm(currentUser.id, farmSlug);
    showToast('Farm capacity upgrade activated!');
    await loadUserData(currentUser);
  };

  const handleToggleBookmark = (postId) => {
    setSavedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        showToast('Removed from saved collection');
      } else {
        next.add(postId);
        showToast('Saved to collection');
      }
      return next;
    });
  };

  const handleOpenShare = (post) => {
    setSharingPost(post);
    setShareModalOpen(true);
  };

  // ─── Profile viewer helper (clicking another user) ────────────────────────
  const handleViewProfile = (userId) => {
    // For now, navigate to profile tab with the viewing user context
    setViewingProfileUser(userId || null);
    setActiveTab('profile');
  };

  // ─── LANDING PAGE ─────────────────────────────────────────────────────────
  if (viewMode === 'landing') {
    return (
      <>
        {toastMessage && (
          <div className="fixed top-6 right-4 z-[200] px-4 py-3 bg-purple-600/90 text-white text-xs font-semibold rounded-2xl shadow-2xl backdrop-blur-md border border-purple-400/30">
            {toastMessage}
          </div>
        )}
        <LandingPage
          onEnterApp={() => setViewMode('auth')}
        />
      </>
    );
  }

  // ─── AUTH PAGE ────────────────────────────────────────────────────────────
  if (viewMode === 'auth') {
    return (
      <>
        {toastMessage && (
          <div className="fixed top-6 right-4 z-[200] px-4 py-3 bg-purple-600/90 text-white text-xs font-semibold rounded-2xl shadow-2xl backdrop-blur-md border border-purple-400/30">
            {toastMessage}
          </div>
        )}
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setViewMode('landing')}
        />
      </>
    );
  }

  // ─── MAIN APP ─────────────────────────────────────────────────────────────
  const isFullWidthTab = ['chat', 'explore', 'farms', 'analytics'].includes(activeTab);
  const isFeedTab = ['feed', 'saved'].includes(activeTab);
  const stageWidthClass = isFullWidthTab
    ? 'flex-1 max-w-5xl min-w-0 space-y-5'
    : isFeedTab
    ? 'w-full max-w-[620px] min-w-0 space-y-5 flex-shrink-0'
    : 'flex-1 max-w-3xl min-w-0 space-y-5';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 sm:top-auto sm:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 bg-purple-600/90 text-white text-xs font-semibold rounded-2xl shadow-2xl backdrop-blur-md border border-purple-400/30 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Top App Bar */}
      <Navbar
        currentUser={currentUser}
        onOpenCreatePost={() => setCreatePostOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onLogout={handleLogout}
        unreadNotificationsCount={2}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8 py-3 sm:py-6 lg:py-8 flex justify-center gap-3 sm:gap-4 lg:gap-8 flex-1 pb-24 sm:pb-8 safe-area-x">
        {/* Left Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          farmStatus={farmStatus}
        />

        {/* Dynamic Center Stage */}
        <main className={stageWidthClass}>
          {activeTab === 'feed' && (
            <div className="space-y-4">
              <StoriesBar
                currentUser={currentUser}
                onOpenCreatePost={() => setCreatePostOpen(true)}
              />

              {/* Feed Filter Header */}
              <div className="glass-card p-2 sm:p-3 flex items-center justify-between rounded-2xl">
                <div className="flex gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setFeedFilter('latest')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      feedFilter === 'latest'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Latest Releases
                  </button>
                  <button
                    onClick={() => setFeedFilter('top-rated')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      feedFilter === 'top-rated'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Top Rated
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:block">
                  Verified Beta Network
                </span>
              </div>

              {/* Feed Posts */}
              {posts.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 glass-card rounded-2xl">
                  No posts yet in this feed. Tap (+) to create the first post!
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser?.id}
                    onLike={handleLike}
                    onRate={handleRate}
                    onComment={handleComment}
                    onDelete={handleDeletePost}
                    onReport={(target) => {
                      setReportingPost(target);
                      setReportModalOpen(true);
                    }}
                    onShare={handleOpenShare}
                    onBookmark={handleToggleBookmark}
                    isBookmarked={savedPostIds.has(post.id)}
                    onViewProfile={handleViewProfile}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'explore' && (
            <ExploreView
              onSelectPost={(item) => {
                showToast(`Viewing @${item.author}'s artwork`);
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              currentUser={currentUser}
              farmStatus={farmStatus}
              wallet={wallet}
              auraScore={auraScore}
            />
          )}

          {activeTab === 'saved' && (
            <SavedPostsView
              savedPostIds={savedPostIds}
              allPosts={posts}
              currentUserId={currentUser?.id}
              onLike={handleLike}
              onRate={handleRate}
              onComment={handleComment}
              onShare={handleOpenShare}
              onBookmark={handleToggleBookmark}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView currentUser={currentUser} />
          )}

          {activeTab === 'farms' && (
            <FarmsView
              catalogue={catalogue}
              farmStatus={farmStatus}
              onAcquireFarm={handleAcquireFarm}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletCard wallet={wallet} />
          )}

          {activeTab === 'score' && (
            <AuraScoreView auraScore={auraScore} currentUser={currentUser} />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView onViewProfile={handleViewProfile} />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              viewingUserId={viewingProfileUser}
              userPosts={posts.filter((p) => p.userId === (viewingProfileUser || currentUser?.id))}
              onDeletePost={handleDeletePost}
              onMessageUser={(userId) => {
                setActiveTab('chat');
                showToast('Opening DM thread...');
              }}
              onBack={viewingProfileUser ? () => {
                setViewingProfileUser(null);
                setActiveTab('feed');
              } : null}
            />
          )}

          {activeTab === 'moderation' && (
            <ModerationDashboard currentUser={currentUser} />
          )}
        </main>

        {/* Right Desktop Sidebar (Feed & Saved) */}
        {isFeedTab && (
          <RightSidebar
            onViewProfile={handleViewProfile}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onToast={showToast}
          />
        )}
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setViewingProfileUser(null);
          setActiveTab(tab);
        }}
        onOpenCreatePost={() => setCreatePostOpen(true)}
        farmStatus={farmStatus}
        currentUser={currentUser}
        unreadCount={2}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      {/* Slide-over Notifications Center */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPublish={handlePublish}
        farmStatus={farmStatus}
        currentUser={currentUser}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportingPost(null);
        }}
        targetPost={reportingPost}
        reporterId={currentUser?.id}
        onReportSubmitted={() => showToast('Report submitted for moderator review.')}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSharingPost(null);
        }}
        post={sharingPost}
      />
    </div>
  );
}
