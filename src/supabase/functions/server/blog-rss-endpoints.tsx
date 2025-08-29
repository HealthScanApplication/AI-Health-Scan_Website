import { Hono } from 'npm:hono@4';

const app = new Hono();

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  readTime: string;
  imageUrl?: string;
  tags: string[];
  link: string;
  category?: string;
}

// RSS feed URL for HealthScan Substack
const SUBSTACK_RSS_URL = 'https://healthscan.substack.com/feed';

// Enhanced image extraction from RSS content
function extractImageFromContent(content: string, description: string): string | undefined {
  // Try multiple image extraction patterns
  const imgPatterns = [
    /<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+data-src=["']([^"']+)["']/i,
    /<figure[^>]*><img[^>]+src=["']([^"']+)["']/i,
    /<picture[^>]*><img[^>]+src=["']([^"']+)["']/i,
    /!\[.*?\]\(([^)]+)\)/g // Markdown images
  ];
  
  const searchContent = content || description;
  for (const pattern of imgPatterns) {
    const match = searchContent.match(pattern);
    if (match && match[1]) {
      let imageUrl = match[1].trim();
      
      // Validate and fix image URL
      try {
        new URL(imageUrl);
        return imageUrl;
      } catch {
        // Try to make relative URLs absolute
        if (imageUrl.startsWith('/')) {
          return 'https://healthscan.substack.com' + imageUrl;
        }
        // Skip invalid URLs
        continue;
      }
    }
  }
  
  return undefined;
}

// Generate tags from content
function generateTags(textContent: string): string[] {
  const healthKeywords = [
    'nutrition', 'health', 'wellness', 'diet', 'fitness', 'supplements',
    'vitamins', 'minerals', 'organic', 'natural', 'toxins', 'pollutants',
    'ingredients', 'research', 'science', 'study', 'medical', 'doctor',
    'food safety', 'environmental', 'gut health', 'microbiome', 'antioxidants',
    'inflammation', 'immunity', 'mental health', 'stress', 'sleep'
  ];
  
  const contentLower = textContent.toLowerCase();
  const foundTags = healthKeywords.filter(keyword => 
    contentLower.includes(keyword)
  );
  
  return foundTags.slice(0, 5); // Limit to 5 tags
}

// Categorize articles based on content
function categorizeArticle(textContent: string): string {
  const contentLower = textContent.toLowerCase();
  
  if (contentLower.includes('research') || contentLower.includes('study') || contentLower.includes('science')) {
    return 'Research & Science';
  } else if (contentLower.includes('food') || contentLower.includes('ingredient') || contentLower.includes('nutrition')) {
    return 'Nutrition & Food';
  } else if (contentLower.includes('toxin') || contentLower.includes('pollutant') || contentLower.includes('environmental')) {
    return 'Environmental Health';
  } else if (contentLower.includes('wellness') || contentLower.includes('lifestyle') || contentLower.includes('habit')) {
    return 'Lifestyle & Wellness';
  } else {
    return 'Health & Wellness';
  }
}

// Clean text content by removing HTML and decoding entities
function cleanTextContent(rawContent: string): string {
  return rawContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&/g, '&') // Decode HTML entities
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[^;]+;/g, '') // Remove any remaining HTML entities
    .trim();
}

