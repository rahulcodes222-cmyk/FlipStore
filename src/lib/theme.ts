/**
 * Design Tokens & Theme Configuration for Indian E-commerce
 * Inspired by Flipkart & Amazon India
 */

export const DESIGN_TOKENS = {
  colors: {
    // Brand Colors
    primary: {
      DEFAULT: '#2874F0', // Flipkart Signature Blue
      hover: '#1a5bc4',
      light: '#eaf2ff',
      dark: '#174fa8',
    },
    navy: {
      DEFAULT: '#172337', // Flipkart Dark Navy Header/Footer
      light: '#21314d',
      dark: '#0e1726',
    },
    accent: {
      DEFAULT: '#FB641B', // Flipkart Orange / Buy Now
      hover: '#e04e05',
      light: '#fff3ed',
      dark: '#c44203',
    },
    // Surface & Layout
    white: '#FFFFFF',
    background: '#F1F3F6', // Off-white/slate e-commerce background
    surface: '#FFFFFF',
    surfaceSubtle: '#F9FAFB',

    // Typography
    text: {
      primary: '#212121', // Deep charcoal/black
      secondary: '#878787', // Muted gray
      subtle: '#B0B0B0',
      inverted: '#FFFFFF',
    },

    // Status & Feedback
    success: {
      DEFAULT: '#388E3C', // Flipkart Green (ratings, discounts, stock)
      light: '#E8F5E9',
      dark: '#2E7D32',
    },
    warning: {
      DEFAULT: '#FF9F00', // Amazon/Flipkart Star Yellow/Orange
      light: '#FFF8E1',
    },
    danger: {
      DEFAULT: '#D32F2F',
      light: '#FFEBEE',
    },

    // Borders & Dividers
    border: {
      DEFAULT: '#E0E0E0',
      subtle: '#F0F0F0',
      focus: '#2874F0',
    },
  },

  // Responsive Breakpoints (Tailwind matches standard screen sizes)
  breakpoints: {
    sm: '640px',   // Mobile landscape
    md: '768px',   // Tablets
    lg: '1024px',  // Laptops / Desktops
    xl: '1280px',  // Wide Desktops
    '2xl': '1536px' // Ultra-wide
  },

  // Elevation / Shadows
  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    cardHover: '0 6px 16px rgba(0, 0, 0, 0.12)',
    header: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
    dropdown: '0 4px 16px 0 rgba(0, 0, 0, 0.16)',
  },

  // Radii
  radii: {
    none: '0px',
    sm: '2px', // Flipkart uses very subtle 2px rounded corners
    md: '4px',
    lg: '8px',
    full: '9999px',
  },
} as const;

export const APP_CONFIG = {
  name: 'my-ecommerce',
  appName: 'FlipStore India',
  currency: {
    symbol: '₹',
    code: 'INR',
    locale: 'en-IN',
  },
  delivery: {
    freeThreshold: 500,
    standardFee: 40,
    expressFee: 99,
  },
  support: {
    phone: '1800-208-9898',
    email: 'support@my-ecommerce.in',
  },
};
