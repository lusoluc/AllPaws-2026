'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe, Eye, BookOpen, HeartHandshake, User } from 'lucide-react';
import CatHeartLogo from '@/components/CatHeartLogo';

interface PublicHeaderProps {
  lang: 'DE' | 'LT';
  setLang: (lang: 'DE' | 'LT') => void;
}

export default function PublicHeader({ lang, setLang }: PublicHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navItems = [
    {
      path: '/katzen',
      labelDe: 'Unsere Schützlinge 🐾',
      labelLt: 'Mūsų globotiniai 🐾',
      icon: Eye
    },
    {
      path: '/katzen-ratgeber',
      labelDe: 'Katzen-Ratgeber',
      labelLt: 'Kačių gidas',
      icon: BookOpen
    },
    {
      path: '/ueber-uns',
      labelDe: 'Über uns & Spenden',
      labelLt: 'Apie mus & Parama',
      icon: HeartHandshake
    }
  ];

  const desktopLinkClass = (path: string) => `
    relative py-2 px-1 text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer
    ${isActive(path) 
      ? 'text-brandpink-600' 
      : 'text-stone-500 hover:text-stone-900'
    }
  `;

  return (
    <header className="px-6 py-4 border-b border-stone-250 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto flex justify-between items-center relative">
        
        {/* Brand Logo (Left) */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-full bg-brandpink-500 flex items-center justify-center shadow-md shadow-brandpink-500/20 group-hover:scale-105 transition-transform">
            <CatHeartLogo className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-wide bg-gradient-to-r from-brandpink-600 to-emerald-600 bg-clip-text text-transparent block">
              Būk mano draugas
            </span>
            <span className="text-[8px] text-stone-400 font-medium block uppercase tracking-wider -mt-0.5">
              {lang === 'DE' ? 'Tierrettung Litauen' : 'Gyvūnų prieglauda'}
            </span>
          </div>
        </Link>

        {/* Primary Desktop Nav Links (Center) */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className={desktopLinkClass(item.path)}>
              {lang === 'DE' ? item.labelDe : item.labelLt}
              {isActive(item.path) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brandpink-500 rounded-full animate-in fade-in zoom-in-50 duration-200" />
              )}
            </Link>
          ))}
        </nav>

        {/* Action Controls (Right Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Language selection */}
          <button 
            type="button"
            onClick={() => setLang(lang === 'DE' ? 'LT' : 'DE')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 hover:text-stone-950 transition-all border border-stone-200 shadow-sm cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-brandpink-600 animate-pulse" />
            <span>{lang}</span>
          </button>

          {/* Member Login Button */}
          <Link 
            href="/login" 
            className="text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100/90 transition-all py-1.5 px-3.5 bg-stone-50/50 rounded-xl border border-stone-200 shadow-sm"
          >
            {lang === 'DE' ? 'Helfer-Portal' : 'Savanorių portalas'}
          </Link>
        </div>

        {/* Mobile Burger Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
        </button>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-3 md:hidden z-50">
            <div className="bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl shadow-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-250">
              
              {/* Menu items */}
              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3.5 p-3 rounded-xl transition-all ${
                        active 
                          ? 'bg-brandpink-50 text-brandpink-700 font-bold' 
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${active ? 'text-brandpink-600' : 'text-stone-400'}`} />
                      <span className="text-xs tracking-wide">
                        {lang === 'DE' ? item.labelDe : item.labelLt}
                      </span>
                    </Link>
                  );
                })}

                {/* Login link in mobile menu */}
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3.5 p-3 rounded-xl transition-all ${
                    isActive('/login')
                      ? 'bg-stone-100 text-stone-900 font-bold'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <User className="w-4.5 h-4.5 text-stone-400" />
                  <span className="text-xs tracking-wide">
                    {lang === 'DE' ? 'Helfer-Portal' : 'Savanorių portalas'}
                  </span>
                </Link>
              </div>

              {/* Separator */}
              <div className="border-t border-stone-100 pt-3 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                  {lang === 'DE' ? 'Sprachauswahl' : 'Pasirinkti kalbą'}
                </span>
                
                {/* Language selection switches */}
                <div className="flex space-x-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setLang('DE');
                    }}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${lang === 'DE' ? 'bg-brandpink-500 text-white shadow-sm' : 'text-stone-500'}`}
                  >
                    DE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLang('LT');
                    }}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${lang === 'LT' ? 'bg-brandpink-500 text-white shadow-sm' : 'text-stone-500'}`}
                  >
                    LT
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </header>
  );
}
