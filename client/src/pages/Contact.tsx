import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Building2,
  ArrowRight
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

/* ==========================================================================
   Data & Types
   ========================================================================== */

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}

const TOPIC_OPTIONS = [
  { id: 'rent', label: '🏠 Renting a Property' },
  { id: 'buy', label: '🏷️ Buying a Home' },
  { id: 'chapa', label: '💳 Chapa & Telebirr Payments' },
  { id: 'agent', label: '🛡️ Agent / Broker Verification' },
  { id: 'list', label: '📝 Listing a Property' },
  { id: 'support', label: '💬 Other Support' }
];

const QUICK_CHANNELS = [
  {
    icon: Phone,
    title: 'Customer Hotline',
    subtitle: 'Direct phone line',
    value: '+251 960 779 507',
    altValue: '+251 976 540 694',
    actionText: 'Call Now',
    href: 'tel:+251960779507',
    badge: 'Fast Response (<2m)',
    color: 'from-[#181B22] to-[#262C37]'
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp & Telegram',
    subtitle: 'Instant mobile messaging',
    value: '+251 960 779 507',
    actionText: 'Chat on WhatsApp',
    href: 'https://wa.me/251960779507?text=Hello%20UrbanNEST%2C%20I%20need%20assistance%20with%20a%20property',
    badge: 'Online 24/7',
    color: 'from-[#C9A865] to-[#947337]'
  },
  {
    icon: Mail,
    title: 'Email Inquiries',
    subtitle: 'Official support inbox',
    value: 'support@urbannest.com',
    altValue: 'info@urbannest.com',
    actionText: 'Send Email',
    href: 'mailto:support@urbannest.com',
    badge: 'Same-day Reply',
    color: 'from-[#181B22] to-[#C9A865]'
  },
  {
    icon: MapPin,
    title: 'Addis Ababa HQ',
    subtitle: 'Bole Subcity, Woreda 03',
    value: 'Bole 24, Main Road',
    altValue: 'Addis Ababa, Ethiopia',
    actionText: 'Get Directions',
    href: 'https://maps.google.com/?q=Bole+Addis+Ababa+Ethiopia',
    badge: 'Open Mon - Sat',
    color: 'from-[#2E7D4F] to-[#1D5132]'
  }
];

const FAQS = [
  {
    q: 'How fast will someone from UrbanNEST reply to my message?',
    a: 'Our customer support team answers live phone calls and WhatsApp chats instantly. Form submissions and emails are typically handled in under 2 to 4 business hours.'
  },
  {
    q: 'How do payments via Chapa, Telebirr, and CBE Birr work?',
    a: 'When you pay a listing fee or booking deposit, UrbanNEST securely redirects you to Chapa. You can choose Telebirr, CBE Birr, M-Pesa, or your bank card. Once confirmed, your property or booking is verified automatically.'
  },
  {
    q: 'How can I schedule an in-person or virtual property tour?',
    a: 'Simply visit any property listing page and click the "Request Viewing / Tour" button. You can pick an available date and time slot, and the verified agent or landlord will confirm within hours.'
  },
  {
    q: 'How do I become a Verified Real Estate Agent / Broker?',
    a: 'Navigate to your Profile / Dashboard and submit your Kebele ID, National ID, or Real Estate Business License. Our compliance team will review and approve your Verified Shield badge within 24 hours.'
  },
  {
    q: 'Are there hidden brokerage commissions when browsing properties?',
    a: 'No! Browsing and contacting landlords on UrbanNEST is 100% free for renters and buyers. Property posters pay transparent standard or premium listing fees with no surprise deductions.'
  }
];

const TYPING_TAGLINES = [
  'Instant Assistance via Phone & WhatsApp',
  'Houses & Apartments in Bole, CMC, Kazanchis & Sarbet',
  'Seamless Chapa, Telebirr & CBE Birr Payments',
  '100% Verified Agents & Landlords'
];

/* ==========================================================================
   Contact Component
   ========================================================================== */

