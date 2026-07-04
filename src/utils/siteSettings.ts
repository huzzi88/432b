// ═══════════════════════════════════════════════
// SITE SETTINGS — Loads favicon + logo from API
// Called once on app start, applies to DOM directly
// ═══════════════════════════════════════════════

let cachedSettings: Record<string, string> = {};

export const loadSiteSettings = async (): Promise<Record<string, string>> => {
  try {
    const res = await fetch('/api/settings', { credentials: 'include' });
    if (!res.ok) return cachedSettings;
    const data = await res.json();
    cachedSettings = data || {};

    // Apply favicon to browser tab immediately
    if (cachedSettings.favicon) {
      applyFavicon(cachedSettings.favicon);
    }

    // Update page title if site_name is set
    if (cachedSettings.site_name) {
      document.title = `🪐 ${cachedSettings.site_name} — Investment Platform`;
    }

    return cachedSettings;
  } catch {
    return cachedSettings;
  }
};

export const getCachedSettings = (): Record<string, string> => cachedSettings;

// Apply favicon to the document head
export const applyFavicon = (dataUrl: string) => {
  // Remove existing favicon links
  const existing = document.querySelectorAll("link[rel*='icon']");
  existing.forEach(el => el.remove());

  // Create new favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
  link.href = dataUrl;

  // Force browser to reload favicon
  link.href = dataUrl + '?v=' + Date.now();

  document.head.appendChild(link);
};
