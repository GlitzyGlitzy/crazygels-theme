import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getAllArticles, isShopifyConfigured } from '@/lib/shopify';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | Crazy Gels',
  description: 'Beauty tips, tutorials, and the latest trends in nails, hair, and skincare.',
};

function BlogSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="animate-pulse bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
          <div className="aspect-[16/10] bg-[#D4AF37]/10" />
          <div className="p-6 space-y-3">
            <div className="h-3 bg-[#D4AF37]/10 rounded w-1/3" />
            <div className="h-5 bg-[#D4AF37]/10 rounded w-3/4" />
            <div className="h-4 bg-[#D4AF37]/10 rounded w-full" />
            <div className="h-4 bg-[#D4AF37]/10 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NoBlogConfigured() {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl p-8">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h3 className="text-[#2C2C2C] font-medium text-lg mb-2">Blog Coming Soon</h3>
        <p className="text-[#2C2C2C]/60 text-sm mb-4">
          Connect your Shopify store to display blog articles.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#D4AF37] hover:underline"
        >
          Return to Home <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

async function BlogArticles() {
  if (!isShopifyConfigured) {
    return <NoBlogConfigured />;
  }

  try {
    const articles = await getAllArticles();

    if (!articles || articles.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-[#D4AF37]" />
          </div>
          <h2 className="text-2xl font-medium text-[#2C2C2C] mb-3">No Articles Yet</h2>
          <p className="text-[#2C2C2C]/60 mb-8">
            Check back soon for beauty tips, tutorials, and the latest trends!
          </p>
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-white font-medium py-3 px-8 rounded-full transition-all"
          >
            Shop Products
          </Link>
        </div>
      );
    }

    // Get featured article (first/latest)
    const [featuredArticle, ...restArticles] = articles;

    return (
      <div className="space-y-12">
        {/* Featured Article */}
        {featuredArticle && (
          <Link
            href={`/blog/${featuredArticle.blog.handle}/${featuredArticle.handle}`}
            className="group block bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative aspect-[16/10] md:aspect-auto">
                {featuredArticle.image ? (
                  <img
                    src={featuredArticle.image.url}
                    alt={featuredArticle.image.altText || featuredArticle.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#C9A9A6]/20 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-[#D4AF37]/30" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-[#D4AF37] text-white text-xs font-medium uppercase tracking-wide rounded-full">
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-[#2C2C2C]/50 text-sm mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(featuredArticle.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {estimateReadTime(featuredArticle.content)} min read
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-medium text-[#2C2C2C] mb-3 group-hover:text-[#D4AF37] transition-colors">
                  {featuredArticle.title}
                </h2>
                <p className="text-[#2C2C2C]/70 line-clamp-3 mb-4">
                  {featuredArticle.excerpt || featuredArticle.content.slice(0, 200)}
                </p>
                <span className="inline-flex items-center gap-2 text-[#D4AF37] font-medium">
                  Read Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Article Grid */}
        {restArticles.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.blog.handle}/${article.handle}`}
                  className="group bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all"
                >
                  <div className="relative aspect-[16/10]">
                    {article.image?.url ? (
                      <img
                        src={article.image.url}
                        alt={article.image.altText || article.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-[#C9A9A6]/10 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-[#D4AF37]/30" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-[#2C2C2C]/50 text-xs mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {estimateReadTime(article.content)} min
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-[#2C2C2C] mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[#2C2C2C]/60 text-sm line-clamp-2">
                    {article.excerpt || article.content.slice(0, 120)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    return <NoBlogConfigured />;
  }
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <DynamicHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#2C2C2C] mb-4">
            Beauty <span className="font-medium text-[#D4AF37]">Blog</span>
          </h1>
          <p className="text-[#2C2C2C]/60 text-lg max-w-2xl mx-auto">
            Tips, tutorials, and trends to help you look and feel your best
          </p>
        </div>

        {/* Articles */}
        <Suspense fallback={<BlogSkeleton />}>
          <BlogArticles />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
}
