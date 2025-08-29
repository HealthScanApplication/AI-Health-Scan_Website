import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BlogCard } from './BlogCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ServerConnectivityTest } from './ServerConnectivityTest';
import { 
  Search, 
  Filter, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  Rss,
  ExternalLink,
  Server,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

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

interface BlogProps {
  onNavigateBack: () => void;
}

export function Blog({ onNavigateBack }: BlogProps) {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Substack RSS feed URL
  const substackUrl = 'https://healthscan.substack.com/feed';

  // Test server connectivity with better error handling and timeout
  const testServerConnectivity = async () => {
    try {
      console.log('🧪 Testing server connectivity...');
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/health`;
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Server connectivity test passed:', result);
        return true;
      } else {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('❌ Server connectivity test failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200) // Limit error text length
        });
        return false;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ Server connectivity test timed out after 8 seconds');
      } else {
        console.error('❌ Server connectivity test error:', error);
      }
      return false;
    }
  };

  // Fetch articles using server-side RSS endpoint with client-side fallback
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching articles from HealthScan blog...');

      // Test server connectivity first
      const isServerConnected = await testServerConnectivity();
      if (!isServerConnected) {
        console.log('⚠️ Server connectivity failed, skipping to client-side RSS...');
        try {
          await fetchRSSClientSide();
          return;
        } catch (clientError) {
          console.error('❌ Both server and client RSS methods failed:', clientError);
          // Set a friendly error message
          setError('Blog articles are temporarily unavailable. Please try again in a few minutes.');
          return;
        }
      }

      // Try server-side RSS endpoint first (better reliability and image handling)
      try {
        console.log('🔗 Attempting server-side RSS fetch...');
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/blog/articles`;
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        console.log('📡 Fetching from server URL:', serverUrl);
        console.log('🔑 Using project ID:', projectId);
        console.log('🔐 Authorization header present:', !!publicAnonKey);
        
        const response = await fetch(serverUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'HealthScan-Blog-Client/1.0',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        console.log('📡 Server response status:', response.status, response.statusText);
        console.log('📡 Server response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const result = await response.json();
          console.log('📰 Server response data:', {
            success: result.success,
            dataLength: result.data?.length,
            timestamp: result.timestamp,
            source: result.source
          });

          if (result.success && result.data && result.data.length > 0) {
            setArticles(result.data);
            setFilteredArticles(result.data);
            console.log(`✅ Successfully loaded ${result.data.length} articles from server`);
            
            // Show different message for sample data vs real RSS data
            if (result.source === 'sample-data-fallback') {
              toast.success(`🌱 Loaded ${result.data.length} sample articles (RSS temporarily unavailable)`, {
                description: result.notice || 'Real RSS feed will be restored soon'
              });
            } else {
              toast.success(`🌱 Loaded ${result.data.length} real articles from HealthScan blog`);
            }
            return; // Success - exit early
          } else {
            const errorMsg = result.error?.message || result.message || 'Server returned no articles';
            console.error('❌ Server returned invalid data:', result);
            throw new Error(errorMsg);
          }
        } else {
          let errorText = 'Unknown server error';
          try {
            const textResponse = await response.text();
            errorText = textResponse.substring(0, 500); // Limit error text length
          } catch (textError) {
            console.warn('Could not read error response text:', textError);
          }
          
          console.error('❌ Server response error:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText,
            url: serverUrl
          });
          
          throw new Error(`Server error ${response.status}: ${response.statusText}`);
        }
      } catch (serverError: any) {
        if (serverError.name === 'AbortError') {
          console.error('❌ Server request timed out after 15 seconds');
          throw new Error('Server request timed out. The blog service may be temporarily unavailable.');
        }
        
        console.log('⚠️ Server-side fetch failed, trying client-side RSS...', {
          error: serverError.message,
          name: serverError.name,
          stack: serverError.stack?.substring(0, 200)
        });
        
        // Fallback to client-side RSS parsing
        await fetchRSSClientSide();
      }
      
    } catch (error: any) {
      console.error('❌ All fetch methods failed:', error);
      handleFetchError(error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side RSS fetching as fallback
  const fetchRSSClientSide = async () => {
    console.log('🔄 Client-side RSS fetch from:', substackUrl);

    // Try direct fetch first
    let response: Response;
    let data: any;
    
    try {
      response = await fetch(substackUrl, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'HealthScan Blog Reader',
        }
      });
      
      if (response.ok) {
        const textData = await response.text();
        console.log('✅ Direct RSS fetch successful, content length:', textData.length);
        data = { contents: textData };
      } else {
        throw new Error('Direct RSS fetch failed');
      }
    } catch (directError) {
      console.log('⚠️ Direct RSS fetch failed, trying CORS proxy...');
      
      // Fallback to CORS proxy
      const proxyUrl = 'https://api.allorigins.win/get?url=';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        response = await fetch(`${proxyUrl}${encodeURIComponent(substackUrl)}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`CORS proxy failed with status: ${response.status}`);
        }
        
        data = await response.json();
        console.log('✅ CORS proxy fetch successful, content length:', data.contents?.length || 0);
      } catch (proxyError) {
        clearTimeout(timeoutId);
        throw new Error(`Both direct and proxy RSS fetch failed: ${proxyError.message}`);
      }
    }

    // Parse RSS content
    if (!data.contents || typeof data.contents !== 'string') {
      throw new Error('Invalid RSS feed response - no content received');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
    
    // Check for XML parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML content in RSS feed');
    }
    
    const items = xmlDoc.querySelectorAll('item');
    if (items.length === 0) {
      throw new Error('No articles found in RSS feed');
    }

    console.log(`📰 Found ${items.length} articles in RSS feed, parsing...`);

    const parsedArticles: BlogArticle[] = [];

    items.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent?.trim() || 'Untitled Article';
      const description = item.querySelector('description')?.textContent || '';
      const content = item.querySelector('content\\:encoded, encoded')?.textContent || description;
      const link = item.querySelector('link')?.textContent?.trim() || '';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
      
      // Extract author
      const author = item.querySelector('dc\\:creator, author, creator')?.textContent?.trim() || 
                   item.querySelector('author name')?.textContent?.trim() || 
                   'HealthScan Team';
      
      // Enhanced image extraction
      let imageUrl: string | undefined;
      
      // Try media thumbnail
      const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
      if (mediaThumbnail) {
        imageUrl = mediaThumbnail.getAttribute('url') || mediaThumbnail.getAttribute('href');
      }
      
      // Try enclosure
      if (!imageUrl) {
        const enclosure = item.querySelector('enclosure[type^="image"]');
        if (enclosure) {
          imageUrl = enclosure.getAttribute('url');
        }
      }
      
      // Extract from content HTML
      if (!imageUrl) {
        const imgPatterns = [
          /<img[^>]+src=["']([^"']+)["']/i,
          /<img[^>]+data-src=["']([^"']+)["']/i,
          /<figure[^>]*><img[^>]+src=["']([^"']+)["']/i
        ];
        
        for (const pattern of imgPatterns) {
          const match = (content || description).match(pattern);
          if (match && match[1]) {
            imageUrl = match[1];
            break;
          }
        }
      }
      
      // Validate and fix image URL
      if (imageUrl) {
        imageUrl = imageUrl.trim();
        try {
          new URL(imageUrl);
        } catch {
          if (imageUrl.startsWith('/')) {
            imageUrl = 'https://healthscan.substack.com' + imageUrl;
          } else if (!imageUrl.startsWith('http')) {
            imageUrl = undefined;
          }
        }
      }
      
      // Clean excerpt
      const cleanExcerpt = (content || description)
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&[^;]+;/g, '')
        .trim()
        .substring(0, 300) + (content && content.length > 300 ? '...' : '');

      // Calculate read time
      const wordCount = cleanExcerpt.split(/\s+/).length;
      const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

      // Generate tags
      const generateTags = (text: string) => {
        const keywords = ['nutrition', 'health', 'wellness', 'diet', 'fitness', 'supplements', 'vitamins', 'research', 'science'];
        const contentLower = text.toLowerCase();
        return keywords.filter(keyword => contentLower.includes(keyword)).slice(0, 4);
      };

      // Categorize article
      const categorizeArticle = (text: string) => {
        const contentLower = text.toLowerCase();
        if (contentLower.includes('research') || contentLower.includes('study')) return 'Research & Science';
        if (contentLower.includes('nutrition') || contentLower.includes('food')) return 'Nutrition & Food';
        if (contentLower.includes('toxin') || contentLower.includes('environmental')) return 'Environmental Health';
        if (contentLower.includes('wellness') || contentLower.includes('lifestyle')) return 'Lifestyle & Wellness';
        return 'Health & Wellness';
      };

      parsedArticles.push({
        id: `healthscan-client-${Date.now()}-${index}`,
        title,
        excerpt: cleanExcerpt,
        content: content || description,
        author,
        publishDate: pubDate,
        readTime,
        imageUrl,
        tags: generateTags(title + ' ' + (content || description)),
        link,
        category: categorizeArticle(title + ' ' + (content || description))
      });
    });

    setArticles(parsedArticles);
    setFilteredArticles(parsedArticles);
    console.log(`✅ Client-side parsing successful: ${parsedArticles.length} articles`);
    toast.success(`🌱 Loaded ${parsedArticles.length} articles from RSS feed`);
  };

  // Handle fetch errors
  const handleFetchError = (error: any) => {
    let errorMessage = 'Failed to load blog articles.';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. The blog feed may be temporarily unavailable.';
    } else if (error.message.includes('HTTP') || error.message.includes('status')) {
      errorMessage = 'Blog feed server returned an error. Please try again later.';
    } else if (error.message.includes('Invalid XML') || error.message.includes('parsing')) {
      errorMessage = 'Blog feed format is invalid or corrupted.';
    } else if (error.message.includes('No articles')) {
      errorMessage = 'The blog feed is empty or contains no articles yet.';
    } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error occurred. Please check your connection and try again.';
    } else if (error.message.includes('CORS') || error.message.includes('cors')) {
      errorMessage = 'Blog feed is temporarily inaccessible due to CORS restrictions.';
    }
    
    setError(errorMessage);
    console.error('❌ Blog articles fetch failed:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Show a toast error for better user feedback
    toast.error(`🚨 ${errorMessage}`, {
      duration: 6000,
      action: {
        label: 'Retry',
        onClick: () => fetchArticles()
      }
    });
  };

  // Filter and sort articles
  useEffect(() => {
    let filtered = [...articles];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => 
        article.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredArticles(filtered);
  }, [articles, searchTerm, selectedCategory, sortBy]);

  // Get unique categories
  const categories = Array.from(new Set(articles.map(article => article.category).filter(Boolean)));

  // Load articles on component mount
  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button onClick={onNavigateBack} variant="outline">
                ← Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--healthscan-green)]/10">
                  <BookOpen className="w-5 h-5 text-[var(--healthscan-green)]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">HealthScan Blog</h1>
                  <p className="text-gray-600">Real insights from our Substack publication</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={fetchArticles} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://healthscan.substack.com', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Substack
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiagnostics(true)}
                className="flex items-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Wrench className="w-4 h-4" />
                Diagnostics
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search articles, topics, authors, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category!.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">{articles.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Total Articles</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">{categories.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Categories</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-2">
                  <Rss className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Live</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">RSS Feed</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--healthscan-green)] mx-auto mb-4" />
              <p className="text-gray-600">Fetching latest articles from Substack RSS feed...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment while we parse the feed</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && articles.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Blog Articles</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={fetchArticles} variant="default" className="bg-[var(--healthscan-green)] hover:bg-[var(--healthscan-green)]/90">
                Try Again
              </Button>
              <Button 
                onClick={() => window.open('https://healthscan.substack.com', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Our Substack
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              You can subscribe to our Substack to get notified when new articles are published 🌱
            </p>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && filteredArticles.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {searchTerm || selectedCategory !== 'all' 
                  ? `Showing ${filteredArticles.length} filtered articles`
                  : `Latest Articles (${filteredArticles.length})`
                }
              </h2>
              
              {(searchTerm || selectedCategory !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-fit-cards">
              {filteredArticles.map((article) => (
                <BlogCard key={article.id} {...article} />
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && !error && filteredArticles.length === 0 && articles.length > 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
      
      {/* Diagnostics Modal */}
      <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔬 Blog Connectivity Diagnostics</DialogTitle>
          </DialogHeader>
          <ServerConnectivityTest />
        </DialogContent>
      </Dialog>
    </div>
  );
}