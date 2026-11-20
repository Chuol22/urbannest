import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Search,
  PlusCircle,
  CreditCard,
  ShieldCheck,
  Calendar,
  Phone,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Building2,
  Home as HomeIcon,
  HelpCircle
} from 'lucide-react';

/* ==========================================================================
   Types & Interfaces
   ========================================================================== */

interface ChatAction {
  label: string;
  path?: string;
  prompt?: string;
  isExternal?: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  options?: string[];
  actions?: ChatAction[];
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
}

/* ==========================================================================
   Comprehensive UrbanNEST Knowledge Engine
   ========================================================================== */

interface BotResponseData {
  text: string;
  options?: string[];
  actions?: ChatAction[];
}

function processQuery(rawInput: string): BotResponseData {
  const query = rawInput.toLowerCase().trim();

  // 1. GREETINGS & CASUAL
  if (/^(hi|hello|hey|selam|salam|hola|good\s*(morning|afternoon|evening)|howdy|greetings)/i.test(query)) {
    return {
      text: "Selam & Welcome to **UrbanNEST**! 🇪🇹✨\n\nI am your **AI Real Estate Assistant**. I can help you find dream homes, list properties, understand listing fees, guide you through Telebirr/Chapa payments, or connect you with verified agents.\n\nHow can I help you today?",
      options: ['🔍 Browse Properties', '📝 How to List Property', '💳 Payment & Chapa Fees', '🛡️ Agent Verification'],
      actions: [
        { label: 'Browse Listings', path: '/properties' },
        { label: 'Post a Property', path: '/create-listing' }
      ]
    };
  }

  // 2. CHAPA, TELEBIRR, CBE BIRR, M-PESA & PAYMENTS
  if (
    query.includes('chapa') ||
    query.includes('telebirr') ||
    query.includes('cbe') ||
    query.includes('mpesa') ||
    query.includes('m-pesa') ||
    query.includes('payment') ||
    query.includes('pay ') ||
    query.includes('pay fee') ||
    query.includes('how to pay') ||
    query.includes('bank transfer') ||
    query.includes('wallet')
  ) {
    return {
      text: "### 💳 Payments on UrbanNEST\n\nAll payments are powered by **Chapa**, Ethiopia's premier licensed payment gateway.\n\n**Supported Payment Channels:**\n• 📱 **Telebirr** (Instant mobile wallet)\n• 🏦 **CBE Birr & Commercial Bank of Ethiopia**\n• 🟢 **M-Pesa (Safaricom Ethiopia)**\n• 💳 **Visa & Mastercard** (Local & International)\n• 🏛️ **Awash Bank, Bank of Abyssinia, Amole**\n\n**How the Payment Flow Works:**\n1. When submitting a property or booking, click **Pay Now**.\n2. You are securely redirected to the **Chapa Checkout Page**.\n3. Choose Telebirr, CBE Birr, or your preferred bank.\n4. Complete the OTP confirmation.\n5. Upon completion, you are automatically redirected back and your listing is submitted for instant admin review!",
      options: ['Listing Fee Pricing', 'Payment Failed Help', 'My Payment History'],
      actions: [
        { label: 'View Dashboard Payments', path: '/dashboard?tab=payments' },
        { label: 'Contact Support', path: '/contact' }
      ]
    };
  }

  // 3. LISTING FEES, TIERS & PRICING
  if (
    query.includes('listing fee') ||
    query.includes('tier') ||
    query.includes('standard') ||
    query.includes('premium') ||
    query.includes('cost to list') ||
    query.includes('fee') ||
    query.includes('pricing') ||
    query.includes('price') ||
    query.includes('how much')
  ) {
    return {
      text: "### 🏷️ Transparent Listing Fees & Tiers\n\nWe offer two flexible tiers to maximize your property's visibility:\n\n**1. Standard Tier:**\n• **Rent / Short-term:** ETB 50\n• **Sale / Lease:** ETB 100\n• **Duration:** 30 Days active listing\n• Standard search placement\n\n**2. Premium Tier (Recommended ⭐):**\n• **Rent / Short-term:** ETB 100\n• **Sale / Lease:** ETB 200\n• **Duration:** 60 Days active listing\n• ✨ **Featured Gold Badge** & top search ranking\n• 3x more views and inquiries from buyers/renters!",
      options: ['List Property Now', 'How to Pay with Telebirr', 'Standard vs Premium'],
      actions: [
        { label: 'Create Listing', path: '/create-listing' },
        { label: 'Explore Properties', path: '/properties' }
      ]
    };
  }

  // 4. LISTING A PROPERTY / SELLING / RENTING OUT
  if (
    query.includes('list') ||
    query.includes('post') ||
    query.includes('publish') ||
    query.includes('sell') ||
    query.includes('rent out') ||
    query.includes('landlord') ||
    query.includes('agent') ||
    query.includes('broker') ||
    query.includes('host')
  ) {
    return {
      text: "### 📝 How to List Your Property\n\nListing a property takes under 3 minutes:\n\n1. **Sign in** to your UrbanNEST account.\n2. Click on **'New Listing'** or **'List Property'** in the navigation bar.\n3. Enter property details: Title, description, property type, purpose (*Rent, Sale, Short-term*).\n4. Specify location (*City, Subcity/Neighborhood like Bole, CMC, Sarbet*).\n5. Upload high-resolution photos and set your price (in ETB).\n6. Select your listing tier (*Standard* or *Premium*) and complete the listing fee via Chapa (Telebirr/CBE).\n7. Our admin team will verify and publish your listing within hours!",
      options: ['Create Listing Now', 'Listing Fee Pricing', 'Agent Verification Guide'],
      actions: [
        { label: 'Start Listing Now', path: '/create-listing' },
        { label: 'Go to Dashboard', path: '/dashboard' }
      ]
    };
  }

  // 5. SEARCHING & FINDING PROPERTIES (LOCATIONS, RENT, BUY)
  if (
    query.includes('find') ||
    query.includes('search') ||
    query.includes('rent') ||
    query.includes('buy') ||
    query.includes('house') ||
    query.includes('apartment') ||
    query.includes('villa') ||
    query.includes('studio') ||
    query.includes('commercial') ||
    query.includes('office') ||
    query.includes('bole') ||
    query.includes('cmc') ||
    query.includes('sarbet') ||
    query.includes('kazanchis') ||
    query.includes('addis') ||
    query.includes('addis ababa')
  ) {
    return {
      text: "### 🏠 Explore Verified Properties\n\nWe have hundreds of verified residential and commercial listings across Ethiopia:\n\n**Popular Prime Neighborhoods in Addis Ababa:**\n• **Bole & Rwanda:** Luxury apartments, condos & offices\n• **CMC & Summit:** Modern family villas & gated compounds\n• **Sarbet & Old Airport:** Expat-friendly residences & embassies\n• **Kazanchis:** Business suites & high-rise apartments\n• **Ayat & Lebu:** Affordable family homes & new developments\n\n**Other Cities:** Hawassa, Bahir Dar, Dire Dawa, Adama, Gambella.",
      options: ['Show Rental Houses', 'Properties for Sale', 'Commercial Spaces', 'Short-Term Rentals'],
      actions: [
        { label: 'Explore All Properties', path: '/properties' },
        { label: 'Houses for Rent', path: '/properties?purpose=rent' },
        { label: 'Houses for Sale', path: '/properties?purpose=sale' }
      ]
    };
  }

  // 6. AGENT & USER VERIFICATION (ID, TRADE LICENSE, SECURITY)
  if (
    query.includes('verify') ||
    query.includes('verification') ||
    query.includes('badge') ||
    query.includes('identity') ||
    query.includes('kebele') ||
    query.includes('passport') ||
    query.includes('license') ||
    query.includes('trust') ||
    query.includes('safe') ||
    query.includes('scam')
  ) {
    return {
      text: "### 🛡️ Trust & Account Verification\n\nUrbanNEST is committed to a safe, scam-free real estate marketplace:\n\n• **For Agents & Landlords:**\n  Upload your Government ID (Kebele ID / Passport / National ID) or Real Estate Business License in your **Dashboard > Verification Tab**.\n• **Verified Badge:** Once approved, your listings display a verified shield badge, boosting tenant trust and inquiries by over 80%.\n• **Direct Admin Screening:** Every property listing is manually reviewed by our compliance team before going live.",
      options: ['Upload Verification Document', 'List Property', 'Report Suspicious Post'],
      actions: [
        { label: 'Account Dashboard', path: '/dashboard' },
        { label: 'Profile Settings', path: '/profile' }
      ]
    };
  }

  // 7. BOOKINGS, VIEWINGS & TOURS
  if (
    query.includes('book') ||
    query.includes('view') ||
    query.includes('viewing') ||
    query.includes('tour') ||
    query.includes('visit') ||
    query.includes('schedule') ||
    query.includes('appointment')
  ) {
    return {
      text: "### 📅 Scheduling a Property Viewing\n\n1. Open the property detail page you are interested in.\n2. Click the **'Schedule Tour / Request Viewing'** button.\n3. Select your preferred date and time slot.\n4. Choose between an **In-Person Tour** or a **Virtual Video Walkthrough**.\n5. The property owner or agent will confirm your appointment via email and SMS notification.",
      options: ['Browse Available Properties', 'Contact an Agent', 'My Bookings'],
      actions: [
        { label: 'Find a Property', path: '/properties' },
        { label: 'My Dashboard', path: '/dashboard' }
      ]
    };
  }

  // 8. CONTACT & CUSTOMER SUPPORT
  if (
    query.includes('contact') ||
    query.includes('support') ||
    query.includes('call') ||
    query.includes('phone') ||
    query.includes('email') ||
    query.includes('office') ||
    query.includes('location') ||
    query.includes('help') ||
    query.includes('customer service')
  ) {
    return {
      text: "### 📞 Contact UrbanNEST Support\n\nOur team is available 24/7 to assist you:\n\n• 📍 **Headquarters:** Bole Subcity, Addis Ababa, Ethiopia\n• 📞 **Phone Support:** +251 91 123 4567 / +251 11 612 3456\n• ✉️ **Email:** support@urbannest.com\n• ⏰ **Operating Hours:** Monday – Saturday: 8:30 AM – 6:30 PM (Chat & Emergencies 24/7)\n\nYou can also submit an inquiry through our Contact page.",
      options: ['Send a Message', 'Browse FAQ', 'Browse Properties'],
      actions: [
        { label: 'Open Contact Page', path: '/contact' },
        { label: 'About UrbanNEST', path: '/about' }
      ]
    };
  }

  // 9. TERMS, REFUNDS & POLICIES
  if (
    query.includes('refund') ||
    query.includes('policy') ||
    query.includes('terms') ||
    query.includes('privacy') ||
    query.includes('cancel')
  ) {
    return {
      text: "### 📋 Policies & Terms\n\n• **Listing Fees:** Non-refundable once reviewed and approved by admin.\n• **Cancellation Policy:** You can withdraw your listing at any time from your Dashboard.\n• **Data Privacy:** Your contact details and identification documents are encrypted with enterprise-grade SSL protection.",
      options: ['Read Full Terms', 'Privacy Policy', 'Contact Support'],
      actions: [
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Privacy Policy', path: '/privacy' }
      ]
    };
  }

  // 10. DEFAULT INTELLIGENT FALLBACK
  return {
    text: `I understand you're asking about **"${rawInput}"**.\n\nHere are some helpful resources and quick topics you can explore:`,
    options: [
      '🔍 Browse Properties',
      '📝 How to List Property',
      '💳 Chapa & Telebirr Fees',
      '🛡️ Agent Verification',
      '📞 Contact Support'
    ],
    actions: [
      { label: 'Search Listings', path: '/properties' },
      { label: 'Create New Listing', path: '/create-listing' },
      { label: 'Contact Support', path: '/contact' }
    ]
  };
}

