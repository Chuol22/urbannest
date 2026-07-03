import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  options?: string[];
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! 👋 I'm UrbanNEST Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      options: ['Find Properties', 'List Property', 'Booking Help', 'Pricing']
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Bot responses based on user input
  const getBotResponse = (userMessage: string): { text: string; options?: string[] } => {
    const msg = userMessage.toLowerCase();

    if (msg.includes('property') || msg.includes('find') || msg.includes('search')) {
      return {
        text: "Great! You can find properties by using our search bar on the home page. Would you like me to help you with:\n\n• Price range filters\n• Location-based search\n• Property type selection",
        options: ['Price Filters', 'Location Search', 'Property Types']
      };
    }

    if (msg.includes('list') || msg.includes('sell') || msg.includes('rent out')) {
      return {
        text: "To list your property, click the 'List Your Property' button. You'll need to:\n\n1. Provide property details\n2. Upload photos\n3. Set price and availability\n\nWould you like a step-by-step guide?",
        options: ['Yes, guide me', 'Pricing help', 'Requirements']
      };
    }

    if (msg.includes('book') || msg.includes('viewing') || msg.includes('schedule')) {
      return {
        text: "To schedule a viewing:\n\n1. Find your desired property\n2. Click 'Request Viewing'\n3. Choose a date and time\n4. Wait for owner confirmation\n\nWould you like to see available properties now?",
        options: ['Show Properties', 'Cancelation Policy', 'Contact Support']
      };
    }

    if (msg.includes('price') || msg.includes('cost') || msg.includes('fee')) {
      return {
        text: "Our pricing is transparent:\n\n• Property listing: Free\n• Booking fee: 5% of first month's rent\n• Premium features: Starting from $9.99/month\n\nNeed specific pricing details?",
        options: ['Premium Features', 'Payment Methods', 'Discounts']
      };
    }

    if (msg.includes('help') || msg.includes('support')) {
      return {
        text: "I'm here to help! You can:\n\n• Call us: +251-111-234-567\n• Email: support@urbannest.com\n• Live chat: Available 24/7\n\nWhat would you like assistance with?",
        options: ['Contact Support', 'FAQ', 'Report Issue']
      };
    }

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return {
        text: "Hello! 👋 Welcome to UrbanNEST. How can I assist you with your property needs today?",
        options: ['Find Properties', 'List Property', 'Booking Help', 'Pricing']
      };
    }

    return {
      text: "Thank you for your message! Our team will get back to you shortly. In the meantime, you can:\n\n• Browse properties\n• Check our FAQ\n• Schedule a callback\n\nWould you like me to help with any of these?",
      options: ['Browse Properties', 'FAQ', 'Schedule Callback']
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = getBotResponse(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        options: botResponse.options
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleOptionClick = (option: string) => {
    setInputText(option);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed bottom-8 right-8 z-50 bg-amber-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 group border-2 border-white/20 backdrop-blur-sm"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-28 right-8 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200/50 backdrop-blur-sm"
          >
            {/* Header */}
            <div className="bg-amber-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">UrbanNEST Assistant</h3>
                    <p className="text-xs opacity-90">Online • Usually replies instantly</p>
                  </div>
                </div>
                <button onClick={onToggle} className="hover:bg-white/20 rounded-full p-1 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${message.sender === 'user'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.timestamp)}
                    </div>

                    {/* Quick Options */}
                    {message.options && message.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleOptionClick(option)}
                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-amber-600 text-white p-2 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Powered by UrbanNEST AI • 24/7 Support
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;