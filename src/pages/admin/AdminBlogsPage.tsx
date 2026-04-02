import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BlogImageUploader } from '@/components/BlogImageUploader';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BLOG_EDITOR_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
    ['blockquote', 'code-block', 'link', 'image'],
    ['clean'],
  ],
};

const BLOG_EDITOR_FORMATS = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'align',
  'indent',
  'blockquote',
  'code-block',
  'link',
  'image',
];

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  blog_images: string[] | null;
  author_id: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  blog_images: string[];
  status: string;
  meta_title: string;
  meta_description: string;
}

const initialFormData: BlogFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  blog_images: [],
  status: 'draft',
  meta_title: '',
  meta_description: '',
};

const hasVisibleEditorContent = (html: string) => {
  const plainText = html
    .replace(/<(.|\n)*?>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return plainText.length > 0;
};

const normalizeBlogEditorHtml = (html: string) => {
  if (typeof window === 'undefined' || !html) return html;

  const root = document.createElement('div');
  root.innerHTML = html;

  // Convert Quill mixed-list markup to semantic ul/ol blocks.
  root.querySelectorAll('ol').forEach((listNode) => {
    const listItems = Array.from(listNode.children).filter(
      (node) => node.tagName === 'LI'
    ) as HTMLLIElement[];

    if (!listItems.some((item) => item.hasAttribute('data-list'))) return;

    const fragment = document.createDocumentFragment();
    let currentList: HTMLOListElement | HTMLUListElement | null = null;
    let currentType: 'ol' | 'ul' | null = null;

    listItems.forEach((item) => {
      const type = item.getAttribute('data-list') === 'ordered' ? 'ol' : 'ul';
      if (!currentList || currentType !== type) {
        currentList = document.createElement(type);
        currentType = type;
        fragment.appendChild(currentList);
      }

      const li = document.createElement('li');
      li.innerHTML = item.innerHTML;
      li.className = item.className;
      currentList.appendChild(li);
    });

    listNode.replaceWith(fragment);
  });

  // Convert typed list-like paragraphs (e.g. "• item", "1. item") to semantic lists.
  const children = Array.from(root.children);
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.tagName !== 'P') continue;

    const text = (node.textContent || '').trim();
    const bulletMatch = text.match(/^[-*•]\s+(.+)/);
    const orderedMatch = text.match(/^\d+\.\s+(.+)/);
    if (!bulletMatch && !orderedMatch) continue;

    const listType = orderedMatch ? 'ol' : 'ul';
    const listEl = document.createElement(listType);

    let cursor = i;
    while (cursor < children.length) {
      const current = children[cursor];
      if (current.tagName !== 'P') break;
      const currentText = (current.textContent || '').trim();
      const currentBullet = currentText.match(/^[-*•]\s+(.+)/);
      const currentOrdered = currentText.match(/^\d+\.\s+(.+)/);
      const sameType = listType === 'ul' ? !!currentBullet : !!currentOrdered;
      if (!sameType) break;

      const li = document.createElement('li');
      li.textContent = (currentBullet?.[1] || currentOrdered?.[1] || '').trim();
      listEl.appendChild(li);
      current.remove();
      cursor += 1;
    }

    const anchor = root.children[i];
    if (anchor) {
      root.insertBefore(listEl, anchor);
    } else {
      root.appendChild(listEl);
    }
    // Rebuild children snapshot after DOM changes.
    const updatedChildren = Array.from(root.children);
    children.splice(0, children.length, ...updatedChildren);
    i -= 1;
  }

  return root.innerHTML;
};

const AdminBlogsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Blog[];
    },
  });

  const createBlogMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      const { error } = await supabase.from('blogs').insert({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: normalizeBlogEditorHtml(data.content),
        cover_image_url: data.cover_image_url || null,
        blog_images: data.blog_images.length ? data.blog_images : null,
        status: data.status,
        meta_title: data.meta_title.trim() || null,
        meta_description: data.meta_description.trim() || null,
        author_id: user?.id,
        published_at: data.status === 'published' ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog created successfully');
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BlogFormData }) => {
      const updateData: Record<string, unknown> = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: normalizeBlogEditorHtml(data.content),
        cover_image_url: data.cover_image_url || null,
        blog_images: data.blog_images.length ? data.blog_images : null,
        status: data.status,
        meta_title: data.meta_title.trim() || null,
        meta_description: data.meta_description.trim() || null,
      };

      // Set published_at when publishing for the first time
      if (data.status === 'published' && editingBlog?.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('blogs')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog updated successfully');
      setIsDialogOpen(false);
      setEditingBlog(null);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      toast.success('Blog deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleOpenDialog = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt || '',
        content: blog.content,
        cover_image_url: blog.cover_image_url || '',
        blog_images: blog.blog_images || [],
        status: blog.status,
        meta_title: blog.meta_title ?? '',
        meta_description: blog.meta_description ?? '',
      });
    } else {
      setEditingBlog(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug || !hasVisibleEditorContent(formData.content)) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingBlog) {
      updateBlogMutation.mutate({ id: editingBlog.id, data: formData });
    } else {
      createBlogMutation.mutate(formData);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage blog posts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Blog Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter blog title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="blog-post-url-slug"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of the blog post..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO meta description (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content-editor">Content * (Rich text editor)</Label>
                <div
                  id="content-editor"
                  className="rounded-md border bg-background"
                >
                  <ReactQuill
                    theme="snow"
                  value={formData.content}
                    onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                    modules={BLOG_EDITOR_MODULES}
                    formats={BLOG_EDITOR_FORMATS}
                    placeholder="Write your blog content here..."
                    style={{ minHeight: 280 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use the toolbar for headings, lists, font sizes, links, alignment, and more.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Blog Images</Label>
                <BlogImageUploader
                  images={formData.blog_images}
                  coverImageUrl={formData.cover_image_url}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, blog_images: images }))}
                  onCoverChange={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBlogMutation.isPending || updateBlogMutation.isPending}
                >
                  {editingBlog ? 'Update' : 'Create'} Blog
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blogs?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs?.filter(b => b.status === 'published').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogs?.filter(b => b.status === 'draft').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blogs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs && blogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {blog.cover_image_url ? (
                          <img
                            src={blog.cover_image_url}
                            alt={blog.title}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{blog.title}</p>
                          <p className="text-sm text-muted-foreground">/{blog.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={blog.status === 'published' ? 'default' : 'secondary'}>
                        {blog.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(blog.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {blog.published_at
                        ? format(new Date(blog.published_at), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {blog.status === 'published' && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(blog)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{blog.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBlogMutation.mutate(blog.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No blog posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first blog post to get started.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Blog Post
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlogsPage;
