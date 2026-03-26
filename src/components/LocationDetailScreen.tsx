import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, MapPin, Clock, Phone, Mail, Building2, Waves, BookOpen, Coffee, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';

interface LocationDetailProps {
  locationId: string;
  onBack: () => void;
}

const LOCATIONS_DATA: Record<string, any> = {
  'ipc': {
    name: 'Islamic Prayer Centre',
    address: 'Main Campus Hub, Surrey University, GU2 7XH',
    mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=51.2435,-0.5895',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC82_C7E-mY62BfW9gAQvBmpB42_hDXu0osh-iDqOMWZpbiq1i6AFnUkWp6Fxk3KHu1VOmKYQgKm9fDTXWZFiuc_Il7kfwuLU98xTM_YVj2so54zOH6AsyP8gon6KsY-RDnmGtwcg-PMoLAjFVy0ArxgC2mUntW7cJ2KWZ-YSLsnqQ0UCi0TYaFk_8XXJemmImuU27HF4B0xtzhCCoJlRUPAIy0iPQc8ym33m2S9fJWsgHOAHahIluMN_8a4ck9626UiPgbKWtew',
    facilities: ['Main Prayer Hall', 'Wudu Area', 'Library', 'Quiet Study Space']
  },
  'manor-park': {
    name: 'Manor Park Prayer Room',
    address: 'JB01-10, James Black Road, Manor Park, GU2 7YW',
    mapUrl: 'https://www.google.com/maps/dir/?api=1&destination=51.2415,-0.6025',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbrCPNVT8FTkaWmyajumo6mzGgentPCnpct0hFYlJmUbS7mn-yeTvUckfsLRhtR5bIx3sZpWCVVg4d0IaVi1BozUIrT_ZI6N7FoSYsbRtcai8JRQ-3Yg3VOJXzJs3GVCryYeuEYU6x3_s-Zy27C7GA3fPted-WJHS1RiwSiMHKPmt3LfIm1IJKO4LVVzBFMMYqmVsghTB-K2BpSViwixbWwognrAxM9U9Eu6uwyUwgyQ9JLfrORp_606IERARGiEzCIxY_NdERTg',
    facilities: ['Prayer Room', 'Ablution Facilities', 'Student Lounge']
  }
};

export const LocationDetailScreen: React.FC<LocationDetailProps> = ({ locationId, onBack }) => {
  const data = LOCATIONS_DATA[locationId] || LOCATIONS_DATA['ipc'];

  const handleGetDirections = () => {
    window.open(data.mapUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <h2 className="font-headline font-bold text-lg text-primary">ISOC Prayer Room</h2>
        <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
          <Share2 className="w-5 h-5 text-on-surface" />
        </button>
      </div>

      {/* Hero Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-md aspect-[16/10]">
        <img 
          alt={data.name} 
          className="w-full h-full object-cover"
          src={data.image}
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-primary border border-outline-variant/10 tracking-widest uppercase">
          {locationId === 'ipc' ? 'Surrey Campus' : 'Manor Park'}
        </div>
      </div>

      {/* Title & Address */}
      <section className="px-1">
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mb-3">{data.name}</h1>
        <div className="flex items-start gap-3 text-on-surface-variant">
          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">
            {data.address}
          </p>
        </div>
      </section>

      {/* Info Cards */}
      <div className="space-y-4">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Operating Hours</h3>
          </div>
          <p className="text-sm text-on-surface-variant ml-14">Open daily from 05:00 to 22:00</p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Contact Info</h3>
          </div>
          <div className="ml-14 space-y-1">
            <p className="text-sm text-on-surface-variant">info@surreyisoc.com</p>
            <p className="text-sm text-on-surface-variant">+44 1483 123456</p>
          </div>
        </div>
      </div>

      {/* Facilities */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-xl text-on-surface px-1">Facilities</h2>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          {data.facilities.map((facility: string, idx: number) => (
            <FacilityItem 
              key={facility}
              icon={idx === 0 ? <Building2 className="w-5 h-5" /> : idx === 1 ? <Waves className="w-5 h-5" /> : idx === 2 ? <BookOpen className="w-5 h-5" /> : <Coffee className="w-5 h-5" />} 
              label={facility} 
              isLast={idx === data.facilities.length - 1} 
            />
          ))}
        </div>
      </section>

      {/* Map Preview */}
      <div className="w-full h-48 rounded-2xl overflow-hidden shadow-sm relative border border-outline-variant/20">
        <img 
          alt="Map Location" 
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwVPb3gWsU69E7EVgAHaaeVhdMR0IFWzPCjFuR21cWEZc7DnFYXdRKk27ELXylXOkrXpQ_F0jNbGUKPz_z1FS5S-nSTlcFQOphZ2DlEnHWm19KBVb_p_rZ8vzLAZAAugNWevhfC3g5E3ISgg2gz0Qstt0OmWeOXBvXK1NpMuLZrhW839UAttV-dRanuS8U_QYCfyZy9-TOjO6Jel8e2YDu5MnN4sbjxwHhCoLj6E29oB36Wz9RgLBDVrIEtNnzvb6r0-ZpvjRInw"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <MapPin className="w-5 h-5 text-on-primary fill-on-primary" />
          </div>
        </div>
      </div>

      {/* Get Directions Button */}
      <button 
        onClick={handleGetDirections}
        className="w-full py-4 bg-primary text-on-primary font-bold rounded-full flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        <Navigation className="w-5 h-5 fill-on-primary" />
        Get Directions
      </button>
    </div>
  );
};

const FacilityItem: React.FC<{ icon: React.ReactNode, label: string, isLast?: boolean }> = ({ icon, label, isLast }) => (
  <div className={cn(
    "flex items-center gap-6 p-5 transition-colors hover:bg-surface-container-low",
    !isLast && "border-b border-outline-variant/5"
  )}>
    <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
      {icon}
    </div>
    <span className="font-headline font-bold text-on-surface text-base">{label}</span>
  </div>
);
