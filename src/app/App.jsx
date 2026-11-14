import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/navigation/Navbar';
import { Sidebar } from '../components/navigation/Sidebar';
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
import { authService } from '../services/auth.service';
import { postsService } from '../services/posts.service';
import { farmsService } from '../services/farms.service';
import { auraService } from '../services/aura.service';

export function App() {
  const [viewMode, setViewMode] = useState('landing'); // 'landing' or 'app'
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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Initialize session and data
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

  useEffect(() => {
    authService.getCurrentSession().then((user) => {
      setCurrentUser(user);
      loadUserData(user);
    });
  }, [feedFilter]);

  const handleSwitchDemo = async (email) => {
    const user = await authService.switchDemoAccount(email);
    setCurrentUser(user);
    await loadUserData(user);
    showToast(`Switched persona: ${user.display_name} (${user.role})`);
  };

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

  // Render Landing Page if in landing mode
  if (viewMode === 'landing') {
    return <LandingPage onEnterApp={() => setViewMode('app')} />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 sm:top-auto sm:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 bg-purple-600/90 text-white text-xs font-semibold rounded-2xl shadow-2xl backdrop-blur-md border border-purple-400/30 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Top App Bar with Landing toggle */}
      <Navbar
        currentUser={currentUser}
        onOpenCreatePost={() => setCreatePostOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchDemo={handleSwitchDemo}
        onOpenNotifications={() => setNotificationsOpen(true)}
        unreadNotificationsCount={2}
      />

      {/* Quick link banner to return to Landing / Kings overview */}
      <div className="bg-slate-900/60 border-b border-slate-800/60 py-1.5 px-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
        <span>AURA Private Beta Platform</span>
        <span>•</span>
        <button
          onClick={() => setViewMode('landing')}
          className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
        >
          View Rising Aura Kings & Landing Page
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex gap-8 flex-1 pb-24 md:pb-8">
        {/* Left Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          farmStatus={farmStatus}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 max-w-2xl min-w-0 space-y-5 mx-auto">
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Mobile Stories Carousel */}
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
            <LeaderboardView />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              userPosts={posts.filter((p) => p.userId === currentUser?.id)}
              onDeletePost={handleDeletePost}
            />
          )}

          {activeTab === 'moderation' && (
            <ModerationDashboard currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
