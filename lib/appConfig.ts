/**
 * Centralized Application Configuration
 *
 * For downstream organizations:
 * Customize these values by setting the corresponding environment variables in your `.env.local`
 * or modifying the defaults in this file.
 */

export const APP_CONFIG = {
  // Shelter / Association Details
  shelter: {
    name: process.env.NEXT_PUBLIC_SHELTER_NAME || 'Muster-Tierheim e.V.',
    code: process.env.NEXT_PUBLIC_SHELTER_CODE || 'DE123456789',
    address: process.env.NEXT_PUBLIC_SHELTER_ADDRESS || 'Musterstraße 1, 12345 Musterstadt, Deutschland',
    gpsLatitude: parseFloat(process.env.NEXT_PUBLIC_SHELTER_GPS_LATITUDE || '52.520008'),
    gpsLongitude: parseFloat(process.env.NEXT_PUBLIC_SHELTER_GPS_LONGITUDE || '13.404954'),
    phone: process.env.NEXT_PUBLIC_SHELTER_PHONE || '+49 123 4567890',
    emailDe: process.env.NEXT_PUBLIC_SHELTER_EMAIL_DE || 'kontakt@muster-tierheim.de',
    emailLt: process.env.NEXT_PUBLIC_SHELTER_EMAIL_LT || 'info@muster-tierheim.de',
    bankName: process.env.NEXT_PUBLIC_SHELTER_BANK_NAME || 'Musterbank',
    bic: process.env.NEXT_PUBLIC_SHELTER_BIC || 'MUSTDEFFXXX',
    iban: process.env.NEXT_PUBLIC_SHELTER_IBAN || 'DE89 3704 0044 0532 0130 00',
    donationPurposeDe: process.env.NEXT_PUBLIC_SHELTER_DONATION_PURPOSE_DE || 'Spende für Tiere',
    paypalEmail: process.env.NEXT_PUBLIC_SHELTER_PAYPAL_EMAIL || 'paypal@muster-tierheim.de',
    wishlistUrl: process.env.NEXT_PUBLIC_SHELTER_WISHLIST_URL || 'https://example.com/wishlist',
    websiteUrl: process.env.NEXT_PUBLIC_SHELTER_WEBSITE_URL || 'https://example.com',
    locationShort: process.env.NEXT_PUBLIC_SHELTER_LOCATION_SHORT || 'Musterstadt, Deutschland',
    representatives: [
      {
        name: process.env.NEXT_PUBLIC_REPRESENTATIVE1_NAME || 'Max Mustermann',
        roleDe: process.env.NEXT_PUBLIC_REPRESENTATIVE1_ROLE_DE || 'Gründer & Leiter des Tierheims',
        roleLt: process.env.NEXT_PUBLIC_REPRESENTATIVE1_ROLE_LT || 'Prieglaudos įkūrėjas ir vadovas',
      },
      {
        name: process.env.NEXT_PUBLIC_REPRESENTATIVE2_NAME || 'Erika Mustermann',
        roleDe: process.env.NEXT_PUBLIC_REPRESENTATIVE2_ROLE_DE || 'Internationale Vermittlung (Deutschland, Österreich, Schweiz)',
        roleLt: process.env.NEXT_PUBLIC_REPRESENTATIVE2_ROLE_LT || 'Tarptautinis bendradarbiavimas (Vokietija, Austrija, Šveicarija)',
      }
    ]
  },

  // General App Meta & Repo Links
  app: {
    title: process.env.NEXT_PUBLIC_APP_TITLE || 'AllPaws Tierheim App',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Mobile-First Tiererfassungs-App für Tierheime',
    githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/lusoluc/AllPaws-2026',
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL || 'https://allpaws-app.vercel.app',
    
    // Developer credits: Hardcoded as requested by Carlos Lucas
    developerName: 'Carlos Lucas - Germany',
    developerUrl: 'https://www.linkedin.com/in/director-it-development/',
    developerNoteDe: 'Diese App wurde ehrenamtlich und privat als Herzensprojekt entwickelt von Carlos Lucas und wird kostenlos zur Verfügung gestellt.',
    developerNoteLt: 'Ši programėlė buvo sukurta savanoriškai kaip širdies projektas Carlos Lucas ir yra teikiama nemokamai.',
  },

  // UI Theme Settings
  theme: {
    logoType: (process.env.NEXT_PUBLIC_THEME_LOGO_TYPE || 'icon') as 'icon' | 'image',
    logoImage: process.env.NEXT_PUBLIC_THEME_LOGO_IMAGE || '/logo.png', // path relative to public/
    logoText: process.env.NEXT_PUBLIC_THEME_LOGO_TEXT || 'AllPaws',
  }
};
