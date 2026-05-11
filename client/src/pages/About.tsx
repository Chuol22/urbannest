// client/src/pages/About.tsx
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  FaHome, 
  FaShieldAlt, 
  FaHeadset, 
  FaUsers, 
  FaHandshake, 
  FaGlobe,
  FaCheckCircle,
  FaArrowRight,
  FaHeart,
  FaStar,
  FaBuilding,
  FaChartLine,
  FaChevronRight
} from 'react-icons/fa';
import { Home as HomeIcon, Star, Info, Target, Users } from 'lucide-react';

// Hero background images for rotation
const heroImages = [
  'https://images.unsplash.com/photo-1560518883-ce09059eeffc?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=1080&fit=crop',
];

// Team members data
const teamMembers = [
  {
    name: "JAMES D.",
    role: "CEO & Founder",
    image: "JD.jpg",
    alt:'JD',
    bio: "6+ years in real estate tech"
  },
  {
    name: "CHUOL N",
    role: "CTO",
    image: "CN.jpg",
    alt:'CN',
    bio: "Former Google engineer"
  },
  {
    name: "Ganun T",
    role: "Head of Operations",
    image: "GT.jpg",
    alt:'GN',
    bio: "Property management expert"
  },
  {
    name: "David DE",
    role: "Customer Success",
    image: " DDE.jpg",
    alt:'DDE',
    bio: "Customer satisfaction specialist"
  }
];

// Milestones data
const milestones = [
  { year: "2020", title: "Founded", description: "UrbanNEST was born in Addis Ababa" },
  { year: "2021", title: "200+ Properties", description: "Reached 500 property listings" },
  { year: "2022", title: "500+ Users", description: "Celebrated 1000 happy customers" },
  { year: "2023", title: "Ethiopia-wide", description: "Expanded across major cities" },
  { year: "2024", title: "AI Features", description: "Launched smart search & chatbot" }
];

// Stats data
const stats = [
  { icon: FaHome, label: "Properties Listed", value: 5000, suffix: "+" },
  { icon: FaUsers, label: "Happy Customers", value: 10000, suffix: "+" },
  { icon: FaBuilding, label: "Cities Covered", value: 25, suffix: "+" },
  { icon: FaStar, label: "Average Rating", value: 4.8, suffix: "" }
];


// Animation variants matching WhatWeBuild component
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, type: "spring", stiffness: 100, damping: 15 } 
  }
};

const fadeInLeftVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.6, type: "spring", stiffness: 100, damping: 15 } 
  }
};

const fadeInRightVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.6, type: "spring", stiffness: 100, damping: 15 } 
  }
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, type: "spring", stiffness: 150, damping: 12 } 
  }
};

