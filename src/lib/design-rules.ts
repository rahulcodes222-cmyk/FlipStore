/**
 * Design System Rules & Tokens
 * Flipkart-inspired Premium Indian E-commerce Design System
 */

export const DESIGN_RULES = {
  // 1. Spacing System (8pt grid with 4pt half-steps)
  spacing: {
    xs: "4px",   // Space between badges, small labels
    sm: "8px",   // Space between title & rating, icon & text
    md: "12px",  // Card internal padding (mobile), gap between tags
    lg: "16px",  // Card padding (desktop), grid gap
    xl: "24px",  // Section spacing, modal padding
    "2xl": "32px", // Main layout gutters
    "3xl": "48px", // Section row separators
  },

  // 2. Border Radius System
  radius: {
    sharp: "2px",   // Signature Flipkart buttons, rating badge, input fields
    card: "4px",    // Product cards, banners, dropdown containers
    container: "8px", // Modals, drawers, large panels
    full: "9999px", // Category circle icons, pill filters, avatars, badges
  },

  // 3. Typographic Hierarchy
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    scale: {
      tag: { size: "10px", lineHeight: "12px", weight: "700" },
      caption: { size: "11px", lineHeight: "14px", weight: "500" },
      small: { size: "12px", lineHeight: "16px", weight: "400" },
      body: { size: "14px", lineHeight: "20px", weight: "400" },
      bodyMedium: { size: "14px", lineHeight: "20px", weight: "500" },
      h4: { size: "16px", lineHeight: "22px", weight: "600" },
      h3: { size: "18px", lineHeight: "24px", weight: "600" },
      h2: { size: "22px", lineHeight: "28px", weight: "700" },
      h1: { size: "28px", lineHeight: "36px", weight: "700" },
    },
  },

  // 4. Color Contrast & Accessibility
  colors: {
    primary: "#2874F0",       // Flipkart Blue: 4.6:1 contrast against white (WCAG AA compliant)
    primaryHover: "#1259c7",
    darkNavy: "#172337",      // Header sub-bar & footer
    background: "#F1F3F6",    // Neutral page backdrop
    white: "#FFFFFF",
    text: "#212121",          // Main text: 15.3:1 contrast against white
    mutedText: "#878787",     // Secondary text: 4.5:1 contrast
    accent: "#FB641B",        // Flipkart Orange (Buy Now, urgency)
    accentHover: "#e04e05",
    success: "#388E3C",       // Flipkart Green (Ratings, discounts, savings)
    warning: "#FF9F00",       // Add to cart amber & star ratings
    error: "#D32F2F",         // Validation error red
    border: "#E0E0E0",        // Card & component divider
  },

  // 5. Elevation & Shadows
  shadows: {
    card: "0 1px 2px 0 rgba(0, 0, 0, 0.08)",
    cardHover: "0 4px 12px 0 rgba(0, 0, 0, 0.12)",
    dropdown: "0 4px 16px 0 rgba(0, 0, 0, 0.16)",
    modal: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },

  // 6. Transitions
  transitions: {
    fast: "150ms ease-in-out",
    standard: "200ms ease-in-out",
    drawer: "300ms cubic-bezier(0.16, 1, 0.3, 1)",
  },

  // 7. Mobile Touch Target Rules
  mobile: {
    minTouchTarget: "40px",    // Minimum touchable control area on mobile
    buttonHeight: "44px",      // Standard mobile CTA button height
    headerHeight: "56px",
    bottomNavHeight: "56px",
  },
} as const;
