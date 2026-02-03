"use client"

import Image from "next/image"
import Link from "next/link"
import { Clock, Shield, Wallet, Star, Check, Quote } from "lucide-react"

export default function CrazyGelsLanding() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#fdeef5] via-[#f8e8ff] to-[#cfb4d9]">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#ff00b0]/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-[#cfb4d9]/40 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/3 right-10 w-24 h-24 bg-[#ff00b0]/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center animate-fade-in-up">
          <span className="inline-block px-5 py-2 mb-6 text-sm font-medium tracking-wider uppercase bg-white/80 backdrop-blur-sm text-[#391241] rounded-full border border-[#cfb4d9]">
            Premium Semi-Cured Gel Nails
          </span>
          
          <h1 className="text-5xl md:text-7xl font-bold text-[#391241] mb-6 leading-tight tracking-tight">
            Flawless nails in <em className="font-serif not-italic text-[#ff00b0]">minutes</em>
          </h1>
          
          <p className="text-lg md:text-xl text-[#391241]/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enjoy salon-quality nails without the damage. Transform your look at home with our premium semi-cured gel nail strips.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#shop"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-[#ff00b0] rounded-full hover:bg-[#391241] transition-all duration-300 hover:scale-105 shadow-lg shadow-[#ff00b0]/30"
            >
              Shop Now
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-[#391241] bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 border border-[#cfb4d9]"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#391241] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50K+", label: "Happy Customers" },
              { number: "100+", label: "Unique Designs" },
              { number: "2 Weeks", label: "Long Lasting" },
              { number: "4.9/5", label: "Customer Rating" },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-3xl md:text-4xl font-bold text-[#ff00b0] mb-2 group-hover:scale-110 transition-transform">
                  {stat.number}
                </div>
                <div className="text-white/80 text-sm uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#ff00b0] text-sm font-semibold uppercase tracking-wider">
              Why Choose Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#391241] mt-3">
              The smarter way to beautiful nails
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Quick Application",
                description: "Apply your perfect nails in under 10 minutes. No salon appointment needed.",
              },
              {
                icon: Shield,
                title: "Zero Damage",
                description: "Our gentle formula protects your natural nails while delivering stunning results.",
              },
              {
                icon: Wallet,
                title: "Save Money",
                description: "Get salon-quality nails at a fraction of the cost. Skip the expensive appointments.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-[#fdeef5] rounded-2xl text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-6 group-hover:bg-[#ff00b0] transition-colors">
                  <feature.icon className="w-7 h-7 text-[#ff00b0] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-[#391241] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#391241]/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-r from-[#391241] to-[#5a1d6b]">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#ff00b0]/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#cfb4d9]/10 rounded-full translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Limited Time: 15% Off Your First Order
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of women who've discovered the secret to perfect nails. Use code WELCOME15 at checkout.
          </p>
          <Link
            href="#shop"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-[#391241] bg-white rounded-full hover:bg-[#ff00b0] hover:text-white transition-all duration-300 hover:scale-105"
          >
            Claim Offer
          </Link>
        </div>
      </section>

      {/* Image + Text Section */}
      <section className="py-24 bg-[#fdeef5]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#cfb4d9] to-[#fdeef5] overflow-hidden shadow-2xl">
                <Image
                  src="/crazygels-lifestyle.jpg"
                  alt="Beautiful gel nails"
                  width={500}
                  height={500}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#ff00b0]/20 rounded-full blur-2xl" />
            </div>
            
            <div className="space-y-6">
              <span className="text-[#ff00b0] text-sm font-semibold uppercase tracking-wider">
                Our Story
              </span>
              <h2 className="text-4xl font-bold text-[#391241]">
                Beauty without compromise
              </h2>
              <p className="text-[#391241]/70 text-lg leading-relaxed">
                We believe everyone deserves stunning nails without the hassle of salon visits or the damage of traditional acrylics.
              </p>
              
              <ul className="space-y-4">
                {[
                  "No damage to natural nails",
                  "Lasts up to 2 weeks",
                  "Easy DIY application",
                  "Salon-quality results",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#ff00b0] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-[#391241]">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-[#ff00b0] border-2 border-[#ff00b0] rounded-full hover:bg-[#ff00b0] hover:text-white transition-all duration-300 mt-4"
              >
                Discover More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Quote className="w-16 h-16 text-[#cfb4d9] mx-auto mb-8" />
          <blockquote className="text-2xl md:text-3xl text-[#391241] font-medium leading-relaxed mb-8">
            "I've tried every nail brand out there, but Crazy Gels is the only one that looks salon-perfect and doesn't damage my natural nails. Absolutely obsessed!"
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#ff00b0] to-[#cfb4d9] rounded-full flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div className="text-left">
              <div className="font-semibold text-[#391241]">Sarah M.</div>
              <div className="text-[#391241]/60 text-sm flex items-center gap-1">
                Verified Customer
                <span className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#ff00b0] text-[#ff00b0]" />
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-[#391241]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join the Crazy Gels Family
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Subscribe for exclusive offers, nail tips, and early access to new designs.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff00b0] transition-colors"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-[#ff00b0] text-white font-semibold rounded-full hover:bg-[#cfb4d9] hover:text-[#391241] transition-all duration-300"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#2a0d30] text-center">
        <p className="text-white/50 text-sm">
          © 2026 Crazy Gels. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
