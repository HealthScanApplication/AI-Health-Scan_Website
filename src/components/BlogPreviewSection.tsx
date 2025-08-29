import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { 
  BookOpen, 
  ExternalLink, 
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface BlogArticle {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishDate: string;
  readTime: string;
  imageUrl?: string;
  tags: string[];
  link: string;
}

export function BlogPreviewSection() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Substack RSS feed URL
  const substackUrl = 'https://healthscan.substack.com/feed';
  const substackMainUrl = 'https://healthscan.substack.com';

  // Fetch latest articles from our server-side RSS endpoint
  const fetchLatestArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching blog articles from server...');
      
      // Import Supabase configuration
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      // Use our server-side RSS endpoint instead of external CORS proxy
      const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ed0fe4c2/blog/articles`;
      
      const response = await fetch(serverUrl, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Server returned invalid response');
      }
      
      console.log(`✅ Fetched ${result.count} articles from server`);
      
      // Get only the latest 2-3 articles for preview (limit to 3 max)
      const articlesToShow = result.data.slice(0, 3);
      
      // Transform server data to match our component interface
      const transformedArticles: BlogArticle[] = articlesToShow.map((serverArticle: any, index: number) => ({
        id: serverArticle.id || `server-article-${index}`,
        title: serverArticle.title?.length > 80 ? serverArticle.title.substring(0, 80) + '...' : serverArticle.title || 'Untitled',
        excerpt: serverArticle.excerpt?.length > 200 ? serverArticle.excerpt.substring(0, 200) + '...' : serverArticle.excerpt || 'No excerpt available',
        author: serverArticle.author || 'HealthScan Team',
        publishDate: serverArticle.publishDate || new Date().toISOString(),
        readTime: serverArticle.readTime || '3 min read',
        imageUrl: serverArticle.imageUrl, // May be undefined - that's ok
        tags: serverArticle.tags?.slice(0, 4) || [], // Limit to 4 tags max
        link: serverArticle.link || substackMainUrl
      }));
      
      console.log('📰 Transformed articles:', transformedArticles.map(a => ({
        title: a.title,
        hasImage: !!a.imageUrl,
        tags: a.tags.length
      })));
      
      setArticles(transformedArticles);
      
      // Log if RSS feed notice exists (for debugging)
      if (result.notice) {
        console.log('ℹ️ RSS Notice:', result.notice);
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching articles from server:', error);
      setError('Unable to load latest articles from our blog');
      
      // Load sample articles as fallback
      loadSampleArticles();
    } finally {
      setLoading(false);
    }
  };

  // Load sample articles as fallback - improved with better images
  const loadSampleArticles = () => {
    console.log('🔄 Loading sample articles as fallback...');
    
    const sampleArticles: BlogArticle[] = [
      {
        id: 'sample-1',
        title: 'Reading Food Labels: Your Complete Guide to Healthier Choices',
        excerpt: 'Learn how to decode complex food labels and identify potentially harmful additives in your everyday products. This comprehensive guide will help you make informed decisions about what you eat.',
        author: 'HealthScan Research Team',
        publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: '5 min read',
        imageUrl: 'https://images.unsplash.com/photo-1670970146850-c892818f76a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG51dHJpdGlvbiUyMGxhYmVsfGVufDF8fHx8MTc1NjQ3MDg5NHww&ixlib=rb-4.1.0&q=80&w=1080',
        tags: ['nutrition', 'food safety', 'ingredients', 'health'],
        link: substackMainUrl
      },
      {
        id: 'sample-2',
        title: 'Hidden Toxins in Everyday Products: What You Need to Know',
        excerpt: 'Discover common household products that may contain harmful chemicals and learn about safer alternatives to protect your family\'s health and wellbeing.',
        author: 'Dr. Sarah Martinez',
        publishDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        readTime: '7 min read',
        imageUrl: 'https://images.unsplash.com/photo-1624021097773-306e8dce6684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnZpcm9ubWVudGFsJTIwdG94aW5zJTIwaG91c2Vob2xkJTIwY2hlbWljYWxzfGVufDF8fHx8MTc1NjQ3MDg5OHww&ixlib=rb-4.1.0&q=80&w=1080',
        tags: ['toxins', 'environmental', 'safety', 'research'],
        link: substackMainUrl
      }
    ];

    // Only show 2 sample articles to test the centered layout
    setArticles(sampleArticles);
    console.log('✅ Loaded 2 sample articles for centered display');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Recent';
    }
  };

  // Load articles on component mount
  useEffect(() => {
    fetchLatestArticles();
  }, []);

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-white to-green-50/30 relative overflow-hidden">
      {/* Clean background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/20 to-emerald-100/10" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-[var(--healthscan-green)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-emerald-400/8 rounded-full blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-md border border-gray-100 mb-8 hover:shadow-lg transition-shadow duration-300">
            <BookOpen className="w-8 h-8 text-[var(--healthscan-green)]" />
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Latest Health Insights
          </h2>
          
          <p className="text-lg md:text-xl text-[var(--healthscan-text-muted)] max-w-3xl mx-auto leading-relaxed px-4">
            Discover research-backed insights on nutrition, food safety, and wellness 🌱💚
          </p>
          
          {/* Subtitle with publication info */}
          <div className="mt-6 text-sm text-[var(--healthscan-text-muted)]">
            Fresh content from the HealthScan research team
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--healthscan-green)] mx-auto mb-4" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-[var(--healthscan-green)]/20 rounded-full mx-auto animate-pulse"></div>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Loading Latest Health Insights</h3>
              <p className="text-[var(--healthscan-text-muted)]">Fetching the newest research and articles...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && articles.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Unable to Load Articles</h3>
              <p className="text-[var(--healthscan-text-muted)] mb-6 text-sm leading-relaxed">{error}</p>
              <Button 
                onClick={fetchLatestArticles} 
                variant="outline"
                className="text-[var(--healthscan-green)] border-[var(--healthscan-green)] hover:bg-[var(--healthscan-green)] hover:text-white transition-all duration-200"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Sample Data Notice */}
        {!loading && articles.length > 0 && articles[0]?.id.startsWith('sample-') && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
              <BookOpen className="w-4 h-4" />
              <span>Blog temporarily unavailable - showing sample articles</span>
            </div>
          </div>
        )}

        {/* Articles Grid - Responsive layout that centers 1-2 articles */}
        {!loading && articles.length > 0 && (
          <>
            <div className={`grid gap-6 mb-12 ${
              articles.length === 1 
                ? 'grid-cols-1 max-w-lg mx-auto' 
                : articles.length === 2 
                ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {articles.map((article) => (
                <Card 
                  key={article.id} 
                  className="group bg-white border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden rounded-xl h-full flex flex-col"
                  onClick={() => window.open(article.link, '_blank', 'noopener,noreferrer')}
                >
                  {/* Article Image with enhanced fallback handling */}
                  {article.imageUrl && (
                    <div className="aspect-video overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 relative">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // Better fallback - hide the image container completely
                          const container = (e.target as HTMLElement).closest('div');
                          if (container) {
                            container.style.display = 'none';
                          }
                          console.log('⚠️ Blog image failed to load:', article.imageUrl);
                        }}
                        onLoad={(e) => {
                          // Ensure image loaded successfully
                          console.log('✅ Blog image loaded:', article.imageUrl);
                        }}
                      />
                      {/* Subtle overlay for better text readability if needed */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--healthscan-text-muted)] mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(article.publishDate)}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{article.readTime}</span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[var(--healthscan-green)] transition-colors">
                      {article.title}
                    </h3>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    <p className="text-sm md:text-base text-[var(--healthscan-text-muted)] line-clamp-3 mb-4 flex-1">
                      {article.excerpt}
                    </p>
                    
                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary" 
                            className="text-xs bg-[var(--healthscan-green)]/10 text-[var(--healthscan-green)] hover:bg-[var(--healthscan-green)] hover:text-white transition-colors duration-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Read More */}
                    <div className="flex items-center text-sm md:text-base text-[var(--healthscan-green)] group-hover:text-[var(--healthscan-light-green)] transition-colors mt-auto">
                      <span className="font-medium">Read Article</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <Button 
                onClick={() => window.open(substackMainUrl, '_blank', 'noopener,noreferrer')}
                className="btn-major w-80 mx-auto inline-flex bg-gradient-to-r from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] hover:from-[var(--healthscan-light-green)] hover:to-[var(--healthscan-green)] text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:animate-button-shake group"
              >
                <span className="text-lg">Read All Articles</span>
                <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Button>
              
              <p className="text-sm text-[var(--healthscan-text-muted)] mt-4">
                Free insights • No spam • Research-backed content 🌱💚
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}