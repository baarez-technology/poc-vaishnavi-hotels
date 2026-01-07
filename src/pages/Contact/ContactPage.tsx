import { Mail, Phone, MapPin, Clock, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, CONTACT_INFO } from '@/config/constants';
import { Card } from '@/components/ui';
import { Footer } from '@/components/layout/Footer';

export const ContactPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-white border-b border-neutral-200 py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-sans font-bold text-neutral-900 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed">
              We'd love to hear from you. Reach out to our team for reservations,
              inquiries, or just to say hello.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Contact Cards */}
            <div className="space-y-8">
              {/* Main Contact */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-8">
                <h2 className="text-3xl font-sans font-bold text-neutral-900 mb-8">
                  Contact Information
                </h2>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin size={24} className="text-neutral-900" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 mb-2">Location</h3>
                      <p className="text-neutral-600 leading-relaxed">
                        {CONTACT_INFO.address.street}<br />
                        {CONTACT_INFO.address.city}, {CONTACT_INFO.address.state} {CONTACT_INFO.address.zip}<br />
                        {CONTACT_INFO.address.country}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex gap-4 pt-6 border-t border-neutral-200">
                    <div className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone size={24} className="text-neutral-900" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 mb-2">Phone</h3>
                      <a
                        href={`tel:${CONTACT_INFO.phone}`}
                        className="text-neutral-900 hover:text-primary-600 font-medium transition-colors text-lg"
                      >
                        {CONTACT_INFO.phone}
                      </a>
                      <p className="text-sm text-neutral-500 mt-1">
                        Available {CONTACT_INFO.hours.frontDesk}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex gap-4 pt-6 border-t border-neutral-200">
                    <div className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail size={24} className="text-neutral-900" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 mb-2">Email</h3>
                      <a
                        href={`mailto:${CONTACT_INFO.email}`}
                        className="text-neutral-900 hover:text-primary-600 font-medium transition-colors"
                      >
                        {CONTACT_INFO.email}
                      </a>
                      <p className="text-sm text-neutral-500 mt-1">
                        We'll respond within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-8">
                <div className="flex gap-4 mb-6">
                  <div className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-neutral-900" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900">Hours of Operation</h3>
                  </div>
                </div>
                <div className="space-y-4 ml-[72px]">
                  <div className="flex justify-between items-center py-3 border-b border-neutral-200">
                    <span className="text-neutral-600 font-medium">Front Desk</span>
                    <span className="font-bold text-neutral-900">{CONTACT_INFO.hours.frontDesk}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-200">
                    <span className="text-neutral-600 font-medium">Check-in</span>
                    <span className="font-bold text-neutral-900">After {CONTACT_INFO.hours.checkIn}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-neutral-600 font-medium">Check-out</span>
                    <span className="font-bold text-neutral-900">Before {CONTACT_INFO.hours.checkOut}</span>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-6">Follow Us</h3>
                <div className="flex gap-4">
                  <a
                    href={CONTACT_INFO.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center hover:border-neutral-900 hover:bg-neutral-900 group transition-all"
                    aria-label="Instagram"
                  >
                    <Instagram size={24} className="text-neutral-900 group-hover:text-white transition-colors" />
                  </a>
                  <a
                    href={CONTACT_INFO.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center hover:border-neutral-900 hover:bg-neutral-900 group transition-all"
                    aria-label="Facebook"
                  >
                    <Facebook size={24} className="text-neutral-900 group-hover:text-white transition-colors" />
                  </a>
                  <a
                    href={`https://twitter.com/${CONTACT_INFO.social.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center hover:border-neutral-900 hover:bg-neutral-900 group transition-all"
                    aria-label="Twitter"
                  >
                    <Twitter size={24} className="text-neutral-900 group-hover:text-white transition-colors" />
                  </a>
                  <a
                    href={CONTACT_INFO.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 bg-white border-2 border-neutral-200 rounded-xl flex items-center justify-center hover:border-neutral-900 hover:bg-neutral-900 group transition-all"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={24} className="text-neutral-900 group-hover:text-white transition-colors" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Map Placeholder */}
            <div>
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden h-full">
                <div className="relative h-full min-h-[600px]">
                  {/* Map Placeholder - Replace with actual Google Maps embed */}
                  <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 bg-white border-2 border-neutral-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <MapPin size={40} className="text-neutral-900" />
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                        {APP_NAME}
                      </h3>
                      <p className="text-neutral-600 mb-4 text-lg">{APP_TAGLINE}</p>
                      <p className="text-neutral-700 font-medium">
                        {CONTACT_INFO.address.street}<br />
                        {CONTACT_INFO.address.city}, {CONTACT_INFO.address.state}
                      </p>
                      <p className="text-sm text-neutral-500 mt-6 px-6 py-3 bg-white rounded-lg border border-neutral-200 inline-block">
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-white mb-6">
            Ready to Experience Glimmora?
          </h2>
          <p className="text-neutral-300 text-xl mb-10 leading-relaxed">
            Book your stay today and discover where modern luxury meets natural tranquility.
          </p>
          <a
            href="/rooms"
            className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-neutral-900 bg-white rounded-xl hover:bg-neutral-100 transition-all shadow-lg hover:shadow-xl"
          >
            View Available Rooms
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};