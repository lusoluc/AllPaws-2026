import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatDetailPage from '@/app/katzen/[id]/page';

// Variables prefixed with "mock" are hoisted by Jest and can be safely referenced in jest.mock
const mockFelixCat = {
  id: 42,
  name: 'Felix',
  type: 'Katze' as const,
  status_aktuell: 'zu vermitteln' as const,
  gender: 'Männlich' as const,
  age_years: 2,
  age_mode: 'exact' as const,
  room_name: 'Zimmer C',
  cage_name: 'Box 15',
  reason_for_shelter: 'Gefunden auf Feld',
  restrictions: 'Keine',
  notes_miscellaneous: 'Sehr lieb',
  is_published: true,
  is_emergency: false,
  is_castrated: true,
  is_chipped: true,
  has_rabies_vaccine: true,
  has_cat_flu_vaccine: true,
  is_dewormed: true,
  has_eu_passport: true,
  compat_cats: 'JA' as const,
  compat_dogs: 'unbekannt' as const,
  compat_children: 'JA' as const,
  trait_curious: 'JA' as const,
  trait_playful: 'JA' as const,
  trait_aggressive: 'NEIN' as const,
  trait_fearful: 'NEIN' as const,
  trait_cuddly: 'JA' as const,
  media_urls: ['/cats/felix.jpg'],
  passport_urls: [],
  video_urls: [],
  audio_draft_url: undefined,
  audio_urls: [],
};

const mockBmdShelter = {
  id: 1,
  name: 'Būk mano draugas',
  bic: 'BMDLT22',
  iban: 'LT12345',
};

// Mock Resolved parameters Promise utility
const createResolvedPromise = (value: any) => {
  const p = Promise.resolve(value);
  (p as any).status = 'fulfilled';
  (p as any).value = value;
  return p;
};

// Mock dexie-react-hooks useLiveQuery to support asynchronous queries
jest.mock('dexie-react-hooks', () => {
  const React = require('react');
  return {
    useLiveQuery: (fn: any, deps: any[] = []) => {
      const [val, setVal] = React.useState(undefined);
      React.useEffect(() => {
        let active = true;
        const res = fn();
        if (res instanceof Promise) {
          res.then((v: any) => {
            if (active) setVal(v);
          });
        } else {
          setVal(res);
        }
        return () => {
          active = false;
        };
      }, deps);
      return val;
    },
  };
});

// Mock Dexie DB
jest.mock('@/lib/db', () => ({
  db: {
    animals: {
      get: jest.fn().mockImplementation(() => Promise.resolve(mockFelixCat)),
    },
    shelters: {
      toArray: jest.fn().mockImplementation(() => Promise.resolve([mockBmdShelter])),
      limit: jest.fn().mockReturnValue({
        first: jest.fn().mockImplementation(() => Promise.resolve(mockBmdShelter))
      })
    },
  },
  formatAge: () => '2 Jahre',
}));

// Mock Canvas API context and functions for SharePanel previews
const mockContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  clip: jest.fn(),
  drawImage: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 100 }),
  roundRect: jest.fn(),
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);
  HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,mockImageContent');
  HTMLCanvasElement.prototype.toBlob = jest.fn().mockImplementation((cb) => {
    cb(new Blob(['mock-data'], { type: 'image/png' }));
  });

  // Mock Image loading
  Object.defineProperty(global.Image.prototype, 'onload', {
    get() {
      return this._onload;
    },
    set(fn) {
      this._onload = fn;
      setTimeout(() => fn && fn(), 10);
    },
    configurable: true
  });
});

describe('CatDetailPage Share Panel Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cat detail page and opens the SharePanel overlay when clicking the sharing card CTA', async () => {
    const paramsPromise = createResolvedPromise({ id: '42' });
    render(<CatDetailPage params={paramsPromise} />);

    // Wait for the cat's details to render
    await waitFor(() => {
      expect(screen.getByText('Felix')).toBeInTheDocument();
    });

    // Locate the Share CTA button card (there are multiple: one card, one footer)
    const shareCtaButton = screen.getAllByRole('button', { name: /Grafik erstellen & Profil teilen/i })[0];
    expect(shareCtaButton).toBeInTheDocument();

    // Verify SharePanel overlay is not open yet
    expect(screen.queryByText(/Social-Media Export: Felix/i)).not.toBeInTheDocument();

    // Trigger open
    fireEvent.click(shareCtaButton);

    // Verify SharePanel opens and shows target headers
    await waitFor(() => {
      expect(screen.getByText(/Social-Media Export: Felix/i)).toBeInTheDocument();
    });

    // Verify close works
    const headerTitle = screen.getByText(/Social-Media Export: Felix/i);
    const headerContainer = headerTitle.closest('div')?.parentElement;
    const closeBtn = headerContainer?.querySelector('button');
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn!);

    // Verify SharePanel overlay is hidden again
    await waitFor(() => {
      expect(screen.queryByText(/Social-Media Export: Felix/i)).not.toBeInTheDocument();
    });
  });

  it('opens the SharePanel overlay when clicking the floating footer share button', async () => {
    const paramsPromise = createResolvedPromise({ id: '42' });
    render(<CatDetailPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Felix')).toBeInTheDocument();
    });

    // Locate footer share button (which has Share2 icon and title)
    const footerButtons = screen.getAllByRole('button');
    const footerShareBtn = footerButtons.find(btn => btn.title && btn.title.includes('Grafik erstellen'));
    
    expect(footerShareBtn).toBeDefined();
    
    // Trigger open
    fireEvent.click(footerShareBtn!);

    await waitFor(() => {
      expect(screen.getByText(/Social-Media Export: Felix/i)).toBeInTheDocument();
    });
  });
});
