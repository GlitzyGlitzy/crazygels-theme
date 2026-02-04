import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getArticle, getArticles, isShopifyConfigured } from '@/lib/shopify';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';
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
      <section className="mt-16 pt-12 border-t border-[#D4AF37]/20">
        <h2 className="text-2xl font-medium text-[#2C2C2C] mb-8">More Articles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {related.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.blog.handle}/${article.handle}`}
              className="group bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl overflow-hidden hover:border-[#D4AF37]/50 transition-all"
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
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-[#C9A9A6]/10 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-[#D4AF37]/30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-[#2C2C2C] line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                  {article.title}
                </h3>
                <p className="text-[#2C2C2C]/50 text-sm mt-1">
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
                className="px-3 py-1.5 bg-[#D4AF37]/10 text-[#B8860B] text-xs font-medium tracking-wide rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-[#2C2C2C] mb-4 text-balance">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-[#2C2C2C]/60">
          <span className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <User className="w-4 h-4 text-[#D4AF37]" />
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
        className="prose prose-lg max-w-none
          prose-headings:font-medium prose-headings:text-[#2C2C2C]
          prose-p:text-[#2C2C2C]/80 prose-p:leading-relaxed
          prose-a:text-[#D4AF37] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-[#2C2C2C] prose-strong:font-semibold
          prose-ul:text-[#2C2C2C]/80 prose-ol:text-[#2C2C2C]/80
          prose-li:marker:text-[#D4AF37]
          prose-blockquote:border-l-[#D4AF37] prose-blockquote:text-[#2C2C2C]/70
          prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: article.contentHtml }}
      />

      {/* Share */}
      <div className="mt-12 pt-8 border-t border-[#D4AF37]/20">
        <div className="flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-[#2C2C2C]/60 hover:text-[#D4AF37] transition-colors"
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
    <div className="min-h-screen bg-[#FAF7F2]">
      <DynamicHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleContent blogHandle={blogHandle} articleHandle={articleHandle} />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
}