// Fetch and parse RSS feed using regex-based parsing (Deno-compatible)
async function fetchRSSFeed(): Promise<BlogArticle[]> {
  console.log('🔄 Server: Fetching RSS feed from:', SUBSTACK_RSS_URL);
  
  try {
    // Try direct fetch first
    let response: Response;
    let rssContent: string;
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      response = await fetch(SUBSTACK_RSS_URL, {
        headers: {
          'User-Agent': 'HealthScan-Blog-Server/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        rssContent = await response.text();
        console.log('✅ Server: Direct RSS fetch successful, content length:', rssContent.length);
      } else {
        throw new Error(`Direct fetch failed with status: ${response.status}`);
      }
    } catch (directError) {
      if (directError.name === 'AbortError') {
        console.log('⚠️ Server: Direct fetch timed out, trying alternative method...');
      } else {
        console.log('⚠️ Server: Direct fetch failed, trying alternative method...');
      }
      
      // Fallback method using fetch with different headers
      try {
        // Add timeout to fallback fetch as well
        const altController = new AbortController();
        const altTimeoutId = setTimeout(() => altController.abort(), 8000); // 8 second timeout for fallback
        
        response = await fetch(SUBSTACK_RSS_URL, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; HealthScan-RSS-Reader/1.0)',
            'Accept': '*/*',
          },
          signal: altController.signal,
        });
        
        clearTimeout(altTimeoutId);
        
        if (!response.ok) {
          throw new Error(`Alternative fetch failed with status: ${response.status}`);
        }
        
        rssContent = await response.text();
        console.log('✅ Server: Alternative fetch successful, content length:', rssContent.length);
      } catch (altError) {
        if (altError.name === 'AbortError') {
          console.error('❌ Server: All fetch methods timed out');
          throw new Error('RSS feed request timed out - the blog service may be temporarily unavailable');
        } else {
          console.error('❌ Server: All fetch methods failed:', altError);
          throw new Error(`Failed to fetch RSS feed: ${altError.message}`);
        }
      }
    }
    
    // Use regex-based parsing instead of DOMParser for Deno compatibility
    if (!rssContent || typeof rssContent !== 'string') {
      throw new Error('Invalid RSS feed response - no content received');
    }
    
    // Extract RSS metadata using regex
    const channelTitleMatch = rssContent.match(/<channel>[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i);
    const channelDescMatch = rssContent.match(/<channel>[\s\S]*?<description[^>]*>([\s\S]*?)<\/description>/i);
    const channelTitle = channelTitleMatch ? channelTitleMatch[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'HealthScan Blog';
    const channelDescription = channelDescMatch ? channelDescMatch[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Health insights and research';
    
    console.log('📰 Server: RSS Feed Info:', { title: channelTitle, description: channelDescription });
    
    // Extract all items using regex
    const itemMatches = rssContent.match(/<item[\s\S]*?<\/item>/gi);
    if (!itemMatches || itemMatches.length === 0) {
      console.log('⚠️ Server: No articles found in RSS feed');
      throw new Error('No articles found in RSS feed');
    }
    
    console.log(`📰 Server: Found ${itemMatches.length} articles, parsing...`);
    
    const articles: BlogArticle[] = [];
    
    itemMatches.forEach((itemXml, index) => {
      try {
        // Extract title
        const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Untitled Article';
        
        // Extract description
        const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
        const description = descMatch ? descMatch[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
        
        // Extract content:encoded
        const contentMatch = itemXml.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
        const content = contentMatch ? contentMatch[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : description;
        
        // Extract link
        const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
        const link = linkMatch ? linkMatch[1].trim() : '';
        
        // Extract pubDate
        const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
        
        // Extract author (try multiple patterns)
        const dcCreatorMatch = itemXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
        const authorMatch = itemXml.match(/<author[^>]*>([\s\S]*?)<\/author>/i);
        const creatorMatch = itemXml.match(/<creator[^>]*>([\s\S]*?)<\/creator>/i);
        const author = (dcCreatorMatch ? dcCreatorMatch[1] : 
                       authorMatch ? authorMatch[1] : 
                       creatorMatch ? creatorMatch[1] : 'HealthScan Team').trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
        
        // Extract image from multiple sources
        let imageUrl: string | undefined;
        
        // Try media:thumbnail
        const mediaThumbnailMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
        if (mediaThumbnailMatch) {
          imageUrl = mediaThumbnailMatch[1];
        }
        
        // Try enclosure
        if (!imageUrl) {
          const enclosureMatch = itemXml.match(/<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i);
          if (enclosureMatch) {
            imageUrl = enclosureMatch[1];
          }
        }
        
        // Extract from content
        if (!imageUrl) {
          imageUrl = extractImageFromContent(content, description);
        }
        
        // Clean excerpt
        const cleanExcerpt = cleanTextContent(content || description).substring(0, 300) + 
          (content && content.length > 300 ? '...' : '');
        
        // Calculate read time
        const fullContent = content || description;
        const wordCount = cleanTextContent(fullContent).split(/\s+/).length;
        const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
        const readTime = `${readTimeMinutes} min read`;
        
        // Generate tags and category
        const textForAnalysis = title + ' ' + (content || description);
        const tags = generateTags(textForAnalysis);
        const category = categorizeArticle(textForAnalysis);
        
        const article: BlogArticle = {
          id: `healthscan-rss-${Date.now()}-${index}`,
          title,
          excerpt: cleanExcerpt,
          content: content || description,
          author,
          publishDate: pubDate,
          readTime,
          imageUrl,
          tags,
          link,
          category
        };
        
        articles.push(article);
        
        console.log(`📝 Server: Parsed article ${index + 1}: "${title}" by ${author} (${category})`);
        if (imageUrl) {
          console.log(`📸 Server: Image found: ${imageUrl}`);
        }
      } catch (itemError) {
        console.warn(`⚠️ Server: Failed to parse article ${index + 1}:`, itemError);
        // Continue with other articles
      }
    });
    
    if (articles.length === 0) {
      throw new Error('No articles could be successfully parsed from RSS feed');
    }
    
    console.log(`✅ Server: Successfully parsed ${articles.length} articles`);
    return articles;
    
  } catch (error) {
    console.error('❌ Server: RSS parsing error:', error);
    throw error;
  }
}

// GET endpoint to fetch blog articles  
app.get('/blog/articles', async (c) => {
  // Add CORS headers explicitly for this endpoint
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  try {
    console.log('📡 Server: Blog articles request received');
    console.log('📡 Server: User-Agent:', c.req.header('User-Agent'));
    console.log('📡 Server: Authorization header present:', !!c.req.header('Authorization'));
    console.log('📡 Server: Origin:', c.req.header('Origin'));
    
    const articles = await fetchRSSFeed();
    
    return c.json({
      success: true,
      data: articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
      source: 'healthscan-substack-rss'
    });
    
  } catch (error: any) {
    console.error('❌ Server: Blog articles fetch error:', error);
    
    // Provide helpful sample data when RSS is unavailable (for development/testing)
    const sampleArticles: BlogArticle[] = [
      {
        id: 'sample-1',
        title: 'Understanding Food Labels: What to Look For',
        excerpt: 'Learn how to decode food labels and identify potential health concerns in your everyday products. This guide covers essential ingredients to avoid and healthier alternatives.',
        content: 'Food labels can be confusing, but understanding them is crucial for making healthy choices...',
        author: 'HealthScan Team',
        publishDate: new Date().toISOString(),
        readTime: '5 min read',
        imageUrl: 'https://images.unsplash.com/photo-1556909502-f6b3d4d65b31?w=600&h=400&fit=crop',
        tags: ['nutrition', 'food safety', 'health'],
        link: 'https://healthscan.substack.com/p/understanding-food-labels',
        category: 'Nutrition & Food'
      },
      {
        id: 'sample-2', 
        title: 'The Hidden Toxins in Your Kitchen',
        excerpt: 'Discover common household items that may contain harmful chemicals and learn about safer alternatives for your family.',
        content: 'Many everyday kitchen items contain hidden toxins that can affect your health...',
        author: 'HealthScan Research Team',
        publishDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        readTime: '7 min read',
        imageUrl: 'https://images.unsplash.com/photo-1556909919-f6b3e4d65b31?w=600&h=400&fit=crop',
        tags: ['toxins', 'environmental', 'health'],
        link: 'https://healthscan.substack.com/p/hidden-toxins-kitchen',
        category: 'Environmental Health'
      },
      {
        id: 'sample-3',
        title: 'Latest Research on Microplastics in Food',
        excerpt: 'New studies reveal the extent of microplastic contamination in our food supply and what it means for human health.',
        content: 'Recent research has uncovered concerning levels of microplastics in various food products...',
        author: 'Dr. Sarah Johnson',
        publishDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        readTime: '6 min read',
        imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&h=400&fit=crop',
        tags: ['research', 'microplastics', 'science'],
        link: 'https://healthscan.substack.com/p/microplastics-research',
        category: 'Research & Science'
      }
    ];
    
    // Return sample data with error indication
    return c.json({
      success: true, // Return success to avoid breaking the UI
      data: sampleArticles,
      count: sampleArticles.length,
      timestamp: new Date().toISOString(),
      source: 'sample-data-fallback',
      notice: 'RSS feed temporarily unavailable - showing sample articles',
      rss_error: {
        message: error.message || 'Failed to fetch blog articles',
        type: 'RSS_FETCH_ERROR',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// GET endpoint for RSS feed health check
app.get('/blog/health', async (c) => {
  // Add CORS headers explicitly for this endpoint
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  try {
    console.log('🔍 Server: Blog RSS health check requested');
    
    // Quick health check - just verify RSS feed is accessible
    const response = await fetch(SUBSTACK_RSS_URL, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'HealthScan-Health-Check/1.0',
      },
    });
    
    const isHealthy = response.ok;
    
    return c.json({
      success: true,
      healthy: isHealthy,
      status: response.status,
      statusText: response.statusText,
      rssUrl: SUBSTACK_RSS_URL,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Server: RSS health check error:', error);
    
    return c.json({
      success: false,
      healthy: false,
      error: error.message,
      rssUrl: SUBSTACK_RSS_URL,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple test endpoint to verify blog module is working
app.get('/blog/ping', (c) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return c.json({
    success: true,
    message: 'Blog RSS endpoints are working',
    timestamp: new Date().toISOString(),
    module: 'blog-rss-endpoints',
    available_endpoints: [
      '/blog/articles',
      '/blog/health', 
      '/blog/ping'
    ]
  })
})

// Add OPTIONS handlers for CORS preflight requests
app.options('/blog/articles', (c) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return new Response(null, { status: 204 })
})

app.options('/blog/health', (c) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return new Response(null, { status: 204 })
})

app.options('/blog/ping', (c) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return new Response(null, { status: 204 })
})

export default app;