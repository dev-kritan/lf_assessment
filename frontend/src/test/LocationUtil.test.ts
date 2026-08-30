import { describe, it, expect } from 'vitest';
import { parseLocation } from '../utils/location.util';

describe('parseLocation Utility', () => {
  it('handles empty or null location gracefully', () => {
    const res1 = parseLocation('');
    expect(res1.displayText).toBe('Location TBA');
    expect(res1.isMapUrl).toBe(false);

    const res2 = parseLocation(null);
    expect(res2.displayText).toBe('Location TBA');
    expect(res2.isMapUrl).toBe(false);
  });

  it('correctly parses plain venue names into Google Maps search queries', () => {
    const venue = 'Creative Quarter Co-working Space';
    const res = parseLocation(venue);

    expect(res.isMapUrl).toBe(false);
    expect(res.displayText).toBe(venue);
    expect(res.fullLocation).toBe(venue);
    expect(res.mapUrl).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(res.mapUrl).toContain(encodeURIComponent(venue));
  });

  it('correctly identifies direct Google Maps shortlinks and shortens display text', () => {
    const url = 'https://maps.app.goo.gl/wrgoXz1zWgPPfmDv6';
    const res = parseLocation(url);

    expect(res.isMapUrl).toBe(true);
    expect(res.mapUrl).toBe(url);
    expect(res.fullLocation).toBe(url);
    expect(res.displayText).toContain('maps.app.goo.gl');
  });

  it('correctly identifies full Google Maps URLs', () => {
    const url = 'https://www.google.com/maps/place/Central+Park';
    const res = parseLocation(url);

    expect(res.isMapUrl).toBe(true);
    expect(res.mapUrl).toBe(url);
    expect(res.displayText).toContain('google.com');
  });

  it('preserves custom venue labels when provided alongside a shared map URL', () => {
    const combined = 'Grand Ballroom & Terrace - https://maps.app.goo.gl/wrgoXz1zWgPPfmDv6';
    const res = parseLocation(combined);

    expect(res.isMapUrl).toBe(true);
    expect(res.hasCustomLabel).toBe(true);
    expect(res.displayText).toBe('Grand Ballroom & Terrace');
    expect(res.mapUrl).toBe('https://maps.app.goo.gl/wrgoXz1zWgPPfmDv6');
    expect(res.fullLocation).toBe(combined);
  });
});
