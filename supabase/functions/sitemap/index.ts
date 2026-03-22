import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://theunoia.com'

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/features', priority: '0.8', changefreq: 'monthly' },
  { url: '/how-it-works', priority: '0.8', changefreq: 'monthly' },
  { url: '/faq', priority: '0.7', changefreq: 'monthly' },
  { url: '/contact', priority: '0.7', changefreq: 'monthly' },
  { url: '/terms-and-conditions', priority: '0.5', changefreq: 'yearly' },
  { url: '/blog', priority: '0.9', changefreq: 'daily' },
  { url: '/login', priority: '0.3', changefreq: 'yearly' },
  { url: '/signup', priority: '0.3', changefreq: 'yearly' },
]

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch published blogs
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching blogs:', error)
    }

    const today = new Date().toISOString().split('T')[0]

    // Build XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

    // Add static pages
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    }

    // Add dynamic blog pages
    if (blogs && blogs.length > 0) {
      for (const blog of blogs) {
        const lastmod = blog.updated_at 
          ? new Date(blog.updated_at).toISOString().split('T')[0]
          : today
        xml += `
  <url>
    <loc>${SITE_URL}/blog/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      }
    }

    xml += `
</urlset>`

    console.log(`Sitemap generated with ${staticPages.length} static pages and ${blogs?.length || 0} blog posts`)

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new Response('Error generating sitemap', {
      status: 500,
      headers: corsHeaders,
    })
  }
})
