import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getArticle, getArticles, isShopifyConfigured } from '@/lib/shopify';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { ShareButton } from '@/components/blog/share-button';
import { Calendar, Clock, ArrowLeft, BookOpen, User } from 'lucide-react';

type Props = {
  params: Promise<{ blogHandle: string; articleHandle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blogHandle, articleHandle } = await params;
  
  if (!isShopifyConfigured) {
    return {
      title: 'Article | Crazy Gels',
    };
  }

  const article = await getArticle(blogHandle, articleHandle);

  if (!article) {
    return {
      title: 'Article Not Found | Crazy Gels',
    };
  }

  return {
    title: `${article.seo?.title || article.title} | Crazy Gels Blog`,
    description: article.seo?.description || article.excerpt || article.content.slice(0, 160),
    openGraph: {
      title: article.title,
      description: article.excerpt || article.content.slice(0, 160),
      images: article.image ? [article.image.url] : [],
    },
  };
}

function ArticleSkeleton() {
  return (
    <div className="animate-pulse max-w-4xl mx-auto">
      <div className="aspect-[21/9] bg-[#D4AF37]/10 rounded-2xl mb-8" />
      <div className="h-8 bg-[#D4AF37]/10 rounded w-3/4 mb-4" />
      <div className="h-4 bg-[#D4AF37]/10 rounded w-1/4 mb-8" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 bg-[#D4AF37]/10 rounded w-full" />
        ))}
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

async function RelatedArticles({ currentArticleId }: { currentArticleId: string }) {
  if (!isShopifyConfigured) return null;

  try {
    const articles = await getArticles({ first: 4 });
    const related = articles.filter((a) => a.id !== currentArticleId).slice(0, 3);

    if (related.length === 0) return null;

    return (
      <section className="mt-16 pt-12 border-t border-white/10">
        <h2 className="text-2xl font-bold text-white mb-8">More Articles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {related.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.blog.handle}/${article.handle}`}
              className="group bg-[#111111] border border-white/10 rounded-xl overflow-hidden hover:border-[#ff00b0]/50 transition-all"
            >
              <div className="relative aspect-[16/10]">
                {article.image ? (
                  <Image
                    src={article.image.url}
                    alt={article.image.altText || article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/20 to-[#7c3aed]/20 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white/30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white line-clamp-2 group-hover:text-[#ff00b0] transition-colors">
                  {article.title}
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  {formatDate(article.publishedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

async function ArticleContent({ blogHandle, articleHandle }: { blogHandle: string; articleHandle: string }) {
  if (!isShopifyConfigured) {
    notFound();
  }

  const article = await getArticle(blogHandle, articleHandle);

  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Hero Image */}
      {article.image && (
        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-8">
          <Image
            src={article.image.url}
            alt={article.image.altText || article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Article Header */}
      <header className="mb-8">
        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#ff00b0]/10 text-[#ff00b0] text-xs font-semibold rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-white/60">
          <span className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff00b0]/20 flex items-center justify-center">
              <User className="w-4 h-4 text-[#ff00b0]" />
            </div>
            {article.author.name}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {estimateReadTime(article.content)} min read
          </span>
        </div>
      </header>

      {/* Article Content */}
      <div 
        className="prose prose-invert prose-lg max-w-none
          prose-headings:font-bold prose-headings:text-white
          prose-p:text-white/80 prose-p:leading-relaxed
          prose-a:text-[#ff00b0] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white prose-strong:font-semibold
          prose-ul:text-white/80 prose-ol:text-white/80
          prose-li:marker:text-[#ff00b0]
          prose-blockquote:border-l-[#ff00b0] prose-blockquote:text-white/70
          prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: article.contentHtml }}
      />

      {/* Share */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
<ShareButton title={article.title} />
        </div>
      </div>

      {/* Related Articles */}
      <Suspense fallback={null}>
        <RelatedArticles currentArticleId={article.id} />
      </Suspense>
    </article>
  );
}

export default async function ArticlePage({ params }: Props) {
  const { blogHandle, articleHandle } = await params;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DynamicHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleContent blogHandle={blogHandle} articleHandle={articleHandle} />
        </Suspense>
      </main>
    </div>
  );
}
