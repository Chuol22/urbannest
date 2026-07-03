import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Phone, MapPin, MessageSquare, Clock } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const contactInfo = [
  {
    icon: '📍',
    title: 'Visit Us',
    details: ['123 Main Street', 'Addis Ababa, Bole 24', 'Ethiopia'],
    action: 'Get Directions',
  },
  {
    icon: '📞',
    title: 'Call Us',
    details: ['+251960779507', '+251976540694'],
    action: 'Call Now',
  },

  {
    icon: '✉️',
    title: 'Email Us',
    details: ['support@urbannest.com', 'info@urbannest.com', '24/7 Response Time'],
    action: 'Send Email',
  },
];

const faqs = [
  {
    question: 'How quickly will I get a response?',
    answer: 'We typically respond within 24 hours during business days. For urgent matters, please call our support line.',
  },
  {
    question: 'Can I schedule a property viewing?',
    answer: 'Yes! Once you find a property you like, you can schedule a viewing directly through the property page.',
  },
  {
    question: 'What if I have issues with my rental?',
    answer: 'Our support team is here to help. Contact us and we\'ll assist you with any rental-related issues.',
  },
];

export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);

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
    const observer = new ResizeObserver(updateHeaderHeight);
    const header = document.querySelector('header');
    if (header) {
      observer.observe(header);
    }
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      observer.disconnect();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate success
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage((err as Error).message || 'Failed to send message. Please try again.');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Premium Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&fit=crop')`,
              backgroundPosition: 'center 40%'
            }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gray-900/40" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        </div>

        {/* Hero Content */}
        <div
          className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center"
          style={{ paddingTop: `${headerHeight}px` }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 12 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-6 py-2 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-bold backdrop-blur-md uppercase tracking-wider">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <MessageSquare size={14} className="text-amber-400" />
                </motion.div>
                Get In Touch
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 leading-tight drop-shadow-2xl"
            >
              We're Here <br />
              <span className="text-amber-400">
                To Help You
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-12 drop-shadow-md"
            >
              Have questions about properties or our platform? Our team is available 24/7
              to assist you with any inquiries.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
              className="flex justify-center gap-8 text-white/80"
            >
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Clock size={18} className="text-amber-400" />
                <span className="text-sm font-medium">Fast Response</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Phone size={18} className="text-amber-400" />
                <span className="text-sm font-medium">Direct Support</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-white dark:bg-gray-900 pointer-events-none" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 150, damping: 12 }}
              viewport={{ once: true }}
              whileHover={{ y: -12, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-900 rounded-xl p-8 text-center hover:shadow-xl transition-all duration-300 border-b-4 border-amber-600"
            >
              <motion.div
                className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                whileHover={{ rotate: 360 }}
              >
                {info.icon}
              </motion.div>
              <h3 className="text-xl font-black text-white mb-4">{info.title}</h3>
              {info.details.map((detail, idx) => (
                <p key={idx} className="text-gray-300 mb-1">{detail}</p>
              ))}
              <motion.button
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 text-amber-400 hover:text-amber-300 text-sm font-medium"
              >
                {info.action} →
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Contact Form and FAQ */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className='bg-white rounded-2xl shadow-lg p-8 border-b-4 border-amber-600'
          >
            <h2 className="text-3xl mt-4 font-black text-center text-gray-900 mb-2">Send Us a Message</h2>
            <div className='w-20 h-1.5 bg-amber-600 mx-auto rounded-full mb-4'></div>
            <p className="text-gray-600 mb-8 text-center">
              Whether you have a question about our properties, need assistance, or just want to say hello,
              we'd love to hear from you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus === 'success' && (
                <Alert
                  type="success"
                  title="Message Sent!"
                  message="Thank you for reaching out. We'll get back to you soon."
                />
              )}

              {submitStatus === 'error' && (
                <Alert
                  type="error"
                  title="Error"
                  message={errorMessage}
                />
              )}

              <Input
                label="Full Name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="My name"
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="me@example.com"
              />

              <div>
                <label className="block ml-4 text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="property">Property Question</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="How can we help you?"
                />
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button type="submit" loading={isSubmitting} fullWidth className="bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/30">
                  Send Message
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 100, damping: 15 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8 border-b-4 border-amber-600">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 15 }}
                    viewport={{ once: true }}
                    whileHover={{ x: 5 }}
                    className="cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 text-sm">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm mb-3">
                  Can't find what you're looking for?
                </p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" fullWidth className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white">
                    View All FAQs
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.section
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
          viewport={{ once: true }}
        >
          <div className="bg-gray-100 rounded-xl overflow-hidden h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center"
            >
              <MapPin className="w-16 h-16 text-amber-600 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Interactive Map Coming Soon</p>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}