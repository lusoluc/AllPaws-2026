import Dexie, { type Table } from 'dexie';
import { APP_CONFIG } from './appConfig';

export interface Shelter {
  id?: number;
  name: string;
  code: string;
  address: string;
  gpsLatitude: number;
  gpsLongitude: number;
  phone: string;
  emailLt: string;
  emailDe: string;
  bankName: string;
  bic: string;
  iban: string;
  donationPurposeDe: string;
  paypalEmail: string;
  wishlistUrl: string;
  websiteUrl?: string;
  sync_pending?: number; // 0 = synced, 1 = pending upload
  updated_at?: string; // ISO timestamp
}

export interface Animal {
  id?: number;
  name: string;
  created_at: string;
  type: 'Katze' | 'Hund' | 'Andere';
  status_aktuell: 'zu vermitteln' | 'reserviert' | 'vermittelt';
  gender: 'Weiblich' | 'Männlich';
  age_years: number;
  shelter_admission_date: string; // "YYYY-MM" format
  reason_for_shelter: string;
  restrictions: string;
  notes_miscellaneous: string;
  is_published: boolean;
  is_emergency: boolean;
  
  // Age details
  age_mode?: 'range' | 'exact' | 'birthyear';
  age_min?: number;
  age_max?: number;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  
  // Medical status
  is_castrated: boolean;
  is_chipped: boolean;
  has_rabies_vaccine: boolean;
  has_cat_flu_vaccine: boolean;
  is_dewormed: boolean;
  has_eu_passport: boolean;
  
  // Compatibility & Temperament
  compat_cats: 'JA' | 'NEIN' | 'unbekannt';
  compat_dogs: 'JA' | 'NEIN' | 'unbekannt';
  compat_children: 'JA' | 'NEIN' | 'unbekannt';
  trait_curious: 'JA' | 'NEIN' | 'unbekannt';
  trait_playful: 'JA' | 'NEIN' | 'unbekannt';
  trait_aggressive: 'JA' | 'NEIN' | 'unbekannt';
  trait_fearful: 'JA' | 'NEIN' | 'unbekannt';
  trait_cuddly: 'JA' | 'NEIN' | 'unbekannt';

  slow_integration?: boolean;
  partner_needed?: boolean;
  no_single_animal?: boolean;
  needs_outdoor?: boolean;
  indoor_only?: boolean;
  secured_balcony?: boolean;
  for_beginners?: boolean;
  for_experienced?: boolean;
  quiet_home?: boolean;
  patient_people?: boolean;
  needs_attention?: boolean;
  no_small_children?: boolean;
  suitable_seniors?: boolean;
  suitable_families?: boolean;

  // Gesundheit (Health)
  not_castrated?: boolean;
  has_cat_plague_vaccine?: boolean;
  vaccination_status_unknown?: boolean;
  fiv_negative?: boolean;
  felv_negative?: boolean;
  fiv_positive?: boolean;
  felv_positive?: boolean;
  fip_positive?: boolean;
  flea_mite_treatment?: boolean;
  handicaps?: string;

  // Charakter / Verhalten (Character / Behavior)
  trait_trusting?: boolean;
  trait_people_oriented?: boolean;
  trait_quiet?: boolean;
  trait_active?: boolean;
  trait_needs_time?: boolean;
  trait_allows_touch?: boolean;
  trait_allows_lift?: boolean;
  trait_allows_brush?: boolean;
  trait_shows_limits?: boolean;
  trait_seeks_cats?: boolean;
  trait_insecure_cats?: boolean;
  trait_dominant?: boolean;
  trait_submissive?: boolean;
  trait_sensitive_noise?: boolean;
  trait_litter_box?: boolean;
  trait_compat_cats?: boolean;
  trait_compat_dogs?: boolean;
  trait_compat_children?: boolean;



  // Media
  media_urls: string[]; // Base64 data URLs for photos
  passport_urls: string[]; // Base64 data URLs for passport/impfung photos
  video_urls: string[]; // URLs or Base64 data URLs for videos

  // Local media files (stored in OPFS or legacy IndexedDB blobs before upload/sync)
  local_photos?: { name: string; blob?: Blob; opfsKey?: string }[];
  local_passports?: { name: string; blob?: Blob; opfsKey?: string }[];
  local_videos?: { name: string; blob?: Blob; opfsKey?: string }[];
  local_audio?: { name: string; blob?: Blob; opfsKey?: string };
  local_audios?: { name: string; blob?: Blob; opfsKey?: string }[];

