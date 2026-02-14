import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Globe, Heart, PhoneCall, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MentalHealthResources = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const resources = [
    {
      id: 1,
      name: 'CHO Taguig',
      subtitle: 'Mental Health Clinic and Online Service',
      availability: 'Weekdays, 8:00 am - 5:00 pm',
      classification: 'Government',
      contact: {
        phone: ['0929-521-8373', '0967-039-3456'],
        email: 'mhptaguig@gmail.com',
        address: 'Lakeshore, C6, Lower Bicutan, Taguig City, NCR',
        website: 'https://mentalhealthph.org/directory/listing/cho-taguig-mental-health-clinic-and-online-service/',
      },
      categories: ['Crisis Hotline', 'Advocacy Group', 'Online Services / Telemental Health'],
      deliveryMode: 'Hybrid',
      services: ['Consultation', 'Counseling / Therapy', 'Information Dissemination', 'Medication', 'Psychological Assessment'],
      mhpssLevel: 'Level 4 – Specialised Mental Health Care',
    },
    {
      id: 2,
      name: 'National Center for Mental Health',
      subtitle: 'Crisis Hotline & Hospital Services',
      availability: 'Anytime, 24/7',
      classification: 'Government',
      contact: {
        phone: ['0919-057-1553', '0918-639-2672', '0917-899-8727', '0966-351-4518'],
        telNo: ['8531-9001', '(02) 7-989-8727'],
        nationwide: [{ number: '(02) 1553', type: 'Toll-free' }],
        phoneByProvider: [
          { number: '0919-057-1553', type: 'Smart/TNT' },
          { number: '0918-639-2672', type: 'Smart/TNT' },
          { number: '0917-899-8727', type: 'Globe/TM' },
          { number: '0966-351-4518', type: 'Globe/TM' },
        ],
        email: 'mcc@ncmh.gov.ph',
        address: 'Nueve de Pebrero Street, Mauway, Mandaluyong City, NCR',
        website: 'https://ncmh.gov.ph/',
      },
      categories: ['Crisis Hotline', 'Hospital'],
      deliveryMode: 'Hybrid',
      services: [
        'Consultation',
        'Counseling / Therapy',
        'Emergency Services',
        'Information Dissemination',
        'Medication',
        'Psychological Assessment',
        'Training',
      ],
      mhpssLevel: 'Level 4 – Specialised Mental Health Care',
      icon: '🏨',
    },
  ];

  const handlePhoneClick = (phone) => {
    window.location.href = `tel:${String(phone).replace(/[^0-9-]/g, '')}`;
  };

  const handleEmailClick = (email) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E8] to-[#E8F5E8] pb-8">
      {/* Navbar (same style as LandingPage/About) */}
      <nav className="w-full bg-[#55AD9B] backdrop-blur-lg fixed top-0 z-50 shadow-lg border-b border-[#95D2B3]/20">
        <div className="container mx-auto flex justify-between items-center px-6 py-4">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[#F1F8E8] text-3xl font-bold tracking-wide"
          >
            Mindful Map
          </motion.h1>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300" />
              </Link>
              <Link to="/about" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                to="/mental-health-resources"
                className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group"
              >
                Resources
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300" />
              </Link>
              {/* <Link to="/" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300" />
              </Link> */}
            </div>
          </div>

          {/* Get Started Button */}
          <div className="hidden md:block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/signup"
                className="bg-[#F1F8E8] text-[#55AD9B] text-lg px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold hover:bg-white"
              >
                Sign Up
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="text-[#F1F8E8] focus:outline-none p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-[#55AD9B]/95 backdrop-blur-lg border-t border-[#95D2B3]/20 shadow-lg"
            >
              <div className="flex flex-col space-y-4 py-6 px-6">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/mental-health-resources"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Resources
                </Link>
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-[#F1F8E8] text-[#55AD9B] px-6 py-3 rounded-full text-center shadow-lg hover:bg-white"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Page Content (offset for fixed navbar) */}
      <div className="pt-20 md:pt-24">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#6fba94] to-[#5aa88f] text-white py-12 px-4 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold">Mental Health Support</h1>
            </div>
            <p className="text-lg text-center text-white/90 max-w-2xl mx-auto">
              You're not alone. Here are trusted mental health resources available to support your wellbeing journey.
            </p>
          </div>
        </div>

        {/* Crisis Banner */}
        <div className="max-w-6xl mx-auto px-4 mt-8 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-[#6fba94]">
            <div className="flex items-start gap-3">
              <PhoneCall className="w-6 h-6 text-[#6fba94] flex-shrink-0 mt-1 animate-pulse" />
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">Need Immediate Help?</h3>
                <p className="text-gray-600">
                  If you're in crisis, call the National Center for Mental Health hotline at{' '}
                  <a href="tel:021553" className="font-bold text-[#6fba94] hover:underline">
                    (02) 1553
                  </a>{' '}
                  available 24/7
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-12 mb-12">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-[#6fba94] to-[#5aa88f] text-white p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{resource.name}</h2>
                      <p className="text-white/90 text-lg">{resource.subtitle}</p>
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
                      {resource.classification}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-8">
                  {/* Availability */}
                  <div className="bg-gradient-to-r from-[#6fba94]/10 to-[#5aa88f]/10 rounded-xl p-4 border border-[#6fba94]/20 mb-8">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-[#6fba94]" />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Available</p>
                        <p className="text-lg font-bold text-gray-900">{resource.availability}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Left Column - Contact Info */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-[#6fba94]" />
                        Contact Information
                      </h3>

                      {/* Tel No */}
                      {resource.contact.telNo && resource.contact.telNo.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Tel. No:</p>
                          {resource.contact.telNo.map((phone, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePhoneClick(phone)}
                              className="flex items-center gap-2 w-full p-3 bg-gray-50 rounded-lg hover:bg-[#6fba94]/10 transition text-left group border border-gray-200"
                            >
                              <PhoneCall className="w-4 h-4 text-[#6fba94] group-hover:scale-110 transition" />
                              <span className="text-gray-900 font-medium">{phone}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Nationwide Landline */}
                      {resource.contact.nationwide && resource.contact.nationwide.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Nationwide Landline:</p>
                          {resource.contact.nationwide.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePhoneClick(item.number)}
                              className="flex items-center gap-2 w-full p-3 bg-gray-50 rounded-lg hover:bg-[#6fba94]/10 transition text-left group border border-gray-200"
                            >
                              <PhoneCall className="w-4 h-4 text-[#6fba94] group-hover:scale-110 transition" />
                              <div className="flex-1">
                                <span className="text-gray-900 font-medium">{item.number}</span>
                                <span className="text-gray-600 text-sm ml-2">({item.type})</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Phone Numbers - NCMH */}
                      {resource.contact.phoneByProvider && resource.contact.phoneByProvider.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Phone Numbers:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {resource.contact.phoneByProvider.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => handlePhoneClick(item.number)}
                                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-[#6fba94]/10 transition text-left group border border-gray-200"
                              >
                                <PhoneCall className="w-4 h-4 text-[#6fba94] group-hover:scale-110 transition flex-shrink-0" />
                                <div>
                                  <span className="text-gray-900 font-medium text-sm">{item.number}</span>
                                  <p className="text-gray-600 text-xs">{item.type}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Phone Numbers - CHO */}
                      {resource.id === 1 && resource.contact.phone && resource.contact.phone.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Phone Numbers:</p>
                          {resource.contact.phone.map((phone, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePhoneClick(phone)}
                              className="flex items-center gap-2 w-full p-3 bg-gray-50 rounded-lg hover:bg-[#6fba94]/10 transition text-left group border border-gray-200"
                            >
                              <PhoneCall className="w-4 h-4 text-[#6fba94] group-hover:scale-110 transition" />
                              <span className="text-gray-900 font-medium">{phone}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Email */}
                      {resource.contact.email && (
                        <button
                          onClick={() => handleEmailClick(resource.contact.email)}
                          className="flex items-center gap-3 w-full p-3 bg-gray-50 rounded-lg hover:bg-[#6fba94]/10 transition text-left group border border-gray-200 mb-4"
                        >
                          <Mail className="w-5 h-5 text-[#6fba94] group-hover:scale-110 transition" />
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Email</p>
                            <p className="text-gray-900 font-medium break-all">{resource.contact.email}</p>
                          </div>
                        </button>
                      )}

                      {/* Address */}
                      {resource.contact.address && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <MapPin className="w-5 h-5 text-[#6fba94] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-600 font-medium mb-1">Address</p>
                            <p className="text-gray-900">{resource.contact.address}</p>
                          </div>
                        </div>
                      )}

                      {/* Website */}
                      {resource.contact.website && (
                        <a
                          href={resource.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#6fba94] hover:text-[#5aa88f] font-semibold group mt-4"
                        >
                          <Globe className="w-5 h-5 group-hover:scale-110 transition" />
                          <span className="underline">Visit Website</span>
                        </a>
                      )}
                    </div>

                    {/* Right Column - Services & Details */}
                    <div>
                      {/* Service Categories */}
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Service Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {resource.categories.map((category, idx) => (
                            <span
                              key={idx}
                              className="bg-[#6fba94]/10 text-[#6fba94] text-sm px-3 py-1.5 rounded-full font-medium border border-[#6fba94]/20"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Services Offered */}
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Services Offered</h3>
                        <ul className="space-y-2">
                          {resource.services.map((service, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                              <span className="text-[#6fba94] font-bold mt-1 text-lg">✓</span>
                              <span>{service}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Delivery Mode & MHPSS Level */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-br from-[#6fba94]/5 to-[#5aa88f]/5 p-4 rounded-lg border border-[#6fba94]/20">
                          <p className="text-xs font-bold text-gray-600 uppercase mb-1">Mode of Delivery</p>
                          <p className="text-base font-semibold text-gray-900">{resource.deliveryMode}</p>
                        </div>
                        <div className="bg-gradient-to-br from-[#6fba94]/5 to-[#5aa88f]/5 p-4 rounded-lg border border-[#6fba94]/20">
                          <p className="text-xs font-bold text-gray-600 uppercase mb-1">MHPSS Level</p>
                          <p className="text-base font-semibold text-gray-900">{resource.mhpssLevel}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Self-Care Tips Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Heart className="w-7 h-7 text-[#6fba94] mr-3" />
              Self-Care Tips
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { emoji: '🧘', title: 'Practice Mindfulness', desc: 'Take a few minutes daily to breathe deeply and be present in the moment.' },
                { emoji: '🚶', title: 'Move Your Body', desc: 'Regular exercise and physical activity can significantly boost your mental health.' },
                { emoji: '💬', title: 'Connect with Others', desc: 'Share your feelings with trusted friends, family, or mental health professionals.' },
              ].map((tip, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-[#F1F8E8] to-[#E8F5E8] p-6 rounded-xl text-center border border-[#6fba94]/20 hover:shadow-lg transition"
                >
                  <div className="text-5xl mb-4">{tip.emoji}</div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">{tip.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Message */}
          <div className="bg-gradient-to-r from-[#6fba94]/10 to-[#5aa88f]/10 rounded-xl p-6 text-center border border-[#6fba94]/20">
            <p className="text-gray-700 text-lg font-medium">
              <span className="text-[#6fba94] font-bold">Remember:</span> Seeking help is a sign of strength. Mental health is just as important as physical health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentalHealthResources;