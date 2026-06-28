import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublicGalleryPage from '@/app/katzen/page';
import CatDetailPage from '@/app/katzen/[id]/page';

// Mock useRouter and use
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      prefetch: () => null,
    };
  },
}));

const createResolvedPromise = (value: any) => {
  const p = Promise.resolve(value);
  (p as any).status = 'fulfilled';
  (p as any).value = value;
  return p;
};

const mockCats = [
  {
    id: 1,
    name: 'Luna',
    type: 'Katze',
    gender: 'Weiblich',
    age_years: 2,
    room_name: 'Zimmer 1',
    cage_name: 'Box 2',
    notes_miscellaneous: 'Sehr zutraulich.',
    media_urls: ['data:image/jpeg;base64,luna'],
    video_urls: [],
    local_videos: [],
    is_emergency: false,
    restrictions: '',
    is_published: true,
    status_aktuell: 'zu vermitteln',
  },
  {
    id: 2,
    name: 'Felix',
    type: 'Katze',
    gender: 'Männlich',
    age_years: 5,
    room_name: 'Zimmer 2',
    cage_name: 'Box A',
    notes_miscellaneous: 'Scheue Katze aus dem Tierheim.',
    media_urls: ['https://supabase.co/media/felix.jpg'],
    video_urls: [],
    local_videos: [],
    is_emergency: true,
    restrictions: 'Mag keine Hunde',
    is_published: true,
    status_aktuell: 'zu vermitteln',
  },
  {
    id: 3,
    name: 'Oscar',
    type: 'Katze',
    gender: 'Männlich',
    age_years: 1,
    room_name: 'Zimmer 3',
    cage_name: 'Box B',
    notes_miscellaneous: 'Wirbelwind.',
    media_urls: [],
    video_urls: ['https://supabase.co/media/oscar_playing.mp4'],
    local_videos: [],
    is_emergency: false,
    restrictions: '',
    is_published: true,
    status_aktuell: 'zu vermitteln',
  }
];

// Mock Dexie DB calls
jest.mock('@/lib/db', () => ({
  db: {
    animals: {
      filter: (cb: any) => ({
        toArray: () => Promise.resolve(mockCats.filter(cb)),
      }),
      toArray: () => Promise.resolve(mockCats),
      get: (id: any) => {
        if (typeof id === 'number' && !isNaN(id)) {
          const found = mockCats.find(c => c.id === id);
          return Promise.resolve(found || null);
        }
        return Promise.resolve(null);
      }
    },
    shelters: {
      limit: () => ({
        first: () => Promise.resolve({
          name: 'VšĮ "Būk mano draugas"',
          address: 'Klaipėda, Lietuva',
          email: 'bukmanodraugas@inbox.lt'
        })
      })
    },
    uiTexts: {
      toArray: () => Promise.resolve([]),
    },
    guideItems: {
      toArray: () => Promise.resolve([]),
    },
    customBlocks: {
      toArray: () => Promise.resolve([]),
    },
  },
  formatAge: (cat: any, lang: string) => {
    if (cat.age_mode === 'birthyear') return `Geb. ${cat.birth_year}`;
    if (cat.age_mode === 'range') return `ca. ${cat.age_min}-${cat.age_max} Jahre`;
    return `${cat.age_years || 0} Jahre`;
  }
}));

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

describe('PublicGalleryPage Suchen und Filtern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Happy Path: listet alle Katzen auf und sucht nach Name', async () => {
    render(<PublicGalleryPage />);

    // Check both cats are rendered
    await waitFor(() => {
      expect(screen.getByText('Luna')).toBeInTheDocument();
      expect(screen.getByText('Felix')).toBeInTheDocument();
    });

    // Search for "Luna"
    const searchInput = screen.getByPlaceholderText(/suchen/i);
    fireEvent.change(searchInput, { target: { value: 'Luna' } });

    // Luna should still be there, Felix should be filtered out
    expect(screen.getByText('Luna')).toBeInTheDocument();
    expect(screen.queryByText('Felix')).not.toBeInTheDocument();
  });

  test('Security/Robustness Path: Sonderzeichen und Regex-Exploits bringen die Suche nicht zum Absturz', async () => {
    render(<PublicGalleryPage />);

    const searchInput = screen.getByPlaceholderText(/suchen/i);

    // Enter potential regex crashes: .* or unclosed group (
    const payloads = ['.*', ' Felix[', '?', '(', '+', '^$'];

    for (const payload of payloads) {
      fireEvent.change(searchInput, { target: { value: payload } });
      // The app should not throw errors or crash
      // It should just show no results or handle it safely as literal string search
      expect(screen.queryByText('Luna')).not.toBeInTheDocument();
    }
  });
});

describe('CatDetailPage Invalid IDs and Email Triggering', () => {
  beforeAll(() => {
    (window as any).mockLocationAssign = jest.fn();
  });

  afterAll(() => {
    delete (window as any).mockLocationAssign;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Happy Path: zeigt die Details einer existierenden Katze und öffnet Mailto-Formular', async () => {
    const paramsPromise = createResolvedPromise({ id: '1' });
    render(<CatDetailPage params={paramsPromise} />);

    // Wait for the cat (Luna) to be loaded and rendered
    await waitFor(() => {
      expect(screen.getByText('Luna')).toBeInTheDocument();
      expect(screen.getByText('Weiblich')).toBeInTheDocument();
    });

    // Click Adopt inquiry button
    const inquireBtn = screen.getByRole('button', { name: /Adoption/i });
    fireEvent.click(inquireBtn);

    // Verify it opened mailto link with correct pre-filled screening questionnaire
    expect((window as any).mockLocationAssign).toHaveBeenCalledWith(expect.stringContaining('mailto:Tierheimbmg@gmail.com'));
    expect((window as any).mockLocationAssign).toHaveBeenCalledWith(expect.stringContaining('Adoptionsanfrage'));
    expect((window as any).mockLocationAssign).toHaveBeenCalledWith(expect.stringContaining('Wohnungsgr'));
  });

  test('Security/Robustness Path: Ungültige IDs (NaN, SQLi) führen zu einer sauberen Fehlermeldung statt Absturz', async () => {
    const paramsPromiseNaN = createResolvedPromise({ id: 'unsafe-string-id' });
    render(<CatDetailPage params={paramsPromiseNaN} />);

    // App should not crash. It should resolve loading and render the friendly "Katze nicht gefunden" screen
    await waitFor(() => {
      expect(screen.getByText('Katze nicht gefunden')).toBeInTheDocument();
      expect(screen.getByText(/Das gesuchte Tier existiert leider nicht/)).toBeInTheDocument();
    });
  });

  test('Security/Robustness Path: Nicht existierende ID rendert den "Nicht gefunden"-Screen', async () => {
    const paramsPromise404 = createResolvedPromise({ id: '999' });
    render(<CatDetailPage params={paramsPromise404} />);

    await waitFor(() => {
      expect(screen.getByText('Katze nicht gefunden')).toBeInTheDocument();
    });
  });

  test('visual sync indicators: renders "Nur lokal gespeichert" badge for local images and "Online" badge for synced ones in gallery', async () => {
    render(<PublicGalleryPage />);

    // Wait for cats to load
    await waitFor(() => {
      expect(screen.getByText('Luna')).toBeInTheDocument();
      expect(screen.getByText('Felix')).toBeInTheDocument();
    });

    // Luna has local media (data:image...) so it should display "Nur lokal gespeichert" tooltip
    expect(screen.getByTitle('Nur lokal gespeichert')).toBeInTheDocument();

    // Felix and Oscar have online media (https://...) so it should display "Online synchronisiert" tooltip
    expect(screen.getAllByTitle('Online synchronisiert').length).toBe(2);
  });

  test('visual sync indicators: renders "Lokal" badge for local images and "Online" badge for synced ones in details', async () => {
    // 1. Local Cat (Luna - ID 1)
    const paramsPromiseLuna = createResolvedPromise({ id: '1' });
    const { rerender } = render(<CatDetailPage params={paramsPromiseLuna} />);

    await waitFor(() => {
      expect(screen.getByText('Luna')).toBeInTheDocument();
    });
    // Should display local sync status text
    expect(screen.getByText('Lokal')).toBeInTheDocument();

    // 2. Synced Cat (Felix - ID 2)
    const paramsPromiseFelix = createResolvedPromise({ id: '2' });
    rerender(<CatDetailPage params={paramsPromiseFelix} />);

    await waitFor(() => {
      expect(screen.getByText('Felix')).toBeInTheDocument();
    });
    // Should display online sync status text
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  test('video rendering in public gallery list: renders video tag if no photo, and video play indicator badge', async () => {
    const { container } = render(<PublicGalleryPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Oscar')).toBeInTheDocument();
    });

    // Oscar has no photos but a video, so it should render a video element
    const videos = container.querySelectorAll('video');
    expect(videos.length).toBeGreaterThan(0);
    
    // Should display the "Video vorhanden" indicator badge
    expect(screen.getByTitle('Video vorhanden')).toBeInTheDocument();
  });

  test('video rendering in detail page: renders video tag with controls if no photo', async () => {
    const paramsPromiseOscar = createResolvedPromise({ id: '3' });
    const { container } = render(<CatDetailPage params={paramsPromiseOscar} />);

    await waitFor(() => {
      expect(screen.getByText('Oscar')).toBeInTheDocument();
    });

    // Detail page should render the video element with controls
    const detailVideos = container.querySelectorAll('video');
    expect(detailVideos.length).toBeGreaterThan(0);
    expect(detailVideos[0]).toHaveAttribute('controls');
  });
});
