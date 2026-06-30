import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SharePanel from '@/components/SharePanel';

// Mock clipboard and share APIs
const mockWriteText = jest.fn().mockResolvedValue(undefined);
const mockShare = jest.fn().mockResolvedValue(undefined);
const mockCanShare = jest.fn().mockReturnValue(true);

// Mock HTMLCanvasElement context and data URLs
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
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    writable: true,
  });
  Object.defineProperty(navigator, 'share', {
    value: mockShare,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, 'canShare', {
    value: mockCanShare,
    writable: true,
    configurable: true,
  });
  
  // Mock Canvas API
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
      // Automatically trigger onload asynchronously to simulate image load
      setTimeout(() => fn && fn(), 10);
    },
    configurable: true
  });
  
  Object.defineProperty(global.Image.prototype, 'onerror', {
    get() {
      return this._onerror;
    },
    set(fn) {
      this._onerror = fn;
    },
    configurable: true
  });
});

describe('SharePanel Social Exporter Component', () => {
  const mockAnimal = {
    id: 123,
    name: 'Mimi',
    type: 'Katze' as const,
    gender: 'Weiblich' as const,
    age_years: 3,
    shelter_admission_date: '2023-05',
    reason_for_shelter: 'Ausgesetzt am Waldrand.',
    room_name: 'Zimmer 3',
    cage_name: 'Box 12',
    is_castrated: true,
    is_chipped: true,
    has_rabies_vaccine: true,
    trait_cuddly: 'JA' as const,
    trait_playful: 'JA' as const,
    trait_curious: 'JA' as const,
    media_urls: ['/cats/mimi1.jpg', '/cats/mimi2.jpg']
  };

  const mockOnClose = jest.fn();

  beforeAll(() => {
    (window as any).mockLocationAssign = jest.fn();
  });

  afterAll(() => {
    delete (window as any).mockLocationAssign;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
  });

  test('Happy Path: Renders successfully and displays first-person description preview', () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    // Default language is German (DE)
    expect(screen.getByText('Social-Media Export: Mimi')).toBeInTheDocument();
    
    // Check that first-person template is visible in the preview container
    expect(screen.getByText(/ICH SUCHE DICH! MEIN NAME IST Mimi/)).toBeInTheDocument();
    expect(screen.getByText(/Hallo\.\.\. hörst du mich\? Ich sitze im Tierheim in Litauen/)).toBeInTheDocument();
  });

  test('Language toggle switch (DE <-> LT) updates description translation and state', () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    // Toggle to LT
    const ltBtn = screen.getByRole('button', { name: 'LT' });
    fireEvent.click(ltBtn);

    // Verify Lithuanian first-person text template in preview
    expect(screen.getByText(/AŠ LABAI TAVĘS LAUKIU! MANO VARDAS Mimi/)).toBeInTheDocument();
  });

  test('WhatsApp Share: opens a window with pre-formatted description and link', () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const whatsappBtn = screen.getByRole('button', { name: /WhatsApp/i });
    fireEvent.click(whatsappBtn);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://api.whatsapp.com/send?text='),
      '_blank'
    );
    const openUrl = (window.open as jest.Mock).mock.calls[0][0];
    expect(openUrl).toContain(encodeURIComponent('ICH SUCHE DICH! MEIN NAME IST Mimi'));
    expect(openUrl).toContain(encodeURIComponent('http://localhost/katzen/123'));
  });

  test('Facebook Share: opens Facebook sharer with URL only', () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const facebookBtn = screen.getByRole('button', { name: /Facebook/i });
    fireEvent.click(facebookBtn);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://www.facebook.com/sharer/sharer.php?u='),
      '_blank'
    );
    const openUrl = (window.open as jest.Mock).mock.calls[0][0];
    expect(openUrl).toContain(encodeURIComponent('http://localhost/katzen/123'));
  });

  test('Instagram Share: copies first-person post text and triggers success notification toast', async () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const instagramBtn = screen.getByRole('button', { name: /Instagram/i });
    fireEvent.click(instagramBtn);

    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('ICH SUCHE DICH! MEIN NAME IST Mimi'));
    
    await waitFor(() => {
      expect(screen.getByText(/Post-Text kopiert! Bereit zum Teilen/)).toBeInTheDocument();
    });
  });

  test('TikTok Share: copies link and triggers success notification toast', async () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const tiktokBtn = screen.getByRole('button', { name: /TikTok/i });
    fireEvent.click(tiktokBtn);

    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('http://localhost/katzen/123'));
    
    await waitFor(() => {
      expect(screen.getByText(/Link für TikTok kopiert!/)).toBeInTheDocument();
    });
  });

  test('Email Share: opens mailto client with pre-filled subject and body', () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const emailBtn = screen.getByRole('button', { name: /Email/i });
    fireEvent.click(emailBtn);

    expect((window as any).mockLocationAssign).toHaveBeenCalledWith(expect.stringContaining('mailto:?subject='));
    expect((window as any).mockLocationAssign).toHaveBeenCalledWith(expect.stringContaining('Hilfe%20f%C3%BCr%20Mimi%20gesucht!'));
  });

  test('Copy Text Button: copies description and shows copied banner', async () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const copyBtn = screen.getByRole('button', { name: /Text kopieren/i });
    fireEvent.click(copyBtn);

    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('ICH SUCHE DICH! MEIN NAME IST Mimi'));
    await waitFor(() => {
      expect(screen.getByText('Beschreibung kopiert!')).toBeInTheDocument();
    });
  });

  test('Native Web Share: invokes navigator.share if available, falls back to copy description', async () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const webShareBtn = screen.getByRole('button', { name: /Teilen/i });
    fireEvent.click(webShareBtn);

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Adoptionsaufruf: Mimi',
        url: 'http://localhost/katzen/123',
      })
    );
  });

  // NEW TESTS FOR SOCIAL MEDIA VISUAL GRAPHIC GENERATOR
  test('Happy Path: Switch to Graphic-Beitrag tab and check canvas & thumbnail selection', async () => {
    const { container } = render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    // Switch to Graphic tab
    const graphicTabBtn = screen.getByRole('button', { name: 'Grafik-Beitrag' });
    fireEvent.click(graphicTabBtn);

    // Verify canvas is rendered
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Verify photo thumbnail carousel is rendered since mockAnimal has 2 photos
    const firstThumb = screen.getByAltText('Photo 1');
    const secondThumb = screen.getByAltText('Photo 2');
    expect(firstThumb).toBeInTheDocument();
    expect(secondThumb).toBeInTheDocument();

    // Clicking second thumbnail changes selected image index
    fireEvent.click(secondThumb);
    // Button style indicator should shift (e.g. check for border classes or focus)
    expect(secondThumb.closest('button')).toHaveClass('border-brandpink-500');
  });

  test('Negative Path: Fallback photo is drawn when animal has no media_urls', () => {
    const animalNoPhotos = { ...mockAnimal, media_urls: [] };
    const { container } = render(<SharePanel animal={animalNoPhotos} onClose={mockOnClose} />);

    const graphicTabBtn = screen.getByRole('button', { name: 'Grafik-Beitrag' });
    fireEvent.click(graphicTabBtn);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    // No photo selection carousel should be rendered
    expect(screen.queryByAltText('Photo 1')).not.toBeInTheDocument();
  });

  test('Happy Path: Click download graphic triggers canvas download', async () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const graphicTabBtn = screen.getByRole('button', { name: 'Grafik-Beitrag' });
    fireEvent.click(graphicTabBtn);

    // Spy on link click execution
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const downloadBtn = screen.getByRole('button', { name: /Herunterladen/i });
    fireEvent.click(downloadBtn);

    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/png');
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();

    await waitFor(() => {
      expect(screen.getByText(/Grafik-Download gestartet!/)).toBeInTheDocument();
    });
  });

  test('Happy Path: Click share graphic invokes navigator.share with files', async () => {
    render(<SharePanel animal={mockAnimal} onClose={mockOnClose} />);

    const graphicTabBtn = screen.getByRole('button', { name: 'Grafik-Beitrag' });
    fireEvent.click(graphicTabBtn);

    const shareBtn = screen.getByRole('button', { name: /Grafik teilen/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Adoptionsaufruf: Mimi',
          text: expect.stringContaining('Schenk Mimi ein Zuhause!'),
          files: expect.any(Array)
        })
      );
    });
  });
});
