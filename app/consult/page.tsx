import type { Metadata } from 'next';
import Link from 'next/link';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';
import { Sparkles, Droplets, Wind, ArrowRight, Shield, Clock, Star, FlaskConical } from 'lucide-react';
import { buildFaqJsonLd, buildPageBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Free Virtual Beauty Consultant - AI Skin & Hair Analysis | Crazy Gels',
  description: 'Get free personalized skin and hair care recommendations from our AI-powered beauty consultant. Instant analysis, expert-backed product suggestions, and custom routines.',
  alternates: {
    canonical: 'https://crazygels.com/consult',
  },
};

const consultFaqs = [
  {
    question: 'How does the Crazy Gels virtual beauty consultant work?',
    answer: 'Our AI-powered beauty consultant analyzes your skin type, concerns, and goals through a simple chat conversation. It then provides personalized product recommendations and routine suggestions based on dermatologist-approved guidelines.',
  },
  {
    question: 'Is the beauty consultation free?',
    answer: 'Yes, the virtual beauty consultation is completely free. You can get personalized skin and hair care recommendations at any time, with no obligation to purchase.',
  },
  {
    question: 'What types of consultations are available?',
    answer: 'We offer two types of consultations: Skin Analysis (personalized skincare recommendations based on your skin type and concerns) and Hair Analysis (tailored hair care routines based on your hair type and styling needs).',
  },
  {
    question: 'Is my personal information kept private?',
    answer: 'Absolutely. Your consultation data is never stored or shared with third parties. We prioritize your privacy and security throughout the entire process.',
  },
  {
    question: 'How accurate are the product recommendations?',
    answer: 'Our AI uses expert-backed, dermatologist-approved guidelines combined with our product catalog to provide highly relevant recommendations. The more details you share about your concerns, the more tailored the suggestions will be.',
  },
];

const consultTypes = [
  {
    title: 'Skin Analysis',
    description: 'Get personalized skincare recommendations based on your skin type, concerns, and goals.',
    icon: Droplets,
    href: '/consult/skin',
    gradient: 'from-[#B76E79] to-[#A15D67]',
    features: ['Skin type assessment', 'Concern analysis', 'Product recommendations', 'Routine builder'],
  },
  {
    title: 'Hair Analysis',
    description: 'Discover the perfect hair care routine tailored to your hair type and styling needs.',
    icon: Wind,
    href: '/consult/hair',
    gradient: 'from-[#9E6B73] to-[#C9A9A6]',
    features: ['Hair type assessment', 'Damage analysis', 'Treatment suggestions', 'Style recommendations'],
  },
];

const benefits = [
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Advanced AI analyzes your unique needs for personalized recommendations.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your information is never stored or shared with third parties.',
  },
  {
    icon: Clock,
    title: 'Quick Results',
    description: 'Get your personalized routine in just a few minutes.',
  },
  {
    icon: Star,
    title: 'Expert-Backed',
    description: 'Recommendations based on dermatologist-approved guidelines.',
  },
];

export default function ConsultPage() {
  const faqJsonLd = buildFaqJsonLd(consultFaqs);
  const breadcrumbJsonLd = buildPageBreadcrumbJsonLd([
    { name: 'Home', url: 'https://crazygels.com' },
    { name: 'Beauty Consultant', url: 'https://crazygels.com/consult' },
  ]);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DynamicHeader />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#B76E79]/5 via-transparent to-[#C9A9A6]/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#B76E79]/5 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#B76E79]/10 border border-[#B76E79]/20 rounded-full text-[#A15D67] text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Beauty Consultation
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-[#2C2C2C] mb-6 text-balance">
              Your Personal{' '}
              <span className="font-medium text-[#B76E79]">
                Beauty Consultant
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#2C2C2C]/70 max-w-2xl mx-auto mb-12">
              Get personalized skincare and haircare recommendations powered by AI. 
              Answer a few questions and receive expert guidance tailored just for you.
            </p>
          </div>
        </section>

        {/* Consultation Cards */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {consultTypes.map((consult) => (
                <Link
                  key={consult.title}
                  href={consult.href}
                  className="group relative bg-[#FFFEF9] border border-[#B76E79]/20 rounded-3xl p-8 md:p-10 hover:border-[#B76E79]/50 transition-all duration-300 overflow-hidden shadow-sm"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${consult.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${consult.gradient} flex items-center justify-center mb-6`}>
                      <consult.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h2 className="text-2xl md:text-3xl font-medium text-[#2C2C2C] mb-3 group-hover:text-[#B76E79] transition-colors">
                      {consult.title}
                    </h2>
                    <p className="text-[#2C2C2C]/60 mb-6">
                      {consult.description}
                    </p>
                    
                    {/* Features */}
                    <ul className="space-y-2 mb-8">
                      {consult.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-[#2C2C2C]/70 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#B76E79]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA */}
                    <span className="inline-flex items-center gap-2 text-[#B76E79] font-medium">
                      Start Consultation
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Browse Recommendations CTA */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/recommendations"
              className="group block bg-[#FFFEF9] border border-[#B76E79]/20 rounded-3xl p-8 md:p-10 hover:border-[#B76E79]/50 transition-all duration-300 shadow-sm text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9E6B73] to-[#6B5B4F] flex items-center justify-center mx-auto mb-6">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-medium text-[#2C2C2C] mb-3 group-hover:text-[#B76E79] transition-colors">
                Browse Product Matches
              </h2>
              <p className="text-[#2C2C2C]/60 max-w-lg mx-auto mb-6">
                Skip the chat and go directly to our product intelligence engine. Select your concerns and see
                in-stock, coming soon, and community-voted research picks matched to your biology.
              </p>
              <span className="inline-flex items-center gap-2 text-[#B76E79] font-medium">
                Explore Recommendations
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 md:py-20 border-t border-[#B76E79]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-medium text-[#2C2C2C] text-center mb-12">
              Why Use Our AI Consultant?
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-[#FFFEF9] border border-[#B76E79]/20 rounded-2xl p-6 text-center shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-[#B76E79]/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-[#B76E79]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#2C2C2C] mb-2">{benefit.title}</h3>
                  <p className="text-[#2C2C2C]/60 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-medium text-[#2C2C2C] mb-4">
              Ready to Discover Your Perfect Routine?
            </h2>
            <p className="text-[#2C2C2C]/60 mb-8">
              Choose a consultation type above and let our AI help you find the best products for your unique needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/consult/skin"
                className="inline-flex items-center justify-center gap-2 bg-[#B76E79] hover:bg-[#A15D67] text-white font-medium py-3 px-8 rounded-full transition-all"
              >
                <Droplets className="w-5 h-5" />
                Skin Analysis
              </Link>
              <Link
                href="/consult/hair"
                className="inline-flex items-center justify-center gap-2 bg-[#9E6B73] hover:bg-[#8A5560] text-white font-medium py-3 px-8 rounded-full transition-all"
              >
                <Wind className="w-5 h-5" />
                Hair Analysis
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
