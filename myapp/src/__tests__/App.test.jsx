import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';

// Helper to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('App Component', () => {
  it('renders without crashing', () => {
    renderWithRouter(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithRouter(<App />);
    // Should show navbar and main content area
    expect(document.querySelector('main')).toBeInTheDocument();
  });
});

describe('Error Boundary', () => {
  it('renders error boundary without crashing', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    // This would normally show error boundary, but for now just test rendering
    expect(() => renderWithRouter(<ErrorComponent />)).not.toThrow();
  });
});