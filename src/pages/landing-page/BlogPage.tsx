import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './styles.css';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

// Estimate reading time based on excerpt or default
const getReadingTime = (excerpt: string | null): string => {
  if (!excerpt) return '5 Min Read';
  const words = excerpt.split(' ').length;
  const minutes = Math.max(3, Math.ceil(words / 50));
  return `${minutes} Min Read`;
};

const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch published blogs from Supabase
  const { data: blogs, isLoading } = useQuery({
    queryKey: ['published-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, cover_image_url, published_at, created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as Blog[];
    },
  });

  // Filter blogs based on search query
  const filteredBlogs = blogs?.filter(blog =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter categories (for future use when categories are added to DB)
  const filters = ['All', 'Tasks', 'Collaboration', 'Productivity', 'Strategies'];

  return (
    <div className="landing-page">
      <Navbar />

      {/* Blog Hero Section */}
      <section className="blog-hero">
        {/* Sun rays / glow */}
        <div className="blog-rays"></div>

        <div className="blog-container">
          <span className="blog-chip">Our Blogs</span>

          <h2 className="blog-title">
            Insights and Inspiration,<br />
            Explore Our Blog
          </h2>

          <p className="blog-subtitle">
            Dive into our blog for expert insights, tips, and industry trends
            to elevate your project management journey.
          </p>

          {/* Search */}
          <div className="blog-search">
            <input
              type="text"
              placeholder="Search for Blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-icon">⌕</span>
          </div>

          {/* Filters */}
          <div className="blog-filters">
            {filters.map((filter) => (
              <button
                key={filter}
                className={activeFilter === filter ? 'active' : ''}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="blog-grid">
            {isLoading ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map((i) => (
                  <article key={i} className="blog-card blog-card-skeleton">
                    <div className="skeleton-image"></div>
                    <div className="blog-card-content">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-text"></div>
                      <div className="skeleton-meta"></div>
                    </div>
                  </article>
                ))}
              </>
            ) : filteredBlogs && filteredBlogs.length > 0 ? (
              filteredBlogs.map((blog) => (
                <Link key={blog.id} to={`/blog/${blog.slug}`}>
                  <article className="blog-card">
                    {blog.cover_image_url ? (
                      <img src={blog.cover_image_url} alt={blog.title} />
                    ) : (
                      <div className="blog-card-placeholder">
                        <span>{blog.title.charAt(0)}</span>
                      </div>
                    )}
                    <div className="blog-card-content">
                      <h3>{blog.title}</h3>
                      <p>
                        {blog.excerpt || 'Discover insights and tips from our community...'}
                      </p>
                      <div className="blog-meta">
                        <span>THEUNOiA</span>
                        <span>{getReadingTime(blog.excerpt)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))
            ) : (
              <div className="blog-empty">
                <div className="blog-empty-icon">📝</div>
                <h3>{searchQuery ? 'No blogs found' : 'No blogs yet'}</h3>
                <p>
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Check back soon for new content!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <div className="wrapper">
        <section className="contact-hero">

          <div className="hero-left">
            <div className="headline">
              <span className="headline-main">Still have questions?</span>
              <span className="headline-sub">
                Our support team is here to help. Reach out and we'll get back to
                you as soon as possible.
              </span>
            </div>

            <div className="cta-group">
              <Link to="/contact" className="cta-link">
                <span className="cta-text">Get in touch</span>
                <svg
                  className="cta-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="hero-right">
            <img
              className="hero-image"
              src="/images/wolf.jpg"
              alt="Person working on laptop"
              
            />
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
