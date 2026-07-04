// ═══════════════════════════════════════════════
// FRONTEND SECURITY — Dev Tools Blocker + Anti-Hack
// ═══════════════════════════════════════════════

export const initSecurity = () => {
  // ─── 1. Block all DevTools keyboard shortcuts ───
  const blockedKeys = new Set(['F12']);
  const blockedCombos = [
    { ctrl: true, shift: true, keys: ['I', 'J', 'C', 'K', 'M'] }, // Chrome/Edge/Firefox devtools
    { ctrl: true, shift: false, keys: ['u', 'U', 's', 'S'] },      // View source, Save
    { ctrl: true, shift: true, keys: ['Delete'] },                   // Task manager
  ];

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Block F12
    if (blockedKeys.has(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+I etc.
    for (const combo of blockedCombos) {
      if (e.ctrlKey === combo.ctrl && e.shiftKey === combo.shift && combo.keys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, true);

  // ─── 2. Block right-click context menu ───
  document.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    return false;
  }, true);

  // ─── 3. Detect DevTools opening (size-based detection) ───
  const threshold = 160;
  const detectDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    if (widthThreshold || heightThreshold) {
      document.body.style.display = 'none';
      setTimeout(() => { document.body.style.display = ''; }, 1000);
    }
  };
  setInterval(detectDevTools, 3000);

  // ─── 4. Block text selection on sensitive elements ───
  document.addEventListener('selectstart', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-select') || target.closest('input[type="password"]')) {
      e.preventDefault();
    }
  });

  // ─── 5. Block drag on sensitive elements ───
  document.addEventListener('dragstart', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.no-drag') || target.closest('input')) {
      e.preventDefault();
    }
  });

  // ─── 6. Console watermark ───
  console.log('%c⚠️ STOP!', 'color:red;font-size:60px;font-weight:bold');
  console.log('%cThis browser feature is intended for developers. If someone told you to copy/paste here, it is a scam.', 'color:red;font-size:14px');
};

// ─── Input validation helpers ─────────────────────
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/javascript:/gi, '')   // strip javascript:
    .replace(/on\w+=/gi, '')        // strip event handlers
    .trim()
    .slice(0, 1000);
};

export const isValidEmail = (e: string): boolean => {
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
};

export const isValidPin = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};

export const sanitize = (s: string): string => {
  if (!s) return '';
  return s.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/on\w+=/gi, '').trim().slice(0, 500);
};

export const validatePasswordStrength = (pw: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!pw || pw.length < 6) errors.push('Min 6 characters');
  if (pw && pw.length > 128) errors.push('Too long');
  if (pw && /\s/.test(pw)) errors.push('No spaces allowed');
  return { valid: errors.length === 0, errors };
};
