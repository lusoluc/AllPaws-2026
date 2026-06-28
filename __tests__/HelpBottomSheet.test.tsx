import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HelpBottomSheet from '@/components/HelpBottomSheet';

describe('HelpBottomSheet Component', () => {
  let originalOverflow: string;

  beforeAll(() => {
    originalOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  test('does not render when isOpen is false', () => {
    const handleClose = jest.fn();
    render(
      <HelpBottomSheet
        isOpen={false}
        onClose={handleClose}
        title="Test Title"
        content="Test Content"
      />
    );
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  test('renders title and content when isOpen is true', () => {
    const handleClose = jest.fn();
    render(
      <HelpBottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Test Title"
        content="Test Content"
      />
    );
    expect(screen.getByText('💡 Ausfüll-Hilfe:')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('calls onClose when clicking the close button (X)', () => {
    const handleClose = jest.fn();
    render(
      <HelpBottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Test Title"
        content="Test Content"
      />
    );
    
    // The close button (X) is the first button inside the header
    const buttons = screen.getAllByRole('button');
    // Button 0 is the X close button, Button 1 is "Verstanden"
    fireEvent.click(buttons[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when clicking the Verstanden button', () => {
    const handleClose = jest.fn();
    render(
      <HelpBottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Test Title"
        content="Test Content"
      />
    );
    
    const verstandenBtn = screen.getByRole('button', { name: 'Verstanden' });
    fireEvent.click(verstandenBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when clicking the backdrop overlay', () => {
    const handleClose = jest.fn();
    const { container } = render(
      <HelpBottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Test Title"
        content="Test Content"
      />
    );
    
    // Find the backdrop element via its classes
    const backdrop = container.querySelector('.bg-stone-900\\/40');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('prevents body scrolling when open and restores when closed/unmounted', () => {
    const handleClose = jest.fn();
    const { rerender, unmount } = render(
      <HelpBottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Test Title"
        content="Test Content"
      />
    );
    
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <HelpBottomSheet
        isOpen={false}
        onClose={handleClose}
        title="Test Title"
        content="Test Content"
      />
    );
    expect(document.body.style.overflow).toBe('');

    // Re-open
    rerender(
      <HelpBottomSheet
        isOpen={true}
        onClose={handleClose}
        title="Test Title"
        content="Test Content"
      />
    );
    expect(document.body.style.overflow).toBe('hidden');

    // Unmount
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
