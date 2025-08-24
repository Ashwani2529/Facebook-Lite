import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { UserContext } from '../../App';
import Navbar from '../layout/Navbar';
import { PostCard, SkeletonPost } from '../ui';
import SERVER_URL from '../../server_url';

const Subpost = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { state } = useContext(UserContext);

    // Fetch subscribed posts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch(`${SERVER_URL}/api/v1/posts/getsubpost`, {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("jwt")
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                const result = await response.json();
                setPosts(result.posts || []);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setError(error.message);
                toast.error('Failed to load posts');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // Update post data
    const updatePostData = (updatedPost) => {
        setPosts(prevPosts =>
            prevPosts.map(post => 
                post._id === updatedPost._id ? updatedPost : post
            )
        );
    };

    // Remove post from list
    const removePost = (deletedPost) => {
        setPosts(prevPosts => 
            prevPosts.filter(post => post._id !== deletedPost._id)
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-facebook-dark">
                <Navbar />
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <SkeletonPost key={i} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-facebook-dark">
            <Navbar />
            
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Your Feed
                    </h1>
                    <p className="text-gray-600">
                        Posts from people you follow
                    </p>
                </motion.div>

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center"
                    >
                        <p className="text-red-600 font-medium">
                            {error}
                        </p>
                    </motion.div>
                )}

                {/* Posts */}
                {!error && posts.length > 0 && (
                    <div className="space-y-6">
                        {posts.map((post, index) => (
                            <motion.div
                                key={post._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <PostCard
                                    id={post._id}
                                    body={post.body}
                                    photo={post.photo}
                                    postedBy={post.postedBy?.name || 'Unknown User'}
                                    postedById={post.postedBy?._id}
                                    likes={post.likes || []}
                                    comments={post.comments || []}
                                    isLiked={post.likes?.includes(state?._id)}
                                    createdAt={post.createdAt}
                                    updateFunc={updatePostData}
                                    updateHome={removePost}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!error && posts.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12"
                    >
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg 
                                    className="w-12 h-12 text-gray-400" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={1.5} 
                                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" 
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No posts yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Follow some people to see their posts in your feed
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Subpost;