/* ==========================================================================
   ChatBot Main Component
   ========================================================================== */

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      text: "Selam! 👋 Welcome to **UrbanNEST**.\n\nI am your **AI Assistant**. How can I help you today? You can choose a quick topic below or type any question about properties, listing fees, or Chapa payments.",
      sender: 'bot',
      timestamp: new Date(),
      options: ['🔍 Browse Properties', '📝 How to List Property', '💳 Payment & Chapa Fees', '🛡️ Agent Verification'],
      actions: [
        { label: 'Explore Listings', path: '/properties' },
        { label: 'Post a Property', path: '/create-listing' }
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageContent,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Realistic typing delay
    setTimeout(() => {
      const response = processQuery(messageContent);
      const botMessage: Message = {
        id: `bot-${Date.now() + 1}`,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        options: response.options,
        actions: response.actions
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 600);
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.path) {
      navigate(action.path);
      // On mobile, collapse chat to show the new page
      if (window.innerWidth < 768) {
        onToggle();
      }
    } else if (action.prompt) {
      handleSendMessage(action.prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        text: "Conversation cleared. ✨ How can I help you next?",
        sender: 'bot',
        timestamp: new Date(),
        options: ['🔍 Browse Properties', '📝 How to List Property', '💳 Payment & Chapa Fees', '📞 Contact Support']
      }
    ]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to render markdown bolding and bullet points cleanly
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Header detection (### Header)
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-sm text-[#181B22] dark:text-[#C9A865] mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }

      // Format bold elements (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <span key={idx} className="block leading-relaxed">
          {formattedLine}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onToggle}
        aria-label="Toggle UrbanNEST Assistant"
        className="fixed bottom-6 right-6 z-[9999] bg-[#181B22] hover:bg-[#262C37] text-white p-4 rounded-full shadow-2xl hover:shadow-[#C9A865]/30 transition-all duration-300 border-2 border-[#C9A865] flex items-center justify-center group"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D4F] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#2E7D4F] border-2 border-white"></span>
        </span>

        {isOpen ? (
          <X className="w-6 h-6 transition-transform group-hover:rotate-90 text-[#C9A865]" />
        ) : (
          <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110 text-[#C9A865]" />
        )}
      </motion.button>

      {/* Modern High-End Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={`
              fixed z-[9999]
              bottom-20 right-4 sm:right-6 md:right-8
              ${isExpanded ? 'w-[92vw] sm:w-[540px] h-[min(720px,calc(100vh-100px))]' : 'w-[92vw] sm:w-[420px] h-[min(600px,calc(100vh-110px))]'}
              bg-white dark:bg-slate-900
              rounded-3xl shadow-2xl
              flex flex-col overflow-hidden
              border border-slate-200/80 dark:border-slate-800
              backdrop-blur-xl
            `}
          >
            {/* Header - Fixed & Crystal Clear */}
            <div className="bg-[#181B22] text-white px-5 py-4 flex items-center justify-between shadow-md relative z-10 shrink-0 border-b border-[#2E3543]">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-[#262C37]/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-[#C9A865]/40 shadow-inner">
                    <Sparkles className="w-5 h-5 text-[#C9A865] animate-pulse" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#2E7D4F] border-2 border-[#181B22] rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm tracking-wide text-white">UrbanNEST Assistant</h3>
                    <span className="text-[10px] bg-[#C9A865]/20 text-[#C9A865] font-semibold px-1.5 py-0.5 rounded-full border border-[#C9A865]/40">
                      AI 2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#2E7D4F] rounded-full animate-pulse"></span>
                    Online • Real-Time Ethiopian Real Estate
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
                  title="Clear conversation"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition hidden sm:block"
                  title={isExpanded ? 'Shrink window' : 'Expand window'}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={onToggle}
                  className="p-1.5 hover:bg-white/15 text-white rounded-lg transition ml-1"
                  title="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F4F5EF] dark:bg-[#0F1116] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm shadow-sm relative group ${
                        message.sender === 'user'
                          ? 'bg-[#181B22] text-white rounded-br-none border border-[#2E3543]'
                          : 'bg-white dark:bg-[#181B22] border border-slate-200/80 dark:border-[#2E3543] text-slate-800 dark:text-slate-100 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {/* Formatted Text */}
                      <div className="whitespace-pre-wrap">
                        {renderFormattedText(message.text)}
                      </div>

                      {/* Bot Message Copy Button */}
                      {message.sender === 'bot' && (
                        <button
                          onClick={() => copyToClipboard(message.text, message.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#C9A865] rounded transition bg-white/80 dark:bg-[#0F1116]/80 backdrop-blur"
                          title="Copy response"
                        >
                          {copiedId === message.id ? <Check size={12} className="text-[#2E7D4F]" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div
                      className={`text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 flex items-center gap-1 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>{formatTime(message.timestamp)}</span>
                    </div>

                    {/* Action Navigation Buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {message.actions.map((act, actIdx) => (
                          <button
                            key={actIdx}
                            onClick={() => handleActionClick(act)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#181B22]/10 hover:bg-[#181B22]/20 dark:bg-[#262C37]/40 dark:hover:bg-[#262C37] text-[#181B22] dark:text-[#C9A865] px-3 py-1.5 rounded-xl border border-[#181B22]/20 dark:border-[#2E3543] transition shadow-xs"
                          >
                            <span>{act.label}</span>
                            <ArrowRight size={12} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Interactive Topic Suggestion Chips */}
                    {message.options && message.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {message.options.map((option, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => handleOptionClick(option)}
                            className="text-xs font-medium bg-white dark:bg-[#181B22] hover:bg-slate-100 dark:hover:bg-[#262C37] text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#2E3543] transition shadow-xs hover:border-[#C9A865] dark:hover:border-[#C9A865] hover:text-[#C9A865] dark:hover:text-[#C9A865]"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator Bubble */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-[#181B22] border border-slate-200 dark:border-[#2E3543] rounded-2xl rounded-bl-none px-4 py-3 shadow-xs">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 bg-[#C9A865] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#C9A865] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-[#C9A865] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="p-3.5 bg-white dark:bg-[#181B22] border-t border-slate-200/80 dark:border-[#2E3543] shrink-0">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about properties, fees, Chapa, Telebirr..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-[#0F1116] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A865] border border-transparent dark:border-[#2E3543] transition"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="absolute right-2 bg-[#181B22] hover:bg-[#262C37] text-white border border-[#C9A865] p-2 rounded-xl transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  title="Send message"
                >
                  <Send size={15} className="text-[#C9A865]" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#2E7D4F]" />
                  UrbanNEST Verified AI
                </span>
                <span>Press Enter ↵</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;