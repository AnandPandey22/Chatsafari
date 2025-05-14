import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle, Globe, Shield, Sparkles } from 'lucide-react';
import { blogs } from './Blogs';
import type { Helmet as HelmetType } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Define the adsbygoogle type
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// Define the Blog interface here to match the structure in Blogs.tsx
interface Blog {
  id: number;
  title: string;
  slug: string;
  thumbnail: string;
  excerpt: string;
  date: string;
  content?: string;
}

interface BlogPostType {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  imageUrl?: string;
  tags?: string[];
  slug: string;
  excerpt: string;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adsLoaded, setAdsLoaded] = useState(false);

  // Handle scrolling to top when clicking a blog link
  const handleBlogClick = () => {
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    setIsLoading(true);
    const foundPost = blogs.find(p => p.slug === slug);
    if (foundPost) {
      // Convert from Blog to BlogPostType, ensuring all required fields exist
      const convertedPost: BlogPostType = {
        id: foundPost.id.toString(),
        title: foundPost.title,
        content: foundPost.content || '', // Provide default empty string if content is undefined
        author: 'ChatSafari Team', // Default author
        date: foundPost.date,
        imageUrl: foundPost.thumbnail,
        slug: foundPost.slug,
        excerpt: foundPost.excerpt,
        tags: [] // Default empty tags array
      };
      setPost(convertedPost);
      
      // Scroll to the top when post changes
      window.scrollTo(0, 0);

      // Reset ads and set ads loaded state
      setAdsLoaded(false);
      // Small delay to ensure DOM is updated before reinitializing ads
      setTimeout(() => {
        setAdsLoaded(true);
      }, 100);
    } else {
      setPost(null);
    }
    setIsLoading(false);
  }, [slug]);

  // Add retry logic for blog post ads
  useEffect(() => {
    if (adsLoaded) {
      let retryCount = 0;
      const maxRetries = 8;
      const retryInterval = 1500;
      let retryTimer: NodeJS.Timeout;

      const initializeBlogAds = () => {
        // Clear any existing ads first
        const existingAds = document.querySelectorAll('.adsbygoogle');
        existingAds.forEach(ad => {
          if (ad.parentNode) {
            ad.parentNode.removeChild(ad);
          }
        });

        // Create new ad elements
        const firstAd = document.querySelector('.blog-first-ad');
        const sidebarAd = document.querySelector('.blog-sidebar-ad');
        const contentAd = document.querySelector('.blog-content-ad');

        try {
          // Initialize first ad
          if (firstAd) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Blog first ad initialized successfully');
          }

          // Initialize sidebar ad
          if (sidebarAd) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Blog sidebar ad initialized successfully');
          }

          // Initialize content ad
          if (contentAd) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Blog content ad initialized successfully');
          }

          // If any ad failed to initialize and we haven't exceeded retries
          if ((!firstAd || !sidebarAd || !contentAd) && retryCount < maxRetries) {
            retryCount++;
            retryTimer = setTimeout(initializeBlogAds, retryInterval);
          }
        } catch (err) {
          console.error('Error initializing blog ads:', err);
          if (retryCount < maxRetries) {
            retryCount++;
            retryTimer = setTimeout(initializeBlogAds, retryInterval);
          }
        }
      };

      // Initial attempt with a shorter delay
      const initialTimer = setTimeout(initializeBlogAds, 1000);

      // Backup attempt after a longer delay
      const backupTimer = setTimeout(() => {
        if (retryCount === 0) {
          initializeBlogAds();
        }
      }, 5000);

      return () => {
        clearTimeout(initialTimer);
        clearTimeout(backupTimer);
        clearTimeout(retryTimer);
      };
    }
  }, [adsLoaded]);

  // Get 3 random related posts excluding current post
  const getRelatedPosts = () => {
    const otherPosts = blogs.filter((b) => b.id.toString() !== post?.id);
    const shuffled = [...otherPosts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

 if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <Link to="/blogs" className="text-violet-600 hover:text-violet-700">
            Return to Blogs
          </Link>
        </div>
      </div>
    );
  }

  const relatedPosts = getRelatedPosts();

  // Calculate reading time (assuming 200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  // Create JSON-LD data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.imageUrl,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Organization",
      "name": "ChatSafari",
      "url": "https://chatsafari.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ChatSafari",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chatsafari.com/logo.png"
      }
    },
    "description": post.excerpt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://chatsafari.com/blog/${post.slug}`
    },
    "timeRequired": `PT${readingTime}M`,
    "articleBody": post.content.replace(/<[^>]*>/g, ''), // Strip HTML tags
    "keywords": "online chat, social networking, digital communication, chat safety",
    "inLanguage": "en-US"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* @ts-ignore - TS is having issues with Helmet from react-helmet-async */}
      <Helmet>
        <title>{post.title} | ChatSafari Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://chatsafari.com/blog/${post.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.imageUrl} />
        <meta property="og:url" content={`https://chatsafari.com/blog/${post.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={post.imageUrl} />
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-violet-600 hover:text-violet-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
             <span className="text-2xl font-bold text-violet-600" style={{ fontFamily: 'Pacifico, cursive' }}>
              ChatSafari
            </span>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Article Content */}
          <div className="flex-1">
            <article className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Thumbnail */}
              <div className="relative h-64 sm:h-96">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 md:p-10">
                <div className="text-sm text-gray-500 mb-4">{post.date}</div>
                
                {/* Start Chatting Button */}
                <div className="mb-6 flex justify-center">
                  <a 
                    href="https://chatsafari.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-violet-600 text-white hover:bg-violet-700 font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Start Chatting 
                  </a>
                </div>
                
                {/* First Ad Unit - Above H1 */}
                {adsLoaded && (
                  <div className="mb-6">
                    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9696449443766781"
                      crossOrigin="anonymous"></script>
                    <ins className="adsbygoogle blog-first-ad"
                      style={{ 
                        display: 'block',
                        width: '100%',
                        minHeight: '250px'
                      }}
                      data-ad-client="ca-pub-9696449443766781"
                      data-ad-slot="7423185675"
                      data-ad-format="auto"
                      data-full-width-responsive="true"
                      data-adtest="on"></ins>
                  </div>
                )}
                
                <h1 className="text-3xl sm:text-4xl font-bold text-violet-700 mb-6">{post.title}</h1>
                
                <div className="prose prose-violet prose-lg max-w-none custom-blog-content blog-content-no-title">
                  {post.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {post.content}
                    </ReactMarkdown>
                  ) : (
                    <p>{post.excerpt}</p>
                  )}
                </div>
                
                {/* Ad Unit - Above Start Chatting Now Section */}
                {adsLoaded && (
                  <div className="mb-6">
                    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9696449443766781"
                      crossOrigin="anonymous"></script>
                    <ins className="adsbygoogle blog-content-ad"
                      style={{ 
                        display: 'block',
                        width: '100%',
                        minHeight: '250px'
                      }}
                      data-ad-client="ca-pub-9696449443766781"
                      data-ad-slot="7992552962"
                      data-ad-format="auto"
                      data-full-width-responsive="true"
                      data-adtest="on"></ins>
                  </div>
                )}
                
                {/* Start Chatting Now Section */}
                <div className="mt-12 relative overflow-hidden rounded-xl w-full">
                  {/* Background with gradient and pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-700 opacity-90"></div>
                  <div className="absolute inset-0" style={{ 
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    backgroundSize: '30px 30px'
                  }}></div>
                  
                  {/* Content */}
                  <div className="relative p-8 sm:p-10">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 mb-4">
                        <Sparkles className="h-4 w-4 text-yellow-300 mr-2" />
                        <span className="text-white text-sm font-medium">Join Our Growing Community</span>
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-3">Experience ChatSafari Today</h2>
                      <p className="text-violet-100 max-w-2xl mx-auto text-lg">
                        Connect with thousands of active users from around the world in a secure, friendly environment.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="flex flex-col items-center text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                        <div className="bg-white/20 p-3 rounded-full mb-3">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-white text-xl">10,000+</h3>
                        <p className="text-violet-100">Active Users</p>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                        <div className="bg-white/20 p-3 rounded-full mb-3">
                          <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-white text-xl">1M+</h3>
                        <p className="text-violet-100">Messages Daily</p>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                        <div className="bg-white/20 p-3 rounded-full mb-3">
                          <Globe className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-white text-xl">150+</h3>
                        <p className="text-violet-100">Countries</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                      <a 
                        href="https://chatsafari.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-white text-violet-700 hover:bg-violet-50 font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 w-full md:w-auto"
                      >
                        Start Chatting
                      </a>
                      <div className="flex items-center text-sm text-violet-100">
                        <Shield className="h-4 w-4 mr-1 text-yellow-300" />
                        <span>End-to-end encrypted</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Related Posts */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((post) => (
                  <article key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="relative h-48">
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="text-sm text-gray-500 mb-2">{post.date}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 mb-4">{post.excerpt}</p>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="text-violet-600 hover:text-violet-700 font-medium"
                      >
                        Read more →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side Ad - Desktop Only */}
          {adsLoaded && (
            <div className="hidden lg:block lg:w-80 lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="min-h-[600px]">
                  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9696449443766781"
                    crossOrigin="anonymous"></script>
                  <ins className="adsbygoogle blog-sidebar-ad"
                    style={{ 
                      display: 'block',
                      minHeight: '600px',
                      width: '100%'
                    }}
                    data-ad-client="ca-pub-9696449443766781"
                    data-ad-slot="1867080000"
                    data-ad-format="vertical"
                    data-full-width-responsive="true"
                    data-adtest="on"></ins>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlogPost; 
