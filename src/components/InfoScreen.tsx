import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Globe, Mail, Instagram, Building2, Navigation, Share2, ArrowLeft, MessageCircle, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface InfoScreenProps {
  onLocationClick: (locationId: string) => void;
}

export const InfoScreen: React.FC<InfoScreenProps> = ({ onLocationClick }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      {/* Hero Header */}
      <section className="text-center py-4 space-y-4">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-surface-container-lowest shadow-sm mb-2">
          <img 
            alt="Surrey Islamic Society" 
            className="w-20 h-20 object-contain"
            src="/images/ISOC.png"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Surrey Islamic Society</h1>
        <p className="font-body text-on-surface-variant max-w-md mx-auto leading-relaxed text-sm">
          Connecting the community through faith, education, and shared spaces across Surrey.
        </p>
      </section>

      {/* Bento Grid Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-headline font-bold text-xl text-on-surface">Prayer Locations</h2>
          </div>
          <div className="space-y-4">
            <LocationItem 
              title="Islamic Prayer Centre" 
              desc="Main Campus Hub for Daily & Jumu'ah Prayers" 
              icon={<Building2 className="w-5 h-5" />}
              onClick={() => onLocationClick('ipc')}
            />
            <LocationItem 
              title="Manor Park Prayer Room" 
              desc="Quiet multi-faith space for reflection" 
              icon={<MapPin className="w-5 h-5" />}
              onClick={() => onLocationClick('manor-park')}
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary-container rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-headline font-bold text-lg text-on-surface">Contact Email</h2>
          </div>
          <a href="mailto:info@surreyisoc.com" className="font-body text-primary font-semibold hover:underline text-sm break-all">
            info@surreyisoc.com
          </a>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-tertiary-fixed rounded-lg">
              <Users className="w-5 h-5 text-tertiary" />
            </div>
            <h2 className="font-headline font-bold text-lg text-on-surface">Socials</h2>
          </div>
          <div className="space-y-3">
            <a href="#" className="flex items-center gap-2 font-body text-tertiary font-semibold text-sm hover:underline">
              <Instagram className="w-4 h-4" /> @SurreyIslamicSociety
            </a>
            <a 
              href="https://chat.whatsapp.com/F0bE4Gc60zm9WwoaNcot2q" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 font-body text-[#25D366] font-semibold text-sm hover:underline"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Group
            </a>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-xl text-on-surface px-1">Interactive Map</h2>
        <div className="w-full h-64 rounded-xl overflow-hidden shadow-sm relative group border border-outline-variant/20">
          <img 
            alt="Map" 
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwVPb3gWsU69E7EVgAHaaeVhdMR0IFWzPCjFuR21cWEZc7DnFYXdRKk27ELXylXOkrXpQ_F0jNbGUKPz_z1FS5S-nSTlcFQOphZ2DlEnHWm19KBVb_p_rZ8vzLAZAAugNWevhfC3g5E3ISgg2gz0Qstt0OmWeOXBvXK1NpMuLZrhW839UAttV-dRanuS8U_QYCfyZy9-TOjO6Jel8e2YDu5MnN4sbjxwHhCoLj6E29oB36Wz9RgLBDVrIEtNnzvb6r0-ZpvjRInw"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-300"></div>
          <div className="absolute bottom-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-4 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2 border border-outline-variant/10">
            <MapPin className="w-3 h-3 text-primary fill-primary" />
            GUILDFORD CAMPUS LOCATIONS
          </div>
        </div>
      </section>

      {/* Community Note */}
      <div className="p-6 rounded-xl bg-primary-container/10 border border-primary-container/20 text-center">
        <p className="font-body italic text-primary text-sm">
          "The Prayer Room is the heart of the community. All are welcome to visit, learn, and grow together."
        </p>
      </div>
    </div>
  );
};

const LocationItem = ({ title, desc, icon, onClick }: { title: string, desc: string, icon: React.ReactNode, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container group cursor-pointer"
  >
    <div className="text-primary mt-1 group-hover:scale-110 transition-transform">{icon}</div>
    <div>
      <h3 className="font-headline font-bold text-primary text-sm">{title}</h3>
      <p className="font-body text-[11px] text-on-surface-variant">{desc}</p>
    </div>
  </div>
);
