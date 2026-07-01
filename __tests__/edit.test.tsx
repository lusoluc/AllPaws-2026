import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditCatPage from '@/app/dashboard/edit/[id]/page';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      prefetch: () => null,
    };
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock syncWithCloud and pruneRevisions
jest.mock('@/lib/syncManager', () => ({
  syncWithCloud: jest.fn().mockResolvedValue(undefined),
  uploadMediaBlob: jest.fn().mockResolvedValue(null),
  pruneRevisions: jest.fn().mockResolvedValue(undefined),
}));

// Mock Dexie DB
const mockAnimal = {
  id: 1,
  name: 'Luna',
  type: 'Katze',
  gender: 'Weiblich',
  age_years: 3,
  age_mode: 'range',
  age_min: 2,
  age_max: 4,
  room_name: 'Zimmer B',
  cage_name: 'Box 4',
  reason_for_shelter: 'Gefunden im Wald',
  restrictions: 'Keine Hunde',
  notes_miscellaneous: 'Sehr süß',
  is_published: true,
  is_emergency: false,
  is_castrated: true,
  is_chipped: true,
  has_rabies_vaccine: true,
  has_cat_flu_vaccine: true,
  is_dewormed: true,
  has_eu_passport: true,
  compat_cats: 'JA',
  compat_dogs: 'NEIN',
  compat_children: 'JA',
  trait_curious: 'JA',
  trait_playful: 'JA',
  trait_aggressive: 'NEIN',
  trait_fearful: 'NEIN',
  trait_cuddly: 'JA',
  media_urls: ['https://supabase.co/media/luna.jpg'],
  passport_urls: ['https://supabase.co/passport/luna_pass.jpg'],
  video_urls: ['https://supabase.co/video/luna_vid.mp4'],
  audio_draft_url: 'https://supabase.co/audio/luna_aud.webm',
};

const mockAnimalRevisions = [
  {
    id: 101,
    animal_id: 1,
    version_data: JSON.stringify({
      id: 1,
      name: 'Luna Alt',
      type: 'Katze',
      gender: 'Weiblich',
      age_years: 2,
      room_name: 'Zimmer Alt',
      cage_name: 'Box Alt',
      reason_for_shelter: 'Ausgesetzt',
      restrictions: 'Keine Hunde',
      notes_miscellaneous: 'Alt',
      is_published: true,
      is_emergency: false,
      is_castrated: true,
      is_chipped: true,
      has_rabies_vaccine: true,
      has_cat_flu_vaccine: true,
      is_dewormed: true,
      has_eu_passport: true,
      compat_cats: 'JA',
      compat_dogs: 'NEIN',
      compat_children: 'JA',
      trait_curious: 'JA',
      trait_playful: 'JA',
      trait_aggressive: 'NEIN',
      trait_fearful: 'NEIN',
      trait_cuddly: 'JA',
      media_urls: [],
      passport_urls: [],
      video_urls: [],
    }),
    edited_by: 'Carlos',
    created_at: '2026-06-20T12:00:00.000Z',
    sync_pending: 0,
    updated_at: '2026-06-20T12:00:00.000Z'
  }
];

const mockDbGet = jest.fn().mockImplementation((id: number) => {
  if (id === 1) return Promise.resolve(mockAnimal);
  return Promise.resolve(null);
});
const mockDbPut = jest.fn().mockResolvedValue(1);
const mockRevisionsAdd = jest.fn().mockResolvedValue(1);

jest.mock('@/lib/db', () => ({
  db: {
    animals: {
      get: (id: any) => mockDbGet(id),
      put: (data: any) => mockDbPut(data),
    },
    animalRevisions: {
      where: () => ({
        equals: () => ({
          toArray: () => Promise.resolve(mockAnimalRevisions)
        })
      }),
      add: (data: any) => mockRevisionsAdd(data),
    }
  },
}));


const createResolvedPromise = (value: any) => {
  const p = Promise.resolve(value);
  (p as any).status = 'fulfilled';
  (p as any).value = value;
  return p;
};