  // Location hierarchy & Audio
  room_name?: string;
  cage_name?: string;
  audio_draft_url?: string;
  audio_urls?: string[];
  sync_pending?: number;
  media_pending?: number; // 0 = synced, 1 = media files queued locally
  updated_at?: string;
}

export interface InternalNote {
  id?: number;
  animal_id: number;
  note_text: string;
  staff_name: string;
  created_at: string;
  sync_pending?: number;
  updated_at?: string;
}

export interface Inquiry {
  id?: number;
  animal_id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  language: 'DE' | 'LT';
  status: 'neu' | 'gelesen' | 'kontaktiert' | 'archiviert';
  created_at: string;
  sync_pending?: number;
  updated_at?: string;
}

export interface SystemLog {
  id?: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  context: string;
  message: string;
  stack_trace?: string;
}

export interface UiText {
  key: string;
  DE: string;
  LT: string;
  sync_pending?: number;
  updated_at?: string;
}

export interface GuideItemDb {
  id: string;
  category: 'behavior' | 'bodyLanguage' | 'nutrition' | 'safety' | 'problems';
  iconName: string;
  question: {
    DE: string;
    LT: string;
  };
  answer: {
    DE: string;
    LT: string;
  };
}

export interface CustomBlock {
  id?: number;
  page: 'home' | 'about' | 'guide';
  type: 'title' | 'paragraph' | 'image';
  de: string;
  lt: string;
  sort_order: number;
  sync_pending?: number;
  updated_at?: string;
}

export interface AnimalRevision {
  id?: number;
  animal_id: number;
  version_data: string;
  edited_by: string;
  created_at: string;
  sync_pending?: number;
  updated_at?: string;
}

export interface Subscriber {
  id?: number;
  email: string;
  name: string;
  created_at: string;
  preferences: string[]; // e.g. ['adoptions', 'events', 'guides']
  ip_address?: string;
  sync_pending?: number;
  updated_at?: string;
}

export interface NewsletterCampaign {
  id?: number;
  subject: string;
  body: string;
  created_at: string;
  sent_count: number;
  total_recipients: number;
  status: 'draft' | 'sending' | 'completed';
}

export interface NewsletterQueueItem {
  id?: number;
  campaign_id: number;
  subscriber_email: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  scheduled_for: string; // ISO timestamp
  sent_at?: string; // ISO timestamp
}

class TierheimDatabase extends Dexie {
  shelters!: Table<Shelter, number>;
  animals!: Table<Animal, number>;
  internalNotes!: Table<InternalNote, number>;
  inquiries!: Table<Inquiry, number>;
  systemLogs!: Table<SystemLog, number>;
  uiTexts!: Table<UiText, string>;
  guideItems!: Table<GuideItemDb, string>;
  customBlocks!: Table<CustomBlock, number>;
  subscribers!: Table<Subscriber, number>;
  newsletterCampaigns!: Table<NewsletterCampaign, number>;
  newsletterQueue!: Table<NewsletterQueueItem, number>;
  animalRevisions!: Table<AnimalRevision, number>;

