import type { Metadata } from 'next';
import Link from 'next/link';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Sparkles, Droplets, Wind, ArrowRight, Shield, Clock, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Virtual Beauty Consultant | Crazy Gels',
  description: 'Get personalized skin and hair recommendations from our AI-powered beauty consultant.',
};

const consultTypes = [
  {
    title: 'Skin Analysis',
    description: 'Get personalized skincare recommendations based on your skin type, concerns, and goals.',
    icon: Droplets,
    href: '/consult/skin',
    gradient: 'from-[#ff00b0] to-[#ff6b6b]',
    features: ['Skin type assessment', 'Concern analysis', 'Product recommendations', 'Routine builder'],
  },
  {
    title: 'Hair Analysis',
    description: 'Discover the perfect hair care routine tailored to your hair type and styling needs.',
    icon: Wind,
    href: '/consult/hair',
    gradient: 'from-[#7c3aed] to-[#06b6d4]',
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
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DynamicHeader />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/10 via-transparent to-[#7c3aed]/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff00b0]/5 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff00b0]/10 border border-[#ff00b0]/20 rounded-full text-[#ff00b0] text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Beauty Consultation
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance">
              Your Personal{' '}
              <span className="bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] bg-clip-text text-transparent">
                Beauty Consultant
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12">
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
                  className="group relative bg-[#111111] border border-white/10 rounded-3xl p-8 md:p-10 hover:border-[#ff00b0]/50 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${consult.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${consult.gradient} flex items-center justify-center mb-6`}>
                      <consult.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-[#ff00b0] transition-colors">
                      {consult.title}
                    </h2>
                    <p className="text-white/60 mb-6">
                      {consult.description}
                    </p>
                    
                    {/* Features */}
                    <ul className="space-y-2 mb-8">
                      {consult.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-white/70 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ff00b0]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA */}
                    <span className="inline-flex items-center gap-2 text-[#ff00b0] font-semibold">
                      Start Consultation
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 md:py-20 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Why Use Our AI Consultant?
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-[#111111] border border-white/10 rounded-2xl p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[#ff00b0]/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-[#ff00b0]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-white/60 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Discover Your Perfect Routine?
            </h2>
            <p className="text-white/60 mb-8">
              Choose a consultation type above and let our AI help you find the best products for your unique needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/consult/skin"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] hover:opacity-90 text-white font-semibold py-3 px-8 rounded-full transition-all"
              >
                <Droplets className="w-5 h-5" />
                Skin Analysis
              </Link>
              <Link
                href="/consult/hair"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] hover:opacity-90 text-white font-semibold py-3 px-8 rounded-full transition-all"
              >
                <Wind className="w-5 h-5" />
                Hair Analysis
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