export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    topic: 'rent',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    const currentWord = TYPING_TAGLINES[taglineIndex % TYPING_TAGLINES.length];
    const speed = isDeleting ? 30 : 65;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedText(currentWord.substring(0, displayedText.length + 1));
        if (displayedText === currentWord) {
          setTimeout(() => setIsDeleting(true), 2000);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', topic: 'rent', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 6000);
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err?.message || 'Failed to send message. Please try again.');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | UrbanNEST Ethiopia</title>
        <meta
          name="description"
          content="Get in touch with UrbanNEST. 24/7 Customer support for properties in Addis Ababa, Telebirr & Chapa payments, and agent verification."
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
          {/* Full Bleed Background Image & Lighting Overlays */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80&fit=crop"
              alt="UrbanNEST Architecture"
              className="w-full h-full object-cover object-center scale-105"
            />
            {/* Multi-layer cinematic dark overlays */}
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
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D4F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2E7D4F]"></span>
              </span>
              <span>🇪🇹 24/7 Addis Ababa & Nationwide Advisory</span>
            </motion.div>

            {/* Grand Hero Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-tight mb-4"
            >
              Let's Connect & Find{' '}
              <span className="text-[#C9A865]">
                Your Ideal Space
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
              Whether you are searching for a rental apartment in Bole, acquiring a luxury villa in CMC,
              or listing your property with secure Chapa & Telebirr verification, our dedicated team is here to guide you.
            </motion.p>

            {/* CTA Quick Jump Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <a
                href="#message-form"
                className="bg-[#181B22] hover:bg-[#262C37] text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-[#181B22]/50 border-2 border-[#C9A865] hover:shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>Send Us a Message</span>
                <ArrowRight size={18} className="text-[#C9A865]" />
              </a>
              <a
                href="tel:+251960779507"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-2xl border border-white/30 backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Phone size={18} className="text-[#C9A865]" />
                <span>Call Hotline Now</span>
              </a>
            </motion.div>
          </div>
        </section>

        {/* ==========================================================================
            2. 4 DIRECT ACTION CHANNELS (CARDS)
           ========================================================================== */}
        <section className="relative -mt-16 z-20 container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {QUICK_CHANNELS.map((ch, idx) => {
              const IconComp = ch.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -6 }}
                  className="bg-white dark:bg-[#181B22] rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-[#2E3543] flex flex-col justify-between group hover:border-[#C9A865]/50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ch.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <IconComp size={22} />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FCFAF5] dark:bg-[#C9A865]/20 text-[#947337] dark:text-[#DFCFA0] border border-[#EDE2C6] dark:border-[#C9A865]/40">
                        {ch.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-[#181B22] dark:text-white mb-1">{ch.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{ch.subtitle}</p>
                    <p className="text-sm font-bold text-[#181B22] dark:text-[#DFCFA0] font-mono mb-1">{ch.value}</p>
                    {ch.altValue && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-4">{ch.altValue}</p>
                    )}
                  </div>

                  <a
                    href={ch.href}
                    target={ch.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#F4F5EF] hover:bg-[#181B22] hover:text-white dark:bg-[#0F1116] dark:hover:bg-[#C9A865] dark:hover:text-[#0F1116] text-[#181B22] dark:text-gray-200 border border-gray-200 dark:border-[#2E3543] transition-colors mt-3"
                  >
                    <span>{ch.actionText}</span>
                    <ExternalLink size={13} />
                  </a>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ==========================================================================
            3. MAIN INTERACTIVE FORM & FAQ SECTION
           ========================================================================== */}
        <section id="message-form" className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* LEFT COLUMN: Modern Interactive Inquiry Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 bg-white dark:bg-[#181B22] rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 dark:border-[#2E3543] relative overflow-hidden"
            >
              <div className="flex items-center gap-2 text-[#2E7D4F] font-semibold text-xs uppercase tracking-wider mb-2">
                <Sparkles size={15} />
                <span>Send Us a Direct Inquiry</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#181B22] dark:text-white mb-2">
                How Can We Assist You Today?
              </h2>
              <div className="w-20 h-1.5 bg-[#C9A865] rounded-full mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                Select your topic of interest below and fill out the details. Our Addis Ababa team will get back to you right away.
              </p>

              {/* Status Alerts */}
              {submitStatus === 'success' && (
                <div className="p-4 mb-6 rounded-2xl bg-[#F0F8F3] dark:bg-[#2E7D4F]/20 border border-[#BCE1CA] dark:border-[#2E7D4F]/40 flex items-center gap-3 text-[#2E7D4F] dark:text-[#5CAE78] text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#2E7D4F] shrink-0" />
                  <span>Message delivered successfully! Our representative will contact you shortly.</span>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center gap-3 text-rose-800 dark:text-rose-200 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Topic Pills */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2.5">
                    Select Inquiry Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_OPTIONS.map(tp => (
                      <button
                        type="button"
                        key={tp.id}
                        onClick={() => setFormData(prev => ({ ...prev, topic: tp.id }))}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
                          formData.topic === tp.id
                            ? 'bg-[#181B22] text-white border-[#C9A865] shadow-md shadow-[#181B22]/30 scale-105'
                            : 'bg-[#F4F5EF] dark:bg-[#0F1116] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#C9A865]'
                        }`}
                      >
                        {tp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Inputs: Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Abebe Bekele"
                      className="w-full px-4 py-3 bg-[#F4F5EF] dark:bg-[#0F1116] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#181B22] dark:focus:ring-[#C9A865] dark:text-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="abebe@example.com"
                      className="w-full px-4 py-3 bg-[#F4F5EF] dark:bg-[#0F1116] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#181B22] dark:focus:ring-[#C9A865] dark:text-white transition"
                    />
                  </div>
                </div>

                {/* 3. Input: Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone Number (Optional / For faster reply)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+251 91 123 4567"
                    className="w-full px-4 py-3 bg-[#F4F5EF] dark:bg-[#0F1116] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#181B22] dark:focus:ring-[#C9A865] dark:text-white transition"
                  />
                </div>

                {/* 4. Message Area */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Your Message / Property Inquiries *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us what you are looking for, property ID, preferred location in Addis Ababa..."
                    className="w-full px-4 py-3 bg-[#F4F5EF] dark:bg-[#0F1116] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#181B22] dark:focus:ring-[#C9A865] dark:text-white transition resize-none"
                  />
                </div>

                {/* 5. Submit Button - Navy Primary CTA with Gold Border/Hover */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#181B22] hover:bg-[#262C37] text-white font-bold py-4 rounded-2xl shadow-xl shadow-[#181B22]/30 border-2 border-[#C9A865] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Sending Message...</span>
                  ) : (
                    <>
                      <Send size={18} className="text-[#C9A865]" />
                      <span>Send Inquiry to UrbanNEST</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* RIGHT COLUMN: Interactive FAQ Accordion */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 space-y-4"
            >
              <div className="bg-[#F4F5EF] dark:bg-[#181B22] rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-[#2E3543] mb-6">
                <div className="flex items-center gap-2 text-[#C9A865] font-semibold text-xs uppercase tracking-wider mb-2">
                  <ShieldCheck size={16} />
                  <span>Frequently Answered Questions</span>
                </div>
                <h3 className="text-2xl font-black text-[#181B22] dark:text-white mb-2">
                  Quick Solutions & Answers
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  Click any question to view immediate answers regarding viewings, fees, and payments.
                </p>

                <div className="space-y-3">
                  {FAQS.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      className="bg-white dark:bg-[#0F1116] border border-gray-200 dark:border-[#2E3543] rounded-2xl overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === fIdx ? null : fIdx)}
                        className="w-full p-4 text-left font-bold text-sm text-[#181B22] dark:text-white flex items-center justify-between gap-3 hover:bg-[#FCFAF5] dark:hover:bg-[#181B22]/50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 shrink-0 transition-transform duration-300 ${
                            openFaq === fIdx ? 'rotate-180 text-[#C9A865]' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {openFaq === fIdx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="px-4 pb-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3"
                          >
                            {faq.a}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Trust Card */}
              <div className="bg-[#181B22] text-white p-7 rounded-3xl border border-[#C9A865]/40 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F0F8F3] flex items-center justify-center">
                    <Building2 className="text-[#2E7D4F] w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Direct Agent Support</h4>
                    <p className="text-xs text-gray-300">Available Mon–Sat: 8:30 AM – 6:30 PM</p>
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Need help listing or managing multiple properties? Our enterprise broker desk provides dedicated on-boarding.
                </p>
                <a
                  href="tel:+251960779507"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#C9A865] hover:text-[#B6924D] transition"
                >
                  <span>Connect with an Advisory Specialist</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==========================================================================
            4. INTERACTIVE ADDIS ABABA LOCATION MAP PREVIEW
           ========================================================================== */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-white dark:bg-[#181B22] rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 dark:border-[#2E3543]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D4F]">
                  Headquarters & Regional Presence
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#181B22] dark:text-white mt-1">
                  Visit Our Addis Ababa Office
                </h3>
                <div className="w-16 h-1 bg-[#C9A865] rounded-full my-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Bole 24, Main Corridor, Addis Ababa, Ethiopia. Easy access from Bole International Airport.
                </p>
              </div>

              <a
                href="https://maps.google.com/?q=Bole+Addis+Ababa+Ethiopia"
                target="_blank"
                rel="noreferrer"
                className="bg-[#181B22] hover:bg-[#262C37] text-white border-2 border-[#C9A865] px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all hover:scale-105 inline-flex items-center gap-2 shrink-0"
              >
                <MapPin size={16} className="text-[#C9A865]" />
                <span>Open in Google Maps</span>
              </a>
            </div>

            {/* Visual Location Showcase */}
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-[#2E3543]">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0f?w=1600&q=80&fit=crop"
                alt="Addis Ababa City Skyline"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-[#0F1116]/60 backdrop-blur-[1px] flex items-center justify-center">
                <div className="bg-[#181B22]/95 text-white border border-[#C9A865]/50 p-6 rounded-2xl shadow-2xl text-center max-w-sm mx-4 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-full bg-[#FCFAF5] text-[#C9A865] mx-auto flex items-center justify-center mb-3">
                    <MapPin size={24} />
                  </div>
                  <h4 className="font-bold text-lg text-white">UrbanNEST Hub</h4>
                  <p className="text-xs text-gray-300 mt-1">Bole Subcity, Addis Ababa, Ethiopia</p>
                  <p className="text-xs text-[#C9A865] font-bold mt-2">Serving all 11 Subcities & Nationwide</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}