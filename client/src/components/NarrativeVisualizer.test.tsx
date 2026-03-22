import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NarrativeVisualizer } from './NarrativeVisualizer';

describe('NarrativeVisualizer', () => {
  const mockAnalysis = {
    hook: 'Test Hook',
    problemDefinition: 'Test Problem',
    solutionDepth: 'Test Solution',
    retentionRisk: 'Low',
    structure: [
      { stage: 'Intro', content: 'Content 1' },
      { stage: 'Climax', content: 'Content 2' },
    ],
  };

  it('renders correctly with provided analysis data', () => {
    render(<NarrativeVisualizer analysis={mockAnalysis} />);
    
    // Check headers
    expect(screen.getByText('Video Narrative Analysis')).toBeDefined();
    expect(screen.getByText(/Retention Risk: Low/i)).toBeDefined();

    // Check key analysis points
    expect(screen.getByText('Test Hook')).toBeDefined();
    expect(screen.getByText('Test Problem')).toBeDefined();
    expect(screen.getByText('Test Solution')).toBeDefined();
  });

  it('displays the structure breakdown correctly', () => {
    render(<NarrativeVisualizer analysis={mockAnalysis} />);
    
    expect(screen.getByText('Intro')).toBeDefined();
    expect(screen.getByText('"Content 1"')).toBeDefined();
    expect(screen.getByText('Climax')).toBeDefined();
    expect(screen.getByText('"Content 2"')).toBeDefined();
  });

  it('applies correct styling for low retention risk', () => {
    render(<NarrativeVisualizer analysis={mockAnalysis} />);
    const riskBadge = screen.getByText(/Retention Risk: Low/i);
    expect(riskBadge.className).toContain('text-green-500');
  });

  it('applies correct styling for high retention risk', () => {
    render(<NarrativeVisualizer analysis={{ ...mockAnalysis, retentionRisk: 'High' }} />);
    const riskBadge = screen.getByText(/Retention Risk: High/i);
    expect(riskBadge.className).toContain('text-orange-500');
  });
});