export default function About() {
  const navigate = useNavigate();
  const [countedStats, setCountedStats] = useState(stats.map(() => 0));
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const statsRef = useRef(null);
  const sectionRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  // Rotating background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const handleSearch = () => {
    navigate('/properties');
  };

  return (
    <>
      <Helmet>
        <title>About Us | UrbanNEST - Your Trusted Property Partner</title>
        <meta name="description" content="Learn about UrbanNEST's mission to revolutionize the real estate market with transparent, efficient, and user-friendly property solutions." />
        <meta name="keywords" content="about UrbanNEST, real estate platform, property management, Ethiopian real estate" />
      </Helmet>

      <div className="overflow-x-hidden bg-white dark:bg-gray-900">
        {/* Hero Section - Matching Home.tsx style */}
        <section 
          ref={sectionRef}
          className="relative min-h-full flex items-center justify-center overflow-hidden"
        >
           
          {/* Hero Content */}
          <div 
            className="relative mx-auto px-4 sm:px-6 md:px-8 lg:px-10"
            style={{
            paddingTop: `${headerHeight + 80}px`,
            paddingBottom: '100px',
          }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
              className="max-w-5xl mx-auto text-center"
            >
 
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-gray-800 dark:text-gray-200 mb-6 leading-tight drop-shadow-2xl"
              >
                Our Story,
                <span className="block italic text-gray-500">
                  Your Future
                </span>
              </motion.h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '5rem' }}
                transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 100, damping: 15 }}
                className='h-1.5 mb-4 bg-amber-600 mx-auto rounded-full'
              ></motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12 drop-shadow-md"
              >
                Revolutionizing the real estate journey with transparency, 
                efficiency, and premium property solutions.
              </motion.p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 150, damping: 12 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/contact')}
                  className="px-10 py-4 bg-amber-600 dark:bg-amber-600 backdrop-blur-md border-2 border-white/60 text-white rounded-2xl font-bold tracking-wide transition-all duration-300 hover:bg-white hover:text-gray-900 shadow-xl shadow-amber-600/30"
                >
                  Contact Us
                </motion.button>
              </div>
            </motion.div>
          </div> 
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="py-16 bg-white dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={isStatsInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                    transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 150, damping: 12 }}
                    whileHover={{ y: -5, scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-center"
                  >
                    <motion.div 
                      className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                      >
                        <Icon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                      </motion.div>
                    </motion.div>
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {countedStats[index]}{stat.suffix}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainerVariants}
              className="grid md:grid-cols-2 gap-8"
            >
              <motion.div
                variants={fadeInLeftVariants}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-b-4 border-amber-600"
              >
                <motion.div 
                  className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mb-6"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <FaGlobe className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white ">Our Mission</h2>
                <div className='w-20 h-2 mb-4 bg-amber-600 rounded-full'></div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  At UrbanNEST, we're dedicated to helping individuals and families find their 
                  perfect home or commercial space. We believe that everyone deserves a comfortable, safe, and 
                  affordable place to live or work.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Our platform connects tenants with quality properties and landlords with reliable tenants, 
                  making the process seamless for everyone involved.
                </p>
              </motion.div>

              <motion.div
                variants={fadeInRightVariants}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border-b-4 border-amber-600"
              >
                <motion.div 
                  className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mb-6"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <FaChartLine className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Vision</h2>
                <div className='w-20 h-2 mb-4 bg-amber-600 rounded-full'></div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  To revolutionize the real estate market by creating a transparent, efficient, 
                  and user-friendly platform that makes finding and managing properties a seamless experience.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  We envision a future where finding your perfect space is as easy as a few clicks, 
                  backed by trust and innovation.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us - Grid matching WhatWeBuild */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUpVariants}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                Why Choose UrbanNEST?
              </h2>
              <div className="w-20 h-2 bg-amber-600 mx-auto rounded-full"></div>
              <p className="text-lg text-gray-400 dark:text-gray-300 max-w-2xl mx-auto mt-4">
                We stand out from the crowd with our commitment to quality and innovation
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainerVariants}
              className="grid md:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: FaShieldAlt,
                  title: "Verified Properties",
                  description: "Every property is thoroughly verified for authenticity, quality, and legal compliance.",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: FaHandshake,
                  title: "Secure Transactions",
                  description: "End-to-end encrypted payments and secure document handling for peace of mind.",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: FaHeadset,
                  title: "24/7 Support",
                  description: "Round-the-clock customer support to assist you at every step of your journey.",
                  color: "from-green-500 to-teal-500"
                }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    variants={cardVariants}
                    whileHover={{ y: -12, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-b-4 border-amber-600"
                  >
                    <motion.div 
                      className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mb-5"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-600 italic dark:text-gray-300 leading-relaxed">{feature.description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Milestones Timeline - Simplified */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUpVariants}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Our Journey</h2>
              <div className="w-20 h-1 bg-amber-600 mx-auto rounded-full"></div>
              <p className="text-lg text-gray-400 dark:text-gray-300 mt-4">Milestones that define our growth</p>
            </motion.div>

            <div className="grid md:grid-cols-5 gap-4">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={cardVariants}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:shadow-lg transition-all duration-300 border-l-4 border-amber-600"
                >
                  <motion.div 
                    className="text-3xl font-black text-gray-900 mb-2"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {milestone.year}
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{milestone.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{milestone.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUpVariants}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                Meet Our Team
              </h2>
              <div className="w-20 h-1 bg-amber-600 mx-auto rounded-full"></div>
              <p className="text-lg text-gray-400 dark:text-gray-200 max-w-2xl mx-auto mt-4">
                Passionate professionals dedicated to your success
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainerVariants}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover={{ y: -12, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-b-4 border-amber-600"
                >
                  <div className="relative overflow-hidden h-48">
                    <motion.img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="p-6 text-center">
                    <motion.h3 
                      className="text-xl font-black text-gray-900 dark:text-white mb-1"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      {member.name}
                    </motion.h3>
                    <p className="text-amber-600 dark:text-amber-400 font-medium mb-2">{member.role}</p>
                    <p className="text-gray-600 italic dark:text-gray-300 text-sm">{member.bio}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUpVariants}
              className="text-center mb-12 rounded-3xl"
            >
              <h2 className="text-3xl md:text-4xl text-amber-400 font-black mb-4">Our Core Values</h2>
              <div className="w-20 h-1 bg-white/50 mx-auto rounded-full"></div>
              <p className="text-lg text-gray-300 mt-4">The principles that guide everything we do</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainerVariants}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { title: "Integrity", description: "Honest and transparent in all dealings" },
                { title: "Innovation", description: "Constantly improving our platform" },
                { title: "Customer First", description: "Your satisfaction is our priority" },
                { title: "Community", description: "Building stronger neighborhoods" }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-center p-6 bg-gray-800 rounded-2xl hover:bg-gray-700 transition-all duration-300 border-b-4 border-amber-600"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                  >
                    <FaHeart className="w-12 h-12 mx-auto mb-4 text-amber-400" />
                  </motion.div>
                  <h3 className="text-xl font-black mb-2">{value.title}</h3>
                  <p className="text-gray-300">{value.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUpVariants}
              whileHover={{ scale: 1.01 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 shadow-lg border-b-4 border-amber-600"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              >
                <FaCheckCircle className="w-16 h-16 text-amber-600 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                Ready to Find Your Perfect Nest?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers who found their dream home or commercial space with UrbanNEST
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSearch}
                  className="group bg-amber-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2"
                >
                  Start Your Search
                  <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    <FaArrowRight className="" />
                  </motion.div>
                </motion.button>
                  
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}