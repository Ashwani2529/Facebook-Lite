import React, { useCallback, useEffect, useState } from 'react';
import { HiOutlineRefresh, HiOutlineSparkles, HiOutlineUsers } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../layout/Navbar';
import PostCard from '../ui/PostCard';
import { SkeletonPost } from '../ui/Loading';
import SERVER_URL from '../../server_url';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async (page = 1, append = false, signal) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${SERVER_URL}/api/v1/posts/allpost?page=${page}&limit=30`,
        {
          signal,
          headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not load your feed');

      setPosts(previous => append ? [...previous, ...(data.posts || [])] : (data.posts || []));
      setHasMore(Boolean(data.pagination?.hasMore));
      setCurrentPage(page);
    } catch (requestError) {
      if (requestError.name === 'AbortError') return;
      setError(requestError.message);
      if (!append) setPosts([]);
      toast.error(requestError.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(1, false, controller.signal);
    return () => controller.abort();
  }, [fetchPosts]);

  return (
    <>
      <Navbar />
      <main className="feed-page">
        <section className="feed-hero" aria-labelledby="feed-title">
          <div>
            <span className="eyebrow"><HiOutlineSparkles /> Your community</span>
            <h1 id="feed-title">Stories worth stopping for.</h1>
            <p>Catch up with people you care about, share a thought, and keep the conversation moving.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchPosts(1)}
            className="icon-action"
            disabled={loading}
            aria-label="Refresh feed"
          >
            <HiOutlineRefresh className={loading ? 'animate-spin' : ''} />
          </button>
        </section>

        <div className="feed-layout">
          <section className="feed-stream" aria-live="polite">
            {loading ? (
              <div className="space-y-6" aria-label="Loading posts">
                {[0, 1, 2].map(item => <SkeletonPost key={item} className="surface-card p-6" />)}
              </div>
            ) : error ? (
              <div className="empty-state" role="alert">
                <div className="empty-state__icon"><HiOutlineRefresh /></div>
                <h2>Your feed took a pause</h2>
                <p>{error}</p>
                <button type="button" className="btn-primary" onClick={() => fetchPosts(1)}>Try again</button>
              </div>
            ) : posts.length ? (
              <div className="space-y-6">
                {posts.map(post => <PostCard key={post._id} post={post} />)}
                {hasMore ? (
                  <button
                    type="button"
                    onClick={() => fetchPosts(currentPage + 1, true)}
                    disabled={loadingMore}
                    className="load-more"
                  >
                    {loadingMore ? <span className="spinner spinner--small" /> : <HiOutlineSparkles />}
                    {loadingMore ? 'Bringing in more stories…' : 'Show more stories'}
                  </button>
                ) : (
                  <div className="feed-finish">You’re all caught up. Nice work.</div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon"><HiOutlineUsers /></div>
                <h2>Your feed is ready for a first story</h2>
                <p>Find people to follow or start a conversation of your own.</p>
                <div className="empty-state__actions">
                  <Link to="/following" className="btn-secondary">Discover people</Link>
                  <Link to="/create" className="btn-primary">Create a post</Link>
                </div>
              </div>
            )}
          </section>

          <aside className="feed-aside" aria-label="Quick tips">
            <div className="aside-card aside-card--accent">
              <span className="eyebrow">Make it yours</span>
              <h2>Small moments make a great feed.</h2>
              <p>Follow people you know and react to the posts that brighten your day.</p>
              <Link to="/following">Explore your network <span aria-hidden="true">→</span></Link>
            </div>
            <div className="aside-card">
              <h3>Community tip</h3>
              <p>Thoughtful comments help everyone feel seen. Keep it kind and genuine.</p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
};

export default Home;