  constructor() {
    super('TierheimDatabase');
    this.version(1).stores({
      shelters: '++id, name, code',
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency',
      internalNotes: '++id, animal_id, created_at',
      inquiries: '++id, animal_id, status, created_at',
      systemLogs: '++id, timestamp, level, context',
    });
    this.version(2).stores({
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency, room_name, cage_name',
    });
    this.version(3).stores({
      shelters: '++id, name, code, sync_pending',
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency, room_name, cage_name, sync_pending',
      internalNotes: '++id, animal_id, created_at, sync_pending',
      inquiries: '++id, animal_id, status, created_at, sync_pending',
    });
    this.version(4).stores({
      shelters: '++id, name, code, sync_pending',
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency, room_name, cage_name, sync_pending',
      internalNotes: '++id, animal_id, created_at, sync_pending',
      inquiries: '++id, animal_id, status, created_at, sync_pending',
      uiTexts: 'key',
      guideItems: 'id, category',
    });
    this.version(5).stores({
      shelters: '++id, name, code, sync_pending',
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency, room_name, cage_name, sync_pending',
      internalNotes: '++id, animal_id, created_at, sync_pending',
      inquiries: '++id, animal_id, status, created_at, sync_pending',
      uiTexts: 'key',
      guideItems: 'id, category',
      customBlocks: '++id, page, type, sort_order',
    });
    this.version(6).stores({
      shelters: '++id, name, code, sync_pending',
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency, room_name, cage_name, sync_pending',
      internalNotes: '++id, animal_id, created_at, sync_pending',
      inquiries: '++id, animal_id, status, created_at, sync_pending',
      uiTexts: 'key',
      guideItems: 'id, category',
      customBlocks: '++id, page, type, sort_order',
      subscribers: '++id, &email, name, created_at',
      newsletterCampaigns: '++id, status, created_at',
      newsletterQueue: '++id, campaign_id, subscriber_email, status, scheduled_for',
    });
    this.version(7).stores({
      shelters: '++id, name, code, sync_pending',
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency, room_name, cage_name, sync_pending',
      internalNotes: '++id, animal_id, created_at, sync_pending',
      inquiries: '++id, animal_id, status, created_at, sync_pending',
      uiTexts: 'key',
      guideItems: 'id, category',
      customBlocks: '++id, page, type, sort_order',
      subscribers: '++id, &email, name, created_at, ip_address',
      newsletterCampaigns: '++id, status, created_at',
      newsletterQueue: '++id, campaign_id, subscriber_email, status, scheduled_for',
    });
    this.version(8).stores({
      shelters: '++id, name, code, sync_pending, updated_at',
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency, room_name, cage_name, sync_pending, updated_at',
      internalNotes: '++id, animal_id, created_at, sync_pending, updated_at',
      inquiries: '++id, animal_id, status, created_at, sync_pending, updated_at',
      uiTexts: 'key, sync_pending, updated_at',
      guideItems: 'id, category',
      customBlocks: '++id, page, type, sort_order, sync_pending, updated_at',
      subscribers: '++id, &email, name, created_at, ip_address, sync_pending, updated_at',
      newsletterCampaigns: '++id, status, created_at',
      newsletterQueue: '++id, campaign_id, subscriber_email, status, scheduled_for',
    });
    this.version(9).stores({
      shelters: '++id, name, code, sync_pending, updated_at',
      animals: '++id, name, type, status_aktuell, gender, is_published, is_emergency, room_name, cage_name, sync_pending, updated_at',
      internalNotes: '++id, animal_id, created_at, sync_pending, updated_at',
      inquiries: '++id, animal_id, status, created_at, sync_pending, updated_at',
      uiTexts: 'key, sync_pending, updated_at',
      guideItems: 'id, category',
      customBlocks: '++id, page, type, sort_order, sync_pending, updated_at',
      subscribers: '++id, &email, name, created_at, ip_address, sync_pending, updated_at',
      newsletterCampaigns: '++id, status, created_at',
      newsletterQueue: '++id, campaign_id, subscriber_email, status, scheduled_for',
      animalRevisions: '++id, animal_id, created_at, sync_pending, updated_at',
    });
  }
}

export const db = new TierheimDatabase();

