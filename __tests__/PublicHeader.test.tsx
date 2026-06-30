import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PublicHeader from '@/components/PublicHeader';
import { usePathname } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('PublicHeader Component', () => {
  const mockSetLang = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock pathname to root home
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  test('Happy Path: Desktop layout renders logo, links, language switcher and login', () => {
    render(<PublicHeader lang="DE" setLang={mockSetLang} />);

    // Brand elements should be visible
    expect(screen.getByText('Būk mano draugas')).toBeInTheDocument();
    expect(screen.getByText('Tierrettung Litauen')).toBeInTheDocument();

    // Desktop nav items are present (rendered in main navigation bar)
    expect(screen.getByText('Unsere Schützlinge 🐾')).toBeInTheDocument();
    expect(screen.getByText('Katzen-Ratgeber')).toBeInTheDocument();
    expect(screen.getByText('Über uns & Spenden')).toBeInTheDocument();

    // Action button & language toggle should be present
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByText('Helfer-Portal')).toBeInTheDocument();
  });

  test('Happy Path: Renders Lithuanian translations when lang is LT', () => {
    render(<PublicHeader lang="LT" setLang={mockSetLang} />);

    expect(screen.getByText('Gyvūnų prieglauda')).toBeInTheDocument();
    expect(screen.getByText('Mūsų globotiniai 🐾')).toBeInTheDocument();
    expect(screen.getByText('Kačių gidas')).toBeInTheDocument();
    expect(screen.getByText('Apie mus & Parama')).toBeInTheDocument();
    expect(screen.getByText('Savanorių portalas')).toBeInTheDocument();
  });

  test('Happy Path: Clicking language switch button triggers setLang callback', () => {
    render(<PublicHeader lang="DE" setLang={mockSetLang} />);

    const langBtn = screen.getByRole('button', { name: /de/i });
    fireEvent.click(langBtn);

    expect(mockSetLang).toHaveBeenCalledWith('LT');
  });

  test('Happy Path: Mobile hamburger drawer opens and displays large menu touch targets', () => {
    const { container } = render(<PublicHeader lang="DE" setLang={mockSetLang} />);

    // Drawer is closed initially
    expect(screen.queryByText('Sprachauswahl')).not.toBeInTheDocument();

    // Click Hamburger toggle button
    const burgerBtn = screen.getByLabelText('Toggle navigation menu');
    fireEvent.click(burgerBtn);

    // Drawer is open: verifies drawer contents
    expect(screen.getByText('Sprachauswahl')).toBeInTheDocument();
    
    // Large touch links are present inside the drawer wrapper
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(3); // Logo, Katzen, Ratgeber, Über uns, Login

    // Click language switcher inside drawer
    const ltMobileBtn = screen.getByRole('button', { name: 'LT' });
    fireEvent.click(ltMobileBtn);
    expect(mockSetLang).toHaveBeenCalledWith('LT');

    // Click Hamburger toggle again to close it
    fireEvent.click(burgerBtn);
    expect(screen.queryByText('Sprachauswahl')).not.toBeInTheDocument();
  });

  test('Happy Path: Highlights active menu item based on current route pathname', () => {
    // Mock page location as /katzen-ratgeber
    (usePathname as jest.Mock).mockReturnValue('/katzen-ratgeber');
    
    const { container } = render(<PublicHeader lang="DE" setLang={mockSetLang} />);

    // The link for /katzen-ratgeber should be styled with text-brandpink-600
    const activeLink = screen.getByText('Katzen-Ratgeber');
    expect(activeLink).toHaveClass('text-brandpink-600');

    // The other links should be styled with text-stone-500
    const inactiveLink = screen.getByText('Unsere Schützlinge 🐾');
    expect(inactiveLink).toHaveClass('text-stone-500');

    // Canvas/CSS active underline indicator element should be present inside activeLink
    const underline = activeLink.querySelector('span');
    expect(underline).toHaveClass('bg-brandpink-500');
  });

  test('Negative Path: None of the main navigation tabs are highlighted on non-navigated subpages', () => {
    // Mock route as /impressum which is not one of the 3 primary navigation tabs
    (usePathname as jest.Mock).mockReturnValue('/impressum');

    render(<PublicHeader lang="DE" setLang={mockSetLang} />);

    // None of the main items should have the active text color
    const link1 = screen.getByText('Unsere Schützlinge 🐾');
    const link2 = screen.getByText('Katzen-Ratgeber');
    const link3 = screen.getByText('Über uns & Spenden');

    expect(link1).toHaveClass('text-stone-500');
    expect(link2).toHaveClass('text-stone-500');
    expect(link3).toHaveClass('text-stone-500');

    expect(link1).not.toHaveClass('text-brandpink-600');
    expect(link2).not.toHaveClass('text-brandpink-600');
    expect(link3).not.toHaveClass('text-brandpink-600');
  });
});
