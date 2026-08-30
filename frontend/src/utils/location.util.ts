/**
 * Utility functions for smart event location and map URL parsing.
 */

export interface ParsedLocation {
  isMapUrl: boolean;
  displayText: string;
  mapUrl: string;
  fullLocation: string;
  hasCustomLabel?: boolean;
}

/**
 * Parses an event location string to intelligently detect shared map URLs,
 * venue names with embedded links, or standard plain text venue addresses.
 */
export const parseLocation = (locationInput?: string | null): ParsedLocation => {
  const trimmed = (locationInput || '').trim();

  if (!trimmed) {
    return {
      isMapUrl: false,
      displayText: 'Location TBA',
      mapUrl: '',
      fullLocation: '',
    };
  }

  // Regex to extract standard http/https URLs
  const urlRegex = /(https?:\/\/[^\s]+)/i;
  const urlMatch = trimmed.match(urlRegex);

  if (urlMatch) {
    const matchedUrl = urlMatch[0];
    // Strip trailing punctuation like closing parenthesis, comma, etc.
    const cleanUrl = matchedUrl.replace(/[),;.]+$/, '');
    const textWithoutUrl = trimmed
      .replace(matchedUrl, '')
      .trim()
      .replace(/[-–—,:|]+$/, '')
      .trim();

    // Case 1: Custom label provided alongside URL (e.g. "Grand Ballroom - https://maps.app.goo.gl/...")
    if (textWithoutUrl.length > 1) {
      return {
        isMapUrl: true,
        displayText: textWithoutUrl,
        mapUrl: cleanUrl,
        fullLocation: trimmed,
        hasCustomLabel: true,
      };
    }

    // Case 2: Direct Map / Web URL (e.g. "https://maps.app.goo.gl/wrgoXz1zWgPPfmDv6")
    try {
      const parsed = new URL(cleanUrl);
      const hostname = parsed.hostname.replace(/^www\./, '');
      const pathSnippet =
        parsed.pathname.length > 1 ? parsed.pathname.slice(1, 8) : '';
      const displayLabel = pathSnippet
        ? `${hostname}/${pathSnippet}...`
        : hostname;

      return {
        isMapUrl: true,
        displayText: displayLabel,
        mapUrl: cleanUrl,
        fullLocation: cleanUrl,
      };
    } catch {
      return {
        isMapUrl: true,
        displayText:
          cleanUrl.length > 25 ? `${cleanUrl.slice(0, 22)}...` : cleanUrl,
        mapUrl: cleanUrl,
        fullLocation: cleanUrl,
      };
    }
  }

  // Case 3: Plain Text Venue / Location Name (e.g. "Creative Quarter Co-working Space")
  return {
    isMapUrl: false,
    displayText: trimmed,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`,
    fullLocation: trimmed,
  };
};
