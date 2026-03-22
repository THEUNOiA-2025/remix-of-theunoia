import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ImageGallery } from '@/components/ImageGallery';
import DOMPurify from 'dompurify';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  blog_images: string[] | null;
  published_at: string | null;
  created_at: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeQuillHtml = (html: string) => {
  if (typeof window === 'undefined') return html;

  const container = document.createElement('div');
  container.innerHTML = html;

  container.querySelectorAll('ol').forEach((listNode) => {
    const listItems = Array.from(listNode.children).filter(
      (node) => node.tagName === 'LI'
    ) as HTMLLIElement[];

    if (!listItems.some((item) => item.hasAttribute('data-list'))) return;

    const fragment = document.createDocumentFragment();
    let currentList: HTMLOListElement | HTMLUListElement | null = null;
    let currentListType: 'ol' | 'ul' | null = null;

    listItems.forEach((item) => {
      const listType = item.getAttribute('data-list') === 'ordered' ? 'ol' : 'ul';

      if (!currentList || currentListType !== listType) {
        currentList = document.createElement(listType);
        currentListType = listType;
        fragment.appendChild(currentList);
      }

      const normalizedItem = document.createElement('li');
      normalizedItem.innerHTML = item.innerHTML;
      normalizedItem.className = item.className;
      currentList.appendChild(normalizedItem);
    });

    listNode.replaceWith(fragment);
  });

  return container.innerHTML;
};

const toRenderableBlogHtml = (content: string) => {
  if (!content) return '';
  const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(content);
  if (hasHtmlTags) {
    return DOMPurify.sanitize(normalizeQuillHtml(content), { USE_PROFILES: { html: true } });
  }

  const lines = content.split(/\r?\n/);
  const htmlChunks: string[] = [];
  let activeList: 'ul' | 'ol' | null = null;

  const closeListIfNeeded = () => {
    if (!activeList) return;
    htmlChunks.push(`</${activeList}>`);
    activeList = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeListIfNeeded();
      continue;
    }

    const unorderedMatch = line.match(/^[-*•]\s+(.+)/);
    const orderedMatch = line.match(/^\d+\.\s+(.+)/);

    if (unorderedMatch) {
      if (activeList !== 'ul') {
        closeListIfNeeded();
        activeList = 'ul';
        htmlChunks.push('<ul>');
      }
      htmlChunks.push(`<li>${escapeHtml(unorderedMatch[1])}</li>`);
      continue;
    }

    if (orderedMatch) {
      if (activeList !== 'ol') {
        closeListIfNeeded();
        activeList = 'ol';
        htmlChunks.push('<ol>');
      }
      htmlChunks.push(`<li>${escapeHtml(orderedMatch[1])}</li>`);
      continue;
    }

    closeListIfNeeded();
    htmlChunks.push(`<p>${escapeHtml(line)}</p>`);
  }

  closeListIfNeeded();
  return DOMPurify.sanitize(htmlChunks.join(''), { USE_PROFILES: { html: true } });
};

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      console.log("Slug:", slug);
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) throw error;
      return (data ?? null) as Blog | null;
    },
    enabled: !!slug,
  });

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const renderedContent = useMemo(
    () => toRenderableBlogHtml(blog?.content ?? ''),
    [blog?.content]
  );

  const heroCoverImage = useMemo(() => {
    if (!blog) return null;
    return blog.cover_image_url || blog.blog_images?.[0] || null;
  }, [blog]);

  const galleryImages = useMemo(() => {
    if (!blog?.blog_images?.length) return [];
    return blog.blog_images.filter((imageUrl) => imageUrl !== heroCoverImage);
  }, [blog?.blog_images, heroCoverImage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 pb-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="h-[400px] w-full rounded-xl mb-8" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/blog">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{blog.title}</title>
        <meta
          name="description"
          content={
            blog.excerpt?.trim() ||
            `Read ${blog.title} on TheUnoia blog for practical student freelancing insights.`
          }
        />
        <link rel="canonical" href={`https://www.theunoia.com/blog/${blog.slug}`} />
      </Helmet>
      <Header />
      
      <article className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>

          {/* Title & Meta */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(blog.published_at || blog.created_at), 'MMMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              5 min read
            </span>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>

          {/* Full-width hero cover image */}
          {heroCoverImage && (
            <img
              src={heroCoverImage}
              alt={blog.title}
              className="w-full h-auto rounded-xl mb-8"
            />
          )}

          {/* Additional gallery images (if any) */}
          {galleryImages.length > 0 && (
            <div className="mb-8">
              <ImageGallery images={galleryImages} />
            </div>
          )}

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 italic border-l-4 border-primary pl-4">
              {blog.excerpt}
            </p>
          )}

          {/* Content */}
          <div 
            className="blog-rich-content prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6 prose-li:my-1 [&_li]:list-item [&_li>p]:my-0 [&_.ql-indent-1]:ml-6 [&_.ql-indent-2]:ml-12 [&_.ql-indent-3]:ml-16"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogDetailPage;