describe('EditCatPage Happy & Negative Path Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('bmd_session', 'authenticated');
  });

  test('Happy Path: loads existing animal details and pre-fills forms', async () => {
    const paramsPromise = createResolvedPromise({ id: '1' });
    render(<EditCatPage params={paramsPromise} />);

    // Wait for loading to finish and name to appear in input
    await waitFor(() => {
      expect(screen.getByDisplayValue('Luna')).toBeInTheDocument();
    });

    // Check pre-filled values
    expect(screen.getByDisplayValue('Zimmer B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Box 4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gefunden im Wald')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Keine Hunde')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sehr süß')).toBeInTheDocument();
  });

  test('Happy Path: allows editing fields and updates Dexie IndexedDB', async () => {
    const paramsPromise = createResolvedPromise({ id: '1' });
    render(<EditCatPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Luna')).toBeInTheDocument();
    });

    // Edit Name and Room
    const nameInput = screen.getByDisplayValue('Luna');
    const roomInput = screen.getByDisplayValue('Zimmer B');
    fireEvent.change(nameInput, { target: { value: 'Luna Neu' } });
    fireEvent.change(roomInput, { target: { value: 'Zimmer C' } });

    // Fill staff name
    const staffInput = screen.getByPlaceholderText('Dein Name oder Kürzel (z.B. Carlos)');
    fireEvent.change(staffInput, { target: { value: 'Carlos' } });

    // Click Save (Änderungen speichern)
    const saveBtn = screen.getByRole('button', { name: 'Änderungen speichern' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockDbPut).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Luna Neu',
          room_name: 'Zimmer C',
          sync_pending: 1,
        })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 2000 });
  });

  test('Happy Path: loads historical revision and fills form fields', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    const paramsPromise = createResolvedPromise({ id: '1' });
    render(<EditCatPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Luna')).toBeInTheDocument();
    });

    // Click "Verlauf" tab
    const historyTab = screen.getByRole('button', { name: 'Verlauf' });
    fireEvent.click(historyTab);

    // Wait for the revision list and click "Laden" button
    await waitFor(() => {
      expect(screen.getByText('Carlos')).toBeInTheDocument();
    });

    const loadBtn = screen.getByRole('button', { name: 'Laden' });

    fireEvent.click(loadBtn);

    // Verify window.confirm was called
    expect(confirmSpy).toHaveBeenCalled();

    // Verify fields are reverted to the historical state ("Luna Alt", "Zimmer Alt")
    await waitFor(() => {
      expect(screen.getByDisplayValue('Luna Alt')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Zimmer Alt')).toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });


  test('Negative Path: shows error if name field is cleared', async () => {
    const paramsPromise = createResolvedPromise({ id: '1' });
    render(<EditCatPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Luna')).toBeInTheDocument();
    });

    // Clear Name input
    const nameInput = screen.getByDisplayValue('Luna');
    fireEvent.change(nameInput, { target: { value: '' } });

    // Save
    const saveBtn = screen.getByRole('button', { name: 'Änderungen speichern' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Bitte gib einen Namen für das Tier ein.')).toBeInTheDocument();
      expect(mockDbPut).not.toHaveBeenCalled();
    });
  });

  test('Negative Path: handles non-existent ID by rendering friendly error state', async () => {
    const paramsPromise = createResolvedPromise({ id: '999' });
    render(<EditCatPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByText('Katze nicht gefunden')).toBeInTheDocument();
      expect(screen.getByText(/Das Tier mit ID/)).toBeInTheDocument();
    });
  });

  test('Happy Path: loads Haltung, Gesundheit, and Charakter traits and updates them successfully', async () => {
    const paramsPromise = createResolvedPromise({ id: '1' });
    render(<EditCatPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Luna')).toBeInTheDocument();
    });

    // Check basic tab checkboxes (slow Integration is false by default in mockAnimal)
    const slowIntBox = screen.getByRole('checkbox', { name: 'langsame Zusammenführung' }) as HTMLInputElement;
    expect(slowIntBox.checked).toBe(false);
    fireEvent.click(slowIntBox);
    expect(slowIntBox.checked).toBe(true);

    // Switch to Gesundheit tab
    const medicalTabBtn = screen.getByRole('button', { name: 'Gesundheit' });
    fireEvent.click(medicalTabBtn);

    // Verify pre-filled from mockAnimal (has_eu_passport is true)
    const passportBox = screen.getByRole('checkbox', { name: 'EU-Heimtierausweis' }) as HTMLInputElement;
    expect(passportBox.checked).toBe(true);

    // Switch to Charakter tab
    const behaviorTabBtn = screen.getByRole('button', { name: 'Charakter / Verhalten' });
    fireEvent.click(behaviorTabBtn);

    // Verify pre-filled trait_trusting (false in mockAnimal)
    const trustingBox = screen.getByRole('checkbox', { name: 'zutraulich' }) as HTMLInputElement;
    expect(trustingBox.checked).toBe(false);
    fireEvent.click(trustingBox);
    expect(trustingBox.checked).toBe(true);

    // Save
    const staffInput = screen.getByPlaceholderText('Dein Name oder Kürzel (z.B. Carlos)');
    fireEvent.change(staffInput, { target: { value: 'Carlos' } });

    const saveBtn = screen.getByRole('button', { name: 'Änderungen speichern' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockDbPut).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          slow_integration: true,
          trait_trusting: true,
        })
      );
    });
  });

  test('Negative/Exclusivity Path: ensures mutual exclusivity of Castration and FIV/FeLV test result checkboxes on Edit Page', async () => {
    const paramsPromise = createResolvedPromise({ id: '1' });
    render(<EditCatPage params={paramsPromise} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Luna')).toBeInTheDocument();
    });

    // Switch to Gesundheit tab
    const medicalTabBtn = screen.getByRole('button', { name: 'Gesundheit' });
    fireEvent.click(medicalTabBtn);

    // Get checkboxes via role and name
    const kastriertBox = screen.getByRole('checkbox', { name: 'kastriert' }) as HTMLInputElement;
    const nichtKastriertBox = screen.getByRole('checkbox', { name: 'nicht kastriert' }) as HTMLInputElement;
    
    // Click "nicht kastriert" - should auto-uncheck "kastriert"
    fireEvent.click(nichtKastriertBox);
    expect(nichtKastriertBox.checked).toBe(true);
    expect(kastriertBox.checked).toBe(false);
    
    // Click "kastriert" - should auto-uncheck "nicht kastriert"
    fireEvent.click(kastriertBox);
    expect(kastriertBox.checked).toBe(true);
    expect(nichtKastriertBox.checked).toBe(false);

    // FIV checkboxes
    const fivNegBox = screen.getByRole('checkbox', { name: 'FIV-Test negativ' }) as HTMLInputElement;
    const fivPosBox = screen.getByRole('checkbox', { name: 'FIV positiv' }) as HTMLInputElement;

    // Check FIV negativ
    fireEvent.click(fivNegBox);
    expect(fivNegBox.checked).toBe(true);
    expect(fivPosBox.checked).toBe(false);

    // Check FIV positiv - should auto-uncheck FIV negativ
    fireEvent.click(fivPosBox);
    expect(fivPosBox.checked).toBe(true);
    expect(fivNegBox.checked).toBe(false);
  });
});
