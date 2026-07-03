jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    prefetch: () => null,
  }),
  usePathname: () => '/',
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '@/app/page';
import UeberUnsPage from '@/app/ueber-uns/page';
import CatGuidePage from '@/app/ratgeber/page';

// Mock shelter data
const mockShelter = {
  id: 1,
  name: 'VšĮ "Būk mano draugas"',
  address: 'Kaukėnų g. 9, Glaudėnai, Litauen',
  bankName: 'Swedbank',
  bic: '73000',
  iban: 'LT123456789012345678',
  notes: 'Danke für die Unterstützung!',
};

// Mock dexie / DB query functions
jest.mock('@/lib/db', () => ({
  db: {
    shelters: {
      limit: () => ({
        first: () => mockShelter,
      }),
    },
    uiTexts: {
      toArray: () => [],
    },
    guideItems: {
      toArray: () => [],
    },
    animals: {
      toArray: () => [],
    },
    customBlocks: {
      toArray: () => [
        { id: 1, page: 'home', type: 'title', de: 'Willkommen CMS', lt: 'Sveiki CMS', sort_order: 1 },
        { id: 2, page: 'home', type: 'paragraph', de: 'Das ist ein Text.', lt: 'Tai yra tekstas.', sort_order: 2 },
        { id: 3, page: 'about', type: 'title', de: 'Über Uns CMS', lt: 'Apie Mus CMS', sort_order: 1 },
        { id: 4, page: 'guide', type: 'title', de: 'Ratgeber CMS', lt: 'Gidas CMS', sort_order: 1 },
      ],
    },
  },
}));

// Mock dexie-react-hooks useLiveQuery to execute synchronously in tests
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => fn(),
}));

beforeEach(() => {
  localStorage.clear();
});

describe('HomePage Rendering & Translation', () => {
  test('renders 3-column CTA cards and handles language toggle (DE <-> LT)', () => {
    render(<HomePage />);

    // Default language is German (DE)
    expect(screen.getByText('Unsere Schützlinge')).toBeInTheDocument();
    expect(screen.getAllByText('Ratgeber & FAQ')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Über uns & Spenden')[0]).toBeInTheDocument();
    expect(screen.getByText(/Unsere Vision: Ein liebevolles Zuhause/)).toBeInTheDocument();
    expect(screen.getByText(/Die Realität vor Ort: Leben im Käfig/)).toBeInTheDocument();
    
    // Verify CMS blocks in DE
    expect(screen.getByText('Willkommen CMS')).toBeInTheDocument();
    expect(screen.getByText('Das ist ein Text.')).toBeInTheDocument();

    // Toggle language to Lithuanian
    const langBtn = screen.getByRole('button', { name: /DE/ });
    fireEvent.click(langBtn);

    // Verify Lithuanian translation
    expect(screen.getByText('Mūsų globotiniai')).toBeInTheDocument();
    expect(screen.getByText('Gyvūnų gidas ir DUK')).toBeInTheDocument();
    expect(screen.getByText('Apie mus ir parama')).toBeInTheDocument();
    expect(screen.getByText(/Mūsų vizija: Mylintys namai/)).toBeInTheDocument();
    expect(screen.getByText(/Realybė prieglaudoje: Gyvenimas narvuose/)).toBeInTheDocument();

    // Verify CMS blocks in LT
    expect(screen.getByText('Sveiki CMS')).toBeInTheDocument();
    expect(screen.getByText('Tai yra tekstas.')).toBeInTheDocument();
  });
});

describe('UeberUnsPage Billing info & Donations', () => {
  test('renders bank wiring details and language toggle works', () => {
    render(<UeberUnsPage />);

    // Verify banking information is present (bank name, IBAN)
    expect(screen.getAllByText(/Swedbank/).length).toBeGreaterThan(0);
    expect(screen.getByText(/LT123456789012345678/)).toBeInTheDocument();
    expect(screen.getByText(/73000/)).toBeInTheDocument();

    // Verify donation impact table in German
    expect(screen.getByText(/10 €/)).toBeInTheDocument();
    expect(screen.getByText('1 Woche gesundes Futter für ein Tier')).toBeInTheDocument();

    // Verify CMS block in DE
    expect(screen.getByText('Über Uns CMS')).toBeInTheDocument();

    // Switch language to Lithuanian
    const langBtn = screen.getByRole('button', { name: /DE/ });
    fireEvent.click(langBtn);

    // Verify translation updates
    expect(screen.getByText('Kaip jūsų parama padeda')).toBeInTheDocument();
    expect(screen.getByText('1 savaitė pilnaverčio maisto vienam gyvūnui')).toBeInTheDocument();

    // Verify CMS block in LT
    expect(screen.getByText('Apie Mus CMS')).toBeInTheDocument();
  });
});

describe('CatGuidePage Collapsible Accordions & Category Filtering', () => {
  test('allows toggling accordions and filtering by category pills', async () => {
    render(<CatGuidePage />);

    // Default: Check for a safety category question
    const safetyQuestion = screen.getByText('Was ist die Gefahr bei gekippten Fenstern (Kippfenster-Syndrom)?');
    expect(safetyQuestion).toBeInTheDocument();

    // Verify CMS block in DE
    expect(screen.getByText('Ratgeber CMS')).toBeInTheDocument();

    // The answer should initially be hidden or collapsed
    // Let's click the question to toggle the accordion open
    fireEvent.click(safetyQuestion);

    // The answer content should now be visible or we can see it in document
    expect(screen.getByText(/⚠️ Gekippte Fenster sind eine lebensgefährliche Falle für Wohnungskatzen/)).toBeInTheDocument();

    // Filter by Nutrition category pill only
    const nutritionPill = screen.getByRole('button', { name: 'Ernährung & Gesundheit' });
    fireEvent.click(nutritionPill);

    // Safety question should no longer be rendered since we filtered to nutrition
    expect(screen.queryByText('Was ist die Gefahr bei gekippten Fenstern (Kippfenster-Syndrom)?')).not.toBeInTheDocument();

    // Nutrition questions should be visible
    expect(screen.getByText('Nassfutter oder Trockenfutter: Was ist gesünder für Wohnungskatzen?')).toBeInTheDocument();

    // Switch language to Lithuanian
    const langBtn = screen.getByRole('button', { name: /DE/ });
    fireEvent.click(langBtn);

    // Verify Lithuanian translation of nutrition question
    expect(screen.getByText('Šlapias ar sausas maistas: kas sveikiau kambarinėms katėms?')).toBeInTheDocument();

    // Verify CMS block in LT
    expect(screen.getByText('Gidas CMS')).toBeInTheDocument();
  });
});
