import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Building2,
  Users,
  ShieldCheck,
  Sparkles,
  MapPin,
  TrendingUp,
  Award,
  ArrowRight,
  Home,
  CheckCircle2,
  Heart,
  Globe2,
  PhoneCall,
  Calendar,
  Check
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

/* ==========================================================================
   Data Definitions
   ========================================================================== */

const ABOUT_TAGLINES = [
  'Transforming Ethiopian Real Estate Since 2020',
  'Zero Fake Listings • 100% Verified Agents',
  'Instant Chapa & Telebirr Payment Verification',
  'Addis Ababa, Hawassa, Bahir Dar & Nationwide'
];

const STATS = [
  { icon: Home, label: 'Verified Properties', value: '5,000+', desc: 'Across Addis Ababa & Regions' },
  { icon: Users, label: 'Satisfied Clients', value: '12,000+', desc: 'Tenants, Buyers & Landlords' },
  { icon: MapPin, label: 'Cities & Subcities', value: '25+', desc: 'Bole, CMC, Kazanchis, Hawassa' },
  { icon: ShieldCheck, label: 'Secure Payments', value: '100%', desc: 'Powered by Chapa & Telebirr' }
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Uncompromising Trust & Safety',
    description: 'Every single listing undergoes strict compliance verification to eliminate ghost listings and unauthorized middlemen.',
    color: 'from-[#2E7D4F] to-[#1D5132]'
  },
  {
    icon: Sparkles,
    title: 'Modern AI-Powered Discovery',
    description: 'Intelligent search algorithms and our 24/7 AI Real Estate Assistant match you with exact properties in seconds.',
    color: 'from-[#C9A865] to-[#947337]'
  },
  {
    icon: TrendingUp,
    title: 'Seamless Digital Payments',
    description: 'Integrated directly with Chapa, Telebirr, CBE Birr, and M-Pesa for transparent, instantaneous listing fees and booking deposits.',
    color: 'from-[#181B22] to-[#262C37]'
  },
  {
    icon: Globe2,
    title: 'Nationwide Ethiopian Reach',
    description: 'From luxury high-rises in Bole to family compounds in Hawassa, Bahir Dar, and Dire Dawa, we connect the entire nation.',
    color: 'from-[#181B22] to-[#C9A865]'
  }
];

const MILESTONES = [
  {
    year: '2020',
    title: 'UrbanNEST Founded in Addis Ababa',
    description: 'Started with a mission to eliminate real estate scams and simplify home hunting across Bole Subcity.'
  },
  {
    year: '2021',
    title: '500+ Verified Properties',
    description: 'Became the premier trusted digital portal for modern apartment rentals and luxury villa sales.'
  },
  {
    year: '2022',
    title: 'Integrated Chapa & Telebirr',
    description: 'Introduced instant online listing fee payments via Telebirr, CBE Birr, and Ethiopian mobile wallets.'
  },
  {
    year: '2023',
    title: 'Nationwide Expansion',
    description: 'Expanded active listings beyond the capital into Hawassa, Dire Dawa, Bahir Dar, Adama, and Gambella.'
  },
  {
    year: '2024',
    title: 'AI 2.0 Smart Platform',
    description: 'Launched intelligent conversational search, verified broker badges, and automated property reviews.'
  }
];

const TEAM_MEMBERS = [
  {
    name: 'James D.',
    role: 'CEO & Founder',
    bio: 'Visionary real estate technologist with 7+ years driving digital property innovation in Ethiopia.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80&fit=crop'
  },
  {
    name: 'Chuol N.',
    role: 'Chief Technology Officer',
    bio: 'Full-stack software architect specializing in secure payment gateways and cloud infrastructure.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80&fit=crop'
  },
  {
    name: 'Ganun T.',
    role: 'Head of Operations',
    bio: 'Property management specialist overseeing agent compliance, field verifications, and user trust.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80&fit=crop'
  },
  {
    name: 'David DE.',
    role: 'Lead Customer Experience',
    bio: 'Dedicated to 24/7 client satisfaction, viewing coordination, and seamless tenant on-boarding.',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&q=80&fit=crop'
  }
];

/* ==========================================================================
   About Component
   ========================================================================== */

