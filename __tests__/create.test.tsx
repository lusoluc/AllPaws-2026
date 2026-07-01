import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateCatPage from '@/app/dashboard/create/page';

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

// Mock Dexie db
const mockDbAdd = jest.fn().mockResolvedValue(1);
jest.mock('@/lib/db', () => ({
  db: {
    animals: {
      add: (...args: any[]) => mockDbAdd(...args),
    },
  },
}));

describe('CreateCatPage Validation, Multilingual, Offline & Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Default online
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
      writable: true,
    });
  });

  test('Happy Path: allows Cyrillic, German Umlauts, and Lithuanian special characters', async () => {
    render(<CreateCatPage />);
    
    const nameInput = screen.getByPlaceholderText('z.B. Luna');
    const reasonInput = screen.getByPlaceholderText('Hintergründe der Abgabe...');
    const saveButton = screen.getByRole('button', { name: 'Speichern' });

    // Inputs with Cyrillic (Мурка), Umlauts (Gefunden im Müll), and Lithuanian (Katė Šauni)
    fireEvent.change(nameInput, { target: { value: 'Мурка - Šauni' } });
    fireEvent.change(reasonInput, { target: { value: 'Gefunden auf der Straße in Klaipėda bei Kaukėnų g.' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Мурка - Šauni',
          reason_for_shelter: 'Gefunden auf der Straße in Klaipėda bei Kaukėnų g.',
        })
      );
    });
  });

  test('allows room name and cage name fields, and submits them to Dexie database', async () => {
    render(<CreateCatPage />);
    
    const nameInput = screen.getByPlaceholderText('z.B. Luna');
    const roomInput = screen.getByPlaceholderText('z.B. Container 1');
    const cageInput = screen.getByPlaceholderText('z.B. Box 3');
    const saveButton = screen.getByRole('button', { name: 'Speichern' });

    fireEvent.change(nameInput, { target: { value: 'Mimi' } });
    fireEvent.change(roomInput, { target: { value: 'Zimmer 104' } });
    fireEvent.change(cageInput, { target: { value: 'Box A2' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mimi',
          room_name: 'Zimmer 104',
          cage_name: 'Box A2',
        })
      );
    });
  });

  test('Negative Path: trims whitespace-only names and rejects save', async () => {
    render(<CreateCatPage />);
    
    const nameInput = screen.getByPlaceholderText('z.B. Luna');
    const saveButton = screen.getByRole('button', { name: 'Speichern' });

    // Submit space only name
    fireEvent.change(nameInput, { target: { value: '    ' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Bitte gib einen Namen für das Tier ein.')).toBeInTheDocument();
      expect(mockDbAdd).not.toHaveBeenCalled();
    });
  });

  test('Edge Case: handles extremely long text input (Stress Test) without crashing', async () => {
    render(<CreateCatPage />);
    
    const nameInput = screen.getByPlaceholderText('z.B. Luna');
    const reasonInput = screen.getByPlaceholderText('Hintergründe der Abgabe...');
    const saveButton = screen.getByRole('button', { name: 'Speichern' });

    // Generate 50,000 characters string
    const longString = 'A'.repeat(50000);

    fireEvent.change(nameInput, { target: { value: 'Stressy' } });
    fireEvent.change(reasonInput, { target: { value: longString } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Stressy',
          reason_for_shelter: longString,
        })
      );
    });
  });

  test('Offline Mode: visual bar updates to Offline-Modus when navigator.onLine is false', () => {
    // Set offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(<CreateCatPage />);
    
    // Trigger offline listener manually in jest
    fireEvent(window, new Event('offline'));

    expect(screen.getByText('Offline-Modus')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lokal speichern' })).toBeInTheDocument();
  });

  test('Offline Mode Negative Path: blocks video uploads when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });

    render(<CreateCatPage />);
    fireEvent(window, new Event('offline'));

    // Toggle to media section
    const mediaSectionBtn = screen.getByRole('button', { name: 'Medien' });
    fireEvent.click(mediaSectionBtn);

    const videoInput = document.querySelector('input[accept="video/*"]') as HTMLInputElement;
    
    // Simulate video file upload selection
    const mockFile = new File(['mock content'], 'test-video.mp4', { type: 'video/mp4' });
    fireEvent.change(videoInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText('Video-Upload erfordert eine stabile Internetverbindung. Bitte im Online-Bereich hochladen.')).toBeInTheDocument();
    });
  });

  test('Edge Case - QuotaExceededError Fallback: saves text-only draft when photos exceed localStorage limit', async () => {
    // Mock localStorage.setItem to throw QuotaExceededError
    const originalSetItem = localStorage.setItem;
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (key === 'bmd_cat_draft' && value.includes('data:image/jpeg;base64')) {
        throw new DOMException('Setting value exceeded the quota.', 'QuotaExceededError');
      }
      return originalSetItem.apply(localStorage, [key, value]);
    });

    render(<CreateCatPage />);
    
    const nameInput = screen.getByPlaceholderText('z.B. Luna');
    fireEvent.change(nameInput, { target: { value: 'QuotaTest' } });

    // Open media section and simulate adding large base64 image in photos state
    const mediaSectionBtn = screen.getByRole('button', { name: 'Medien' });
    fireEvent.click(mediaSectionBtn);

    const photoInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
    const mockFile = new File(['base64_large_image_data_block'], 'large-pic.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(photoInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      // Expect warning banner explaining quota issue
      expect(screen.getByText(/Speicherlimit des Browsers überschritten/)).toBeInTheDocument();
      
      // Verify text-only draft was still saved in localStorage (stripped of photos)
      const savedDraft = JSON.parse(localStorage.getItem('bmd_cat_draft') || '{}');
      expect(savedDraft.name).toBe('QuotaTest');
      expect(savedDraft.photos).toEqual([]); // photos array stripped
    });

    jest.restoreAllMocks();
  });

  test('Pre-Upload: blocks photos exceeding 15MB size limit', async () => {
    render(<CreateCatPage />);
    
    // Switch to media tab
    const mediaSectionBtn = screen.getByRole('button', { name: 'Medien' });
    fireEvent.click(mediaSectionBtn);

    // Get the first photo input (Kamera or Galerie)
    const photoInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;

    // Simulate 16MB file
    const oversizedBytes = new Uint8Array(16 * 1024 * 1024);
    const mockOversizedFile = new File([oversizedBytes], 'huge-photo.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(photoInput, { target: { files: [mockOversizedFile] } });

    await waitFor(() => {
      expect(screen.getByText(/ist mit 16.0 MB etwas zu groß/)).toBeInTheDocument();
    });
  });

  test('Pre-Upload: blocks invalid file formats for photo uploads', async () => {
    render(<CreateCatPage />);
    
    // Switch to media tab
    const mediaSectionBtn = screen.getByRole('button', { name: 'Medien' });
    fireEvent.click(mediaSectionBtn);

    // Get the photo input
    const photoInput = document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;

    // Simulate invalid file format (text/plain)
    const invalidFile = new File(['hello world'], 'not-a-photo.txt', { type: 'text/plain' });
    
    fireEvent.change(photoInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/ist kein Foto/)).toBeInTheDocument();
    });
  });

  test('Cozy Info Buttons: tapping name help icon opens bottom sheet with name help content', async () => {
    render(<CreateCatPage />);
    
    // Find name help button (its title is "Hilfe anzeigen")
    const helpButtons = screen.getAllByTitle('Hilfe anzeigen');
    const nameHelpBtn = helpButtons[0];
    expect(nameHelpBtn).toBeInTheDocument();
    
    // Bottom sheet is initially not open
    expect(screen.queryByText('💡 Ausfüll-Hilfe:')).not.toBeInTheDocument();
    
    // Click the name help button
    fireEvent.click(nameHelpBtn);
    
    // It should render the bottom sheet modal
    expect(screen.getByText('💡 Ausfüll-Hilfe:')).toBeInTheDocument();
    expect(screen.getByText('Name des Tiers')).toBeInTheDocument();
    expect(screen.getByText(/Jedes Tier benötigt einen Namen/)).toBeInTheDocument();
    
    // Click closing button "Verstanden"
    const closeBtn = screen.getByRole('button', { name: 'Verstanden' });
    fireEvent.click(closeBtn);
    
    // Bottom sheet should be gone
    expect(screen.queryByText('💡 Ausfüll-Hilfe:')).not.toBeInTheDocument();
  });

  test('Cozy Info Buttons: switching to Medical tab and tapping help icon opens bottom sheet with medical help content', async () => {
    render(<CreateCatPage />);
    
    // Switch to medical tab
    const medicalTabBtn = screen.getByRole('button', { name: 'Gesundheit' });
    fireEvent.click(medicalTabBtn);
    
    // Find help button next to "Medizinischer Status"
    const helpButtons = screen.getAllByTitle('Hilfe anzeigen');
    fireEvent.click(helpButtons[0]);
    
    expect(screen.getByText('💡 Ausfüll-Hilfe:')).toBeInTheDocument();
    expect(screen.getAllByText('Medizinischer Status').length).toBe(1);
    expect(screen.getByText(/Aktiviere die Knöpfe/)).toBeInTheDocument();
  });

  test('Multi-Audio UI: displays empty audio state and registers/lists recorded voice notes', async () => {
    // Mock navigator.mediaDevices.getUserMedia and MediaRecorder
    const mockStream = {
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    };
    const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: jest.fn().mockResolvedValue([]),
      },
      writable: true,
      configurable: true,
    });

    class MockMediaRecorder {
      state = 'inactive';
      ondataavailable: any = null;
      onstop: any = null;
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['audio-data'], { type: 'audio/webm' }) });
        }
        if (this.onstop) {
          this.onstop();
        }
      }
    }
    (window as any).MediaRecorder = MockMediaRecorder;

    render(<CreateCatPage />);

    // Switch to media tab
    const mediaSectionBtn = screen.getByRole('button', { name: 'Medien' });
    fireEvent.click(mediaSectionBtn);

    // Verify empty state text
    expect(screen.getByText(/Keine Sprachnotizen aufgenommen/i)).toBeInTheDocument();

    // Find the record audio button
    const recordBtn = screen.getByRole('button', { name: /Neue Sprachnotiz/i });
    expect(recordBtn).toBeInTheDocument();

    // Click to start recording
    fireEvent.click(recordBtn);

    // Wait for the recording state to appear
    await waitFor(() => {
      expect(screen.getByText(/Aufnahme läuft.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Aufnahme stoppen & speichern/i })).toBeInTheDocument();
    });

    // Stop recording
    const stopBtn = screen.getByRole('button', { name: /Aufnahme stoppen & speichern/i });
    fireEvent.click(stopBtn);

    // Wait for the new audio item to appear in the list
    await waitFor(() => {
      expect(screen.getByText(/Note #1/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Diese Sprachnotiz fortsetzen/i)).toBeInTheDocument();
      expect(screen.getByTitle(/Löschen/i)).toBeInTheDocument();
    });
  });

  test('submits newly added Haltung, Gesundheit, and Charakter/Verhalten boolean flags to Dexie', async () => {
    render(<CreateCatPage />);
    
    // Fill required Name
    const nameInput = screen.getByPlaceholderText('z.B. Luna');
    fireEvent.change(nameInput, { target: { value: 'Balu' } });

    // Click basic section checkboxes
    const slowIntLabel = screen.getByText('langsame Zusammenführung');
    fireEvent.click(slowIntLabel);

    // Switch to medical tab
    const medicalTabBtn = screen.getByRole('button', { name: 'Gesundheit' });
    fireEvent.click(medicalTabBtn);

    // Click medical checkboxes
    const catPlagueLabel = screen.getByText('Katzenseuche-Impfung');
    fireEvent.click(catPlagueLabel);

    const fivPositiveLabel = screen.getByText('FIV positiv');
    fireEvent.click(fivPositiveLabel);

    // Switch to behavior tab
    const behaviorTabBtn = screen.getByRole('button', { name: 'Charakter / Verhalten' });
    fireEvent.click(behaviorTabBtn);

    // Click behavior checkbox
    const trustingLabel = screen.getByText('zutraulich');
    fireEvent.click(trustingLabel);

    const saveButton = screen.getByRole('button', { name: 'Speichern' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockDbAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Balu',
          slow_integration: true,
          has_cat_plague_vaccine: true,
          fiv_positive: true,
          trait_trusting: true,
        })
      );
    });
  });
});
