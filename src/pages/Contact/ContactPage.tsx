import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, CONTACT_INFO } from '@/config/constants';
import { Footer } from '@/components/layout/Footer';

export const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white border-b border-neutral-100 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-800 mb-4 sm:mb-6">
              Get in Touch
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-neutral-500 leading-relaxed">
              We'd love to hear from you. Reach out to our team for reservations,
              inquiries, or just to say hello.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-12 sm:py-16 lg:py-20 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Left Column - Contact Cards */}
            <div className="space-y-4 sm:space-y-6">
              {/* Main Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 lg:p-8 shadow-sm"
              >
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-800 mb-6 sm:mb-8">
                  Contact Information
                </h2>

                <div className="space-y-5 sm:space-y-6">
                  {/* Address */}
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-neutral-800 mb-1">Location</h3>
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        {CONTACT_INFO.address.street}<br />
                        {CONTACT_INFO.address.city}, {CONTACT_INFO.address.state} {CONTACT_INFO.address.zip}<br />
                        {CONTACT_INFO.address.country}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-neutral-100">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-neutral-800 mb-1">Phone</h3>
                      <a
                        href={`tel:${CONTACT_INFO.phone}`}
                        className="text-neutral-700 hover:text-primary-600 font-medium transition-colors text-sm sm:text-base"
                      >
                        {CONTACT_INFO.phone}
                      </a>
                      <p className="text-xs text-neutral-400 mt-1">
                        Available {CONTACT_INFO.hours.frontDesk}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-neutral-100">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-neutral-800 mb-1">Email</h3>
                      <a
                        href={`mailto:${CONTACT_INFO.email}`}
                        className="text-neutral-700 hover:text-primary-600 font-medium transition-colors text-sm break-all"
                      >
                        {CONTACT_INFO.email}
                      </a>
                      <p className="text-xs text-neutral-400 mt-1">
                        We'll respond within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Hours */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 lg:p-8 shadow-sm"
              >
                <div className="flex gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-primary-600" />
                  </div>
                  <div className="flex items-center">
                    <h3 className="text-lg sm:text-xl font-semibold text-neutral-800">Hours of Operation</h3>
                  </div>
                </div>
                <div className="space-y-0 sm:ml-[60px]">
                  <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="text-sm text-neutral-500">Front Desk</span>
                    <span className="text-sm font-semibold text-neutral-700">{CONTACT_INFO.hours.frontDesk}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="text-sm text-neutral-500">Check-in</span>
                    <span className="text-sm font-semibold text-neutral-700">After {CONTACT_INFO.hours.checkIn}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-neutral-500">Check-out</span>
                    <span className="text-sm font-semibold text-neutral-700">Before {CONTACT_INFO.hours.checkOut}</span>
                  </div>
                </div>
              </motion.div>

              {/* Social Media */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 lg:p-8 shadow-sm"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-800 mb-4 sm:mb-5">Follow Us</h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={CONTACT_INFO.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-neutral-100 rounded-lg flex items-center justify-center hover:bg-primary-600 group transition-all duration-200"
                    aria-label="Instagram"
                  >
                    <Instagram size={20} className="text-neutral-500 group-hover:text-white transition-colors" />
                  </a>
                  <a
                    href={CONTACT_INFO.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-neutral-100 rounded-lg flex items-center justify-center hover:bg-primary-600 group transition-all duration-200"
                    aria-label="Facebook"
                  >
                    <Facebook size={20} className="text-neutral-500 group-hover:text-white transition-colors" />
                  </a>
                  <a
                    href={`https://twitter.com/${CONTACT_INFO.social.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-neutral-100 rounded-lg flex items-center justify-center hover:bg-primary-600 group transition-all duration-200"
                    aria-label="Twitter"
                  >
                    <Twitter size={20} className="text-neutral-500 group-hover:text-white transition-colors" />
                  </a>
                  <a
                    href={CONTACT_INFO.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 bg-neutral-100 rounded-lg flex items-center justify-center hover:bg-primary-600 group transition-all duration-200"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={20} className="text-neutral-500 group-hover:text-white transition-colors" />
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Map Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden h-full shadow-sm">
                <div className="relative h-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
                  {/* Map Placeholder */}
                  <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                    <div className="text-center p-6 sm:p-8">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-sm">
                        <MapPin size={24} className="text-primary-600 sm:w-7 sm:h-7" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-neutral-800 mb-2">
                        {APP_NAME}
                      </h3>
                      <p className="text-neutral-500 mb-3 sm:mb-4 text-sm sm:text-base">{APP_TAGLINE}</p>
                      <p className="text-sm text-neutral-600 font-medium">
                        {CONTACT_INFO.address.street}<br />
                        {CONTACT_INFO.address.city}, {CONTACT_INFO.address.state}
                      </p>
                      <p className="text-xs text-neutral-400 mt-5 sm:mt-6 px-4 py-2 bg-white rounded-lg border border-neutral-200 inline-block">
                        Google Maps integration coming soon
                      </p>
                    </div>
                  </div>

                  {/* Uncomment and add your Google Maps embed code here */}
                  {/*
                  <iframe
                    src="YOUR_GOOGLE_MAPS_EMBED_URL"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Glimmora Location"
                  ></iframe>
                  */}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-neutral-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 sm:mb-5">
              Ready to Experience Glimmora?
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
              Book your stay today and discover where modern luxury meets natural tranquility.
            </p>
            <a
              href="/rooms"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all"
            >
              View Available Rooms
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