// Seeding function for default organisation details
export async function seedDatabase() {
  const shelterCount = await db.shelters.count();
  if (shelterCount === 0) {
    await db.shelters.add({
      name: APP_CONFIG.shelter.name,
      code: APP_CONFIG.shelter.code,
      address: APP_CONFIG.shelter.address,
      gpsLatitude: APP_CONFIG.shelter.gpsLatitude,
      gpsLongitude: APP_CONFIG.shelter.gpsLongitude,
      phone: APP_CONFIG.shelter.phone,
      emailLt: APP_CONFIG.shelter.emailLt,
      emailDe: APP_CONFIG.shelter.emailDe,
      bankName: APP_CONFIG.shelter.bankName,
      bic: APP_CONFIG.shelter.bic,
      iban: APP_CONFIG.shelter.iban,
      donationPurposeDe: APP_CONFIG.shelter.donationPurposeDe,
      paypalEmail: APP_CONFIG.shelter.paypalEmail,
      wishlistUrl: APP_CONFIG.shelter.wishlistUrl,
      websiteUrl: APP_CONFIG.shelter.websiteUrl,
      sync_pending: 0,
      updated_at: new Date().toISOString()
    });
    console.log('Seeded database with default shelter info.');
  }

  // Optional: Seed default animals if table is empty
  const animalCount = await db.animals.count();
  if (animalCount === 0) {
    await db.animals.add({
      name: 'Bella',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: 'Katze',
      status_aktuell: 'zu vermitteln',
      gender: 'Weiblich',
      age_years: 2,
      shelter_admission_date: '2025-04',
      reason_for_shelter: 'Auf der Straße gefunden in Klaipėda.',
      restrictions: 'Keine bekannten Einschränkungen.',
      notes_miscellaneous: 'Sehr freundlich und zutraulich.',
      is_published: true,
      is_emergency: false,
      is_castrated: true,
      is_chipped: true,
      has_rabies_vaccine: true,
      has_cat_flu_vaccine: true,
      is_dewormed: true,
      has_eu_passport: false,
      compat_cats: 'JA',
      compat_dogs: 'unbekannt',
      compat_children: 'JA',
      trait_curious: 'JA',
      trait_playful: 'JA',
      trait_aggressive: 'NEIN',
      trait_fearful: 'NEIN',
      trait_cuddly: 'JA',
      media_urls: [],
      passport_urls: [],
      video_urls: [],
      sync_pending: 0
    });
    await db.animals.add({
      name: 'Rex',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: 'Hund',
      status_aktuell: 'zu vermitteln',
      gender: 'Männlich',
      age_years: 3,
      shelter_admission_date: '2025-02',
      reason_for_shelter: 'Gefunden im Wald bei Klaipėda.',
      restrictions: 'Braucht viel Auslauf.',
      notes_miscellaneous: 'Sehr verspielt, versteht Grundkommandos.',
      is_published: true,
      is_emergency: false,
      is_castrated: true,
      is_chipped: true,
      has_rabies_vaccine: true,
      has_cat_flu_vaccine: false,
      is_dewormed: true,
      has_eu_passport: true,
      compat_cats: 'NEIN',
      compat_dogs: 'JA',
      compat_children: 'JA',
      trait_curious: 'JA',
      trait_playful: 'JA',
      trait_aggressive: 'NEIN',
      trait_fearful: 'NEIN',
      trait_cuddly: 'JA',
      media_urls: [],
      passport_urls: [],
      video_urls: [],
      sync_pending: 0
    });
    await db.animals.add({
      name: 'Barny',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: 'Andere',
      status_aktuell: 'zu vermitteln',
      gender: 'Männlich',
      age_years: 1,
      shelter_admission_date: '2025-05',
      reason_for_shelter: 'Abgegeben wegen Umzugs des Vorbesitzers.',
      restrictions: 'Braucht Frischfutter und genügend Platz zum Hoppeln.',
      notes_miscellaneous: 'Ein neugieriges Zwergkaninchen, das gerne Karotten knabbert.',
      is_published: true,
      is_emergency: true,
      is_castrated: false,
      is_chipped: false,
      has_rabies_vaccine: false,
      has_cat_flu_vaccine: false,
      is_dewormed: true,
      has_eu_passport: false,
      compat_cats: 'unbekannt',
      compat_dogs: 'unbekannt',
      compat_children: 'JA',
      trait_curious: 'JA',
      trait_playful: 'JA',
      trait_aggressive: 'NEIN',
      trait_fearful: 'NEIN',
      trait_cuddly: 'NEIN',
      media_urls: [],
      passport_urls: [],
      video_urls: [],
      sync_pending: 0
    });
    console.log('Seeded database with diverse sample animals.');
  }

  // Seed default UI texts if empty
  const uiTextsCount = await db.uiTexts.count();
  if (uiTextsCount === 0) {
    const defaultUiTexts = [
      {
        key: 'home.heroTag',
        DE: '🐾 Ein privates Herzensprojekt von Tierfreunden',
        LT: '🐾 Asmeninis gyvūnų mylėtojų širdies projektas'
      },
      {
        key: 'home.title',
        DE: 'Weil jede Pfote ein weiches Körbchen verdient',
        LT: 'Nes kiekviena pėdutė nusipelno mylinčių namų'
      },
      {
        key: 'home.subtitle',
        DE: 'Hinter dieser App steckt kein großes Unternehmen. Wir sind ein kleines Team aus ehrenamtlichen Helfern und Katzenliebhabern, die jede freie Minute und eigenes Geld spenden. Wir wollen der Tierrettung in Litauen helfen, Zeit zu sparen – Zeit, die zu 100 % den Tieren zugutekommt. Finde heute deinen neuen treuen Begleiter oder unterstütze unsere Rettungsarbeit!',
        LT: 'Šią programėlę sukūrė ne įmonė, o nedidelė savanorių ir kačių mylėtojų komanda, aukojanti savo laisvą laiką ir asmenines lėšas. Mūsų tikslas – palengvinti prieglaudos darbą Lietuvoje, kad daugiau laiko liktų kačių priežiūrai ir gelbėjimui. Raskite savo naują šeimos narį arba prisidėkite prie mūsų veiklos!'
      },
      {
        key: 'home.storyTitle',
        DE: 'Aus dem Tagebuch unserer Helfer: Mimis große Reise 🐾',
        LT: 'Iš mūsų savanorių dienoraščio: Didžioji Mimi kelionė 🐾'
      },
      {
        key: 'home.storyText',
        DE: 'Mimi wurde klitschnass und zitternd vor Kälte in einem Graben bei Klaipėda gefunden. Sie wog kaum ein Kilo und hatte die Hoffnung schon aufgegeben. In unserem beheizten Rettungs-Container fand sie Schutz, Futter und die nötige Liebe, um wieder zu vertrauen. Heute ist Mimi gesund, verspielt und sucht Menschen, die ihr ein echtes Zuhause schenken wollen. Es sind Geschichten wie diese, für die wir alles geben.',
        LT: 'Mimi buvo rasta visiškai šlapia ir drebanti nuo šalčio griovyje netoli Klaipėdos. Ji svėrė vos kilogramą ir jau buvo praradusi viltį. Mūsų šildomame konteineryje ji rado prieglobstį, maistą ir meilę, kad vėl pradėtų pasitikėti. Šiandien Mimi yra sveika, žaisminga ir ieško žmonių, kurie suteiktų jai tikrus namus. Būtent dėl tokių istorijų mes aukojame kiekvieną savo laisvą minutę.'
      },
      {
        key: 'home.realityNote',
        DE: 'Aufgrund extremer räumlicher Notlagen müssen viele unserer 600 geretteten Katzen vorübergehend in Käfigen leben. Unterstütze uns durch eine Adoption oder Spende, um ihnen den Weg in eine bessere Zukunft zu ermöglichen.',
        LT: 'Dėl didelio vietos trūkumo daugelis iš 600 išgelbėtų kačių laikinai gyvena narvuose. Paremkite mus arba priglauskite katę, kad suteiktumėte joms geresnį rytojų.'
      },
      {
        key: 'ueberuns.title',
        DE: 'Über Uns & Das Team',
        LT: 'Apie mus ir komandą'
      },
      {
        key: 'ueberuns.subtitle',
        DE: 'Wie aus Liebe zu hilflosen Seelen eine Lebensaufgabe wurde – und warum wir jede helfende Hand brauchen.',
        LT: 'Kaip meilė bejėgiams gyvūnams tapo gyvenimo tikslu ir kodėl mums reikia kiekvienos pagalbos rankos.'
      },
      {
        key: 'ueberuns.historyTitle',
        DE: 'Unsere Geschichte: Ein Weg aus Liebe und Schweiß',
        LT: 'Mūsų istorija: kelias, grįstas meile ir rūpesčiu'
      },
      {
        key: 'ueberuns.historyText1',
        DE: 'Hinter unserem Tierheim steht kein reicher Großsponsor und kein staatliches Budget. Alles begann im Jahr 2011, als Galina Kučinskienė die Not der Straßenkatzen in Klaipėda nicht mehr mitansehen konnte und die ersten verletzten Seelen bei sich aufnahm. Was als private Rettungsaktion im kleinen Kreis begann, ist über 13 Jahre hinweg zu einer permanenten Zuflucht für über 600 Hunde, Katzen und Wildtiere angewachsen. Wir gehen täglich an unsere körperlichen und finanziellen Grenzen, um diesen wunderbaren Geschöpfen Schutz zu bieten.',
        LT: 'Už mūsų prieglaudos stovi ne turtingi rėmėjai ar valstybės biudžetas. Viskas prasidėjo 2011 metais, kai Galina Kučinskienė nebegalėjo žiūrėti į Klaipėdos gatvės kačių kančias ir priglaudė pirmuosiuos sužeistus gyvūnus savo namuose. Tai, kas prasidėjo kaip nedidelė gelbėjimo akcija, per 13 metų išaugo į nuolatinį prieglobstį daugiau nei 600 šunų, kačių ir laukinių gyvūnų. Kiekvieną dieną mes atiduodame paskutines savo jėgas ir asmenines lėšas, kad apsaugotume šias nuostabias sielas.'
      },
      {
        key: 'ueberuns.historyText2',
        DE: 'Unser oberstes Ziel ist einfach, aber lebenswichtig: Jedes gerettete Tier soll spüren, dass es geliebt wird, während wir medizinische Notversorgung leisten und nach einem endgültigen Zuhause suchen. Um den Katzen in Deutschland eine Stimme zu geben, arbeitet Žana Baskytė unermüdlich ehrenamtlich als Brücke ins neue Leben, vermittelt Adoptionen und organisiert lebensrettende Fahrten.',
        LT: 'Mūsų pagrindinis tikslas paprastas, bet gyvybiškai svarbus: kiekviena išgelbėta siela turi pajusti, kad yra mylima, kol mes suteikiame skubią pagalbą ir ieškome jai tikrųjų namų. Kad suteiktų katėms balsą užsienyje, Žana Baskytė nenuilstamai savanoriauja kaip tiltas į naują gyvenimą, padėdama rasti namus Vokietijoje ir organizuodama keliones.'
      },
      {
        key: 'ueberuns.containerTitle',
        DE: 'Das Container-Projekt 🐈',
        LT: 'Konteinerių projektas 🐈'
      },
      {
        key: 'ueberuns.containerSubtitle',
        DE: 'Gebaut mit unseren eigenen Händen',
        LT: 'Pastatyta mūsų pačių rankomis'
      },
      {
        key: 'ueberuns.containerText',
        DE: 'Als der Platz im Tierheim nicht mehr reichte und wir Tiere hätten abweisen müssen, haben wir beschlossen zu kämpfen. Die Idee: Ausgediente Überseecontainer zu Katzenparadiesen umzubauen. Mit privatem Schweiß, Spenden und der Hilfe von freiwilligen Handwerkern haben wir Container isoliert, klimatisiert und mit Kletterwänden, Kuschelecken und Spielzonen ausgestattet. Heute finden hier über 360 Katzen Schutz vor Frost und Hunger in gemütlichen Gruppen.',
        LT: 'Kai prieglaudoje pritrūko vietos ir būtume turėję atsisakyti priimti gyvūnus, nusprendėme kovoti. Kilusi idėja: paversti senus jūrinius konteinerius kačių rojumi. Savo rankomis, savanorių pagalba ir asmeninėmis lėšomis apšiltinome konteinerius, įrengėme oro kondicionavimą, laipiojimo sieneles ir jaukius guolius. Šiandien čia saugų prieglobstį randa per 360 kačių.'
      },
      {
        key: 'ueberuns.donationTitle',
        DE: 'Unterstütze unsere Herzensarbeit',
        LT: 'Paremk Gasda parama'
      },
      {
        key: 'ueberuns.donationText',
        DE: 'Jeder Cent, jede Stunde und jede Zeile Code wird privat beigetragen. Wir erhalten keine staatliche Förderung. Deine Spende fließt zu 100 % direkt in Futter, dringend benötigte Medikamente und den Ausbau der warmen Container.',
        LT: 'Kiekvienas centas, kiekviena valanda ir kiekviena kodo eilutė yra aukojami privačiai. Mes negauname valstybės paramos. Jūsų parama 100 % skiriama maistui, vaistams ir šiltų konteinerių erdvių išlaikymui.'
      },
      {
        key: 'ratgeber.title',
        DE: 'Katzen-Ratgeber & FAQ 📖',
        LT: 'Kačių gidas und DUK 📖'
      },
      {
        key: 'ratgeber.subtitle',
        DE: 'Alles, was neue Katzenbesitzer und Stadtmenschen über Haltung, Verhalten und Pflege wissen sollten.',
        LT: 'Viskas, ką nauji kačių šeimininkai ir miesto žmonės turėtų žinoti apie kačių elgseną, priežiūrą bei saugumą.'
      },
      {
        key: 'ratgeber.warningTitle',
        DE: 'Wichtiger Hinweis für Stadtwohnungen',
        LT: 'Svarbi pastaba gyvenantiems butuose'
      },
      {
        key: 'ratgeber.warningDesc',
        DE: 'Katzen benötigen in Wohnungen ausreichend Beschäftigung, Kratzmöglichkeiten und vor allem gesicherte Fenster (Kippschutz!), um ein glückliches und sicheres Leben zu führen.',
        LT: 'Katėms butuose reikia pakankamai veiklos, vietų draskymui ir ypač apsaugotų langų (apsaugos nuo atvertimo!), kad jos gyventų laimingą ir saugų gyvenimą.'
      }
    ];

    for (const item of defaultUiTexts) {
      await db.uiTexts.add(item);
    }
    console.log('Seeded database with default UI texts.');
  }

  // Seed guideItems if empty
  const guideCount = await db.guideItems.count();
  if (guideCount === 0) {
    const { guideItems } = await import('./ratgeberData');
    for (const item of guideItems) {
      const iconName = item.category === 'behavior' ? 'Smile'
        : item.category === 'bodyLanguage' ? 'Activity'
        : item.category === 'nutrition' ? 'Utensils'
        : item.category === 'safety' ? 'Home'
        : item.category === 'problems' ? 'AlertTriangle'
        : 'BookOpen';

      await db.guideItems.add({
        id: item.id,
        category: item.category,
        iconName,
        question: {
          DE: item.question.DE,
          LT: item.question.LT
        },
        answer: {
          DE: item.answer.DE,
          LT: item.answer.LT
        }
      });
    }
    console.log('Seeded database with default guide items.');
  }

  // Seed mock newsletter subscribers for testing staggered sending
  const subscriberCount = await db.subscribers.count();
  if (subscriberCount === 0) {
    const mockSubscribers: Omit<Subscriber, 'id'>[] = [
      { email: 'anna.mueller@gmail.com', name: 'Anna Müller', created_at: new Date().toISOString(), preferences: ['adoptions', 'events'], ip_address: '91.65.12.89' },
      { email: 'jonas.schmidt@web.de', name: 'Jonas Schmidt', created_at: new Date().toISOString(), preferences: ['adoptions'], ip_address: '109.250.32.12' },
      { email: 'lina.weber@gmx.de', name: 'Lina Weber', created_at: new Date().toISOString(), preferences: ['adoptions', 'guides'], ip_address: '84.112.45.67' },
      { email: 'max.becker@outlook.de', name: 'Max Becker', created_at: new Date().toISOString(), preferences: ['events'], ip_address: '217.86.101.4' },
      { email: 'sophie.klein@yahoo.de', name: 'Sophie Klein', created_at: new Date().toISOString(), preferences: ['adoptions', 'events', 'guides'], ip_address: '87.123.190.22' },
      { email: 'felix.braun@mail.de', name: 'Felix Braun', created_at: new Date().toISOString(), preferences: ['guides'], ip_address: '95.90.210.15' },
      { email: 'emma.hoffmann@posteo.de', name: 'Emma Hoffmann', created_at: new Date().toISOString(), preferences: ['adoptions', 'events'], ip_address: '79.220.15.93' },
      { email: 'paul.fischer@t-online.de', name: 'Paul Fischer', created_at: new Date().toISOString(), preferences: ['adoptions'], ip_address: '46.112.78.102' },
      { email: 'mia.wolf@icloud.com', name: 'Mia Wolf', created_at: new Date().toISOString(), preferences: ['events', 'guides'], ip_address: '93.203.44.8' },
      { email: 'lukas.schaefer@proton.me', name: 'Lukas Schäfer', created_at: new Date().toISOString(), preferences: ['adoptions'], ip_address: '185.191.171.4' },
      { email: 'elena.novak@gmail.com', name: 'Elena Novak', created_at: new Date().toISOString(), preferences: ['adoptions', 'events'], ip_address: '78.56.24.12' },
      { email: 'tomas.kazlauskas@inbox.lt', name: 'Tomas Kazlauskas', created_at: new Date().toISOString(), preferences: ['adoptions', 'events', 'guides'], ip_address: '82.135.19.45' },
      { email: 'ruta.jankauskaite@gmail.com', name: 'Rūta Jankauskaitė', created_at: new Date().toISOString(), preferences: ['adoptions'], ip_address: '78.57.112.5' },
      { email: 'mantas.petraitis@yahoo.lt', name: 'Mantas Petraitis', created_at: new Date().toISOString(), preferences: ['events'], ip_address: '86.100.99.3' },
      { email: 'laura.bauer@web.de', name: 'Laura Bauer', created_at: new Date().toISOString(), preferences: ['adoptions', 'guides'], ip_address: '88.73.12.190' },
      { email: 'niklas.hartmann@gmx.de', name: 'Niklas Hartmann', created_at: new Date().toISOString(), preferences: ['guides'], ip_address: '92.211.56.88' },
      { email: 'julia.krause@outlook.com', name: 'Julia Krause', created_at: new Date().toISOString(), preferences: ['adoptions', 'events'], ip_address: '2.203.111.45' },
      { email: 'david.richter@mail.de', name: 'David Richter', created_at: new Date().toISOString(), preferences: ['adoptions'], ip_address: '178.201.99.4' },
      { email: 'lisa.frank@posteo.de', name: 'Lisa Frank', created_at: new Date().toISOString(), preferences: ['events', 'guides'], ip_address: '80.187.100.5' },
      { email: 'moritz.wagner@gmail.com', name: 'Moritz Wagner', created_at: new Date().toISOString(), preferences: ['adoptions'], ip_address: '109.250.8.22' },
      { email: 'amelie.jung@t-online.de', name: 'Amelie Jung', created_at: new Date().toISOString(), preferences: ['adoptions', 'events'], ip_address: '217.230.12.80' },
      { email: 'leon.schulze@icloud.com', name: 'Leon Schulze', created_at: new Date().toISOString(), preferences: ['guides'], ip_address: '94.134.56.12' },
      { email: 'hanna.koenig@proton.me', name: 'Hanna König', created_at: new Date().toISOString(), preferences: ['adoptions', 'events', 'guides'], ip_address: '185.191.171.6' },
      { email: 'tim.meyer@yahoo.de', name: 'Tim Meyer', created_at: new Date().toISOString(), preferences: ['events'], ip_address: '109.40.23.45' },
      { email: 'sarah.huber@gmail.com', name: 'Sarah Huber', created_at: new Date().toISOString(), preferences: ['adoptions', 'guides'], ip_address: '84.15.192.1' },
    ];
    for (const sub of mockSubscribers) {
      await db.subscribers.add(sub);
    }
    console.log('Seeded database with 25 mock newsletter subscribers.');
  }
}

