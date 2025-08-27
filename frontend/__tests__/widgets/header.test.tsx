import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/widgets/header';

jest.mock('@/lib/theme', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
  }),
}));

describe('Header Widget', () => {
  it('should render logo and navigation elements', () => {
    render(<Header />);
    
    expect(screen.getByText('Nowhere Land')).toBeInTheDocument();
    expect(screen.getByText('navigation.aboutMe')).toBeInTheDocument();
  });

  it('should have proper responsive classes for grid layout', () => {
    render(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0', 'z-[9999]');
  });

  it('should show theme toggle button on medium screens and above', () => {
    render(<Header />);
    
    const themeButton = screen.getByTitle('theme.toggle');
    expect(themeButton).toHaveClass('hidden', 'md:flex');
  });
});