export default function About() {
  const navigate = useNavigate();
  const [headerHeight, setHeaderHeight] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: '-50px' });

  // Dynamic typing animation state
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Detect header height dynamically
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Tagline typing loop
  useEffect(() => {
    const currentWord = ABOUT_TAGLINES[taglineIndex % ABOUT_TAGLINES.length];
    const speed = isDeleting ? 30 : 65;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedText(currentWord.substring(0, displayedText.length + 1));
        if (displayedText === currentWord) {
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        setDisplayedText(currentWord.substring(0, displayedText.length - 1));
        if (displayedText === '') {
          setIsDeleting(false);
          setTaglineIndex(prev => prev + 1);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, taglineIndex]);

  return (
    <>
      <Helmet>
        <title>About Us | UrbanNEST Ethiopia</title>
        <meta
          name="description"
          content="Learn about UrbanNEST's mission to revolutionize Ethiopian real estate with verified property listings, transparent pricing, and instant Chapa & Telebirr payments."
        />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-[#0F1116] text-gray-900 dark:text-slate-100 transition-colors">
        {/* ==========================================================================
            1. FULL-SCREEN CINEMATIC HERO SECTION
           ========================================================================== */}
        <section
          className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden"
          style={{ paddingTop: `${headerHeight + 20}px`, paddingBottom: '90px' }}
        >
          {/* Full-Bleed Background Image & Dynamic Overlays */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=80&fit=crop"
              alt="UrbanNEST Architecture"
              className="w-full h-full object-cover object-center scale-105"
            />
            <div className="absolute inset-0 bg-[#0F1116]/85 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1116] via-[#181B22]/80 to-[#0F1116]/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#181B22]/60 via-transparent to-[#181B22]/60" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-5xl">
            {/* Live Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0F8F3] border border-[#BCE1CA] text-[#2E7D4F] text-xs sm:text-sm font-bold mb-6 backdrop-blur-md shadow-md"
            >
              <Sparkles size={14} className="text-[#C9A865]" />
              <span>🇪🇹 Ethiopia's Leading Digital Real Estate Marketplace</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-tight mb-4"
            >
              Empowering Every Move,{' '}
              <span className="text-[#C9A865]">
                Shaping Our Future
              </span>
            </motion.h1>

            {/* Dynamic Animated Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="h-10 sm:h-12 flex items-center justify-center text-[#C9A865] font-semibold text-lg sm:text-2xl drop-shadow-md mb-6"
            >
              <span>{displayedText}</span>
              <span className="inline-block w-0.5 h-6 ml-1 bg-[#C9A865] animate-pulse" />
            </motion.div>

            {/* Subtitle Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-base sm:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed mb-10"
            >
              UrbanNEST was created to redefine how Ethiopians discover, rent, and buy real estate.
              By fusing verified listings, direct landlord communication, and seamless Chapa & Telebirr payments,
              we make property transactions safe, swift, and effortless.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <button
                onClick={() => navigate('/properties')}
                className="bg-[#181B22] hover:bg-[#262C37] text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-[#181B22]/50 border-2 border-[#C9A865] hover:shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>Explore Properties</span>
                <ArrowRight size={18} className="text-[#C9A865]" />
              </button>
              <button
                onClick={() => navigate('/create-listing')}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-2xl border border-white/30 backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Building2 size={18} className="text-[#C9A865]" />
                <span>List a Property</span>
              </button>
            </motion.div>
          </div>
        </section>

        {/* ==========================================================================
            2. STATS FLOATING BANNER
           ========================================================================== */}
        <section ref={statsRef} className="relative -mt-16 z-20 container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((st, idx) => {
              const IconComp = st.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isStatsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -6 }}
                  className="bg-white dark:bg-[#181B22] rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-[#2E3543] flex items-center gap-4 group hover:border-[#C9A865]/50 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#FCFAF5] dark:bg-[#C9A865]/20 text-[#C9A865] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <IconComp size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#181B22] dark:text-white tracking-tight">
                      {st.value}
                    </h3>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{st.label}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-400">{st.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ==========================================================================
            3. MISSION & VISION STORY
           ========================================================================== */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Narrative */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="inline-flex items-center gap-2 text-[#2E7D4F] text-xs font-bold uppercase tracking-wider">
                <Building2 size={16} />
                <span>Our Heritage & Purpose</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#181B22] dark:text-white tracking-tight leading-tight">
                Building Trust in the Heart of Ethiopia's Real Estate
              </h2>
              <div className="w-20 h-1.5 bg-[#C9A865] rounded-full"></div>

              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                For years, searching for a house or commercial space in Addis Ababa was plagued by hidden fees,
                unverified broker middlemen, and endless phone tag. UrbanNEST was founded to replace uncertainty with clarity.
              </p>

              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                We combine direct owner connections with digital identity screening and fast Chapa payment confirmation.
                Whether you are renting a studio near Kazanchis or buying a compound in Bole Bulbula, we ensure your journey is protected and transparent.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#F0F8F3] dark:bg-[#2E7D4F]/20 border border-[#BCE1CA] dark:border-[#2E7D4F]/40">
                  <h4 className="font-bold text-[#2E7D4F] dark:text-[#5CAE78] text-sm mb-1">Direct Landlord Access</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Zero unnecessary broker overhead.</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FCFAF5] dark:bg-[#C9A865]/20 border border-[#EDE2C6] dark:border-[#C9A865]/40">
                  <h4 className="font-bold text-[#947337] dark:text-[#DFCFA0] text-sm mb-1">Verified Badging</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Government ID & trade license screened.</p>
                </div>
              </div>
            </motion.div>

            {/* Right Visual Composition */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-[#2E3543]">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80&fit=crop"
                  alt="Modern Luxury Residence"
                  className="w-full h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1116]/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-[#181B22]/90 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#C9A865] font-bold uppercase tracking-wider">Our Core Promise</p>
                      <h4 className="text-lg font-bold text-white">Transparent, Safe, & Direct</h4>
                    </div>
                    <span className="w-10 h-10 rounded-full bg-[#2E7D4F] text-white flex items-center justify-center font-bold">
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==========================================================================
            4. CORE VALUES - Warm Cream Background #F4F5EF
           ========================================================================== */}
        <section className="bg-[#F4F5EF] dark:bg-[#0F1116] py-24 border-y border-gray-100 dark:border-[#2E3543]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D4F]">
                Guiding Principles
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#181B22] dark:text-white mt-2">
                What Sets UrbanNEST Apart
              </h2>
              <div className="w-20 h-1.5 bg-[#C9A865] mx-auto rounded-full my-3"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Every feature on our platform is designed around consumer trust, digital efficiency, and empowering property owners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((val, idx) => {
                const Icon = val.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    whileHover={{ y: -6 }}
                    className="bg-white dark:bg-[#181B22] rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-[#2E3543] flex flex-col justify-between hover:border-[#C9A865]/50 transition-all"
                  >
                    <div>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${val.color} text-white flex items-center justify-center shadow-lg mb-6`}>
                        <Icon size={26} />
                      </div>
                      <h3 className="font-bold text-lg text-[#181B22] dark:text-white mb-2">{val.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {val.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            5. GROWTH TIMELINE / MILESTONES
           ========================================================================== */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D4F]">
              Our Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#181B22] dark:text-white mt-2">
              Milestones Along the Way
            </h2>
            <div className="w-20 h-1.5 bg-[#C9A865] mx-auto rounded-full my-3"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              From a localized Addis Ababa directory to Ethiopia's leading full-service digital property network.
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative">
            {/* Timeline center line */}
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-1 bg-[#C9A865]/30 rounded-full" />

            <div className="space-y-8">
              {MILESTONES.map((mile, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className={`flex flex-col md:flex-row items-center gap-6 ${
                      isEven ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    <div className="w-full md:w-1/2 p-6 rounded-3xl bg-white dark:bg-[#181B22] border border-gray-100 dark:border-[#2E3543] shadow-xl hover:border-[#C9A865]/40 transition-all">
                      <span className="inline-block px-3 py-1 rounded-full bg-[#FCFAF5] dark:bg-[#C9A865]/20 text-[#947337] dark:text-[#DFCFA0] font-black text-xs mb-2 border border-[#EDE2C6] dark:border-[#C9A865]/40">
                        {mile.year}
                      </span>
                      <h4 className="font-bold text-base text-[#181B22] dark:text-white mb-1.5">{mile.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {mile.description}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-[#181B22] text-[#C9A865] font-bold text-xs flex items-center justify-center shrink-0 shadow-lg border-2 border-[#C9A865] z-10">
                      {idx + 1}
                    </div>

                    <div className="hidden md:block w-1/2" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            6. LEADERSHIP TEAM SHOWCASE - Warm Cream Background
           ========================================================================== */}
        <section className="bg-[#F4F5EF] dark:bg-[#0F1116] py-24 border-t border-gray-100 dark:border-[#2E3543]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D4F]">
                Leadership
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#181B22] dark:text-white mt-2">
                Meet the Minds Behind UrbanNEST
              </h2>
              <div className="w-20 h-1.5 bg-[#C9A865] mx-auto rounded-full my-3"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A multidisciplinary team of Ethiopian software engineers, real estate veterans, and customer advocates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TEAM_MEMBERS.map((tm, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -6 }}
                  className="bg-white dark:bg-[#181B22] rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-[#2E3543] group"
                >
                  <div className="h-60 overflow-hidden relative">
                    <img
                      src={tm.image}
                      alt={tm.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1116] via-[#0F1116]/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h4 className="font-bold text-lg text-white">{tm.name}</h4>
                      <p className="text-xs font-semibold text-[#C9A865]">{tm.role}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{tm.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            7. CALL TO ACTION BANNER - Dominant Navy #181B22 with Gold Button #C9A865
           ========================================================================== */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-br from-[#0F1116] via-[#181B22] to-[#0F1116] rounded-3xl p-8 sm:p-14 text-center text-white shadow-2xl relative overflow-hidden border border-[#262C37]">
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0F8F3] text-[#2E7D4F] text-xs font-bold shadow-md">
                <Sparkles size={14} className="text-[#C9A865]" />
                <span>Start Your Property Journey</span>
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Ready to Find Your Home or List Your Property?
              </h2>

              <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Join thousands of satisfied tenants, buyers, and verified agents across Ethiopia.
                Browse listings or create your property post in under 3 minutes.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/properties')}
                  className="bg-[#C9A865] hover:bg-[#B6924D] text-white font-bold px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 text-sm"
                >
                  Browse Verified Listings
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-2xl border border-white/30 backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-sm flex items-center gap-2"
                >
                  <PhoneCall size={16} className="text-[#C9A865]" />
                  <span>Contact Our Team</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}