export function formatAge(cat: any, lang: 'DE' | 'LT') {
  if (!cat) return '';
  const mode = cat.age_mode || 'exact';
  if (mode === 'range' && cat.age_min !== undefined && cat.age_max !== undefined) {
    if (lang === 'DE') {
      return `ca. ${cat.age_min}-${cat.age_max} Jahre`;
    } else {
      return `apie ${cat.age_min}-${cat.age_max} m.`;
    }
  }
  if (mode === 'birthyear' && cat.birth_year) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    let ageYears = currentYear - cat.birth_year;
    if (cat.birth_month) {
      if (currentMonth < cat.birth_month || (currentMonth === cat.birth_month && cat.birth_day && currentDay < cat.birth_day)) {
        ageYears--;
      }
    }
    ageYears = Math.max(0, ageYears);

    let dateStr = '';
    if (cat.birth_month) {
      const mStr = String(cat.birth_month).padStart(2, '0');
      if (cat.birth_day) {
        const dStr = String(cat.birth_day).padStart(2, '0');
        dateStr = lang === 'DE' ? `${dStr}.${mStr}.${cat.birth_year}` : `${cat.birth_year}-${mStr}-${dStr}`;
      } else {
        dateStr = lang === 'DE' ? `${mStr}.${cat.birth_year}` : `${cat.birth_year}-${mStr}`;
      }
    } else {
      dateStr = `${cat.birth_year}`;
    }

    let ageStr = '';
    if (ageYears >= 1) {
      if (lang === 'DE') {
        ageStr = `ca. ${ageYears} ${ageYears === 1 ? 'Jahr' : 'Jahre'}`;
      } else {
        const roundedYears = Math.round(ageYears);
        const lastDigit = roundedYears % 10;
        const lastTwo = roundedYears % 100;
        let suffix = 'metų';
        if (lastDigit === 1 && lastTwo !== 11) {
          suffix = 'metai';
        } else if (lastDigit > 1 && (lastTwo < 11 || lastTwo > 19)) {
          suffix = 'metai';
        }
        ageStr = `apie ${ageYears} ${suffix}`;
      }
    } else {
      // Calculate months
      const birthMonth = cat.birth_month || 1;
      let ageMonths = (currentYear - cat.birth_year) * 12 + currentMonth - birthMonth;
      if (cat.birth_day && currentDay < cat.birth_day) {
        ageMonths--;
      }
      ageMonths = Math.max(1, ageMonths);
      if (lang === 'DE') {
        ageStr = `ca. ${ageMonths} ${ageMonths === 1 ? 'Monat' : 'Monate'}`;
      } else {
        const lastDigit = ageMonths % 10;
        const lastTwo = ageMonths % 100;
        let suffix = 'mėnesių';
        if (lastDigit === 1 && lastTwo !== 11) {
          suffix = 'mėnuo';
        } else if (lastDigit >= 2 && lastDigit <= 9 && (lastTwo < 11 || lastTwo > 19)) {
          suffix = 'mėnesiai';
        }
        ageStr = `apie ${ageMonths} ${suffix}`;
      }
    }

    if (lang === 'DE') {
      return `Geb. ${dateStr} (${ageStr})`;
    } else {
      return `Gim. ${dateStr} (${ageStr})`;
    }
  }
  const years = cat.age_years ?? 0;
  if (lang === 'DE') {
    return `${years} ${years === 1 ? 'Jahr' : 'Jahre'}`;
  } else {
    const roundedYears = Math.round(years);
    const lastDigit = roundedYears % 10;
    const lastTwo = roundedYears % 100;
    let suffix = 'metų';
    if (lastDigit === 1 && lastTwo !== 11) {
      suffix = 'metai';
    } else if (lastDigit > 1 && (lastTwo < 11 || lastTwo > 19)) {
      suffix = 'metai';
    }
    return `${years} ${suffix}`;
  }
}

