/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#203128',
    tint: '#3E7C59',

    // Core surfaces
    background: '#F7F3E8',
    foreground: '#203128',

    // Cards / elevated surfaces
    card: '#FFFDF7',
    cardForeground: '#203128',

    // Primary action color (buttons, links, active states)
    primary: '#3E7C59',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E6EDD9',
    secondaryForeground: '#294D39',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEE9DC',
    mutedForeground: '#6F786E',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E8A66A',
    accentForeground: '#3E2B1E',

    // Destructive actions (delete, error states)
    destructive: '#B95548',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#DCD6C8',
    input: '#DCD6C8',
  },
  dark: {
    text: '#F2F0E7',
    tint: '#8FC49F',
    background: '#17221B',
    foreground: '#F2F0E7',
    card: '#202E25',
    cardForeground: '#F2F0E7',
    primary: '#8FC49F',
    primaryForeground: '#142019',
    secondary: '#293B30',
    secondaryForeground: '#DCE8DE',
    muted: '#26342B',
    mutedForeground: '#AEB9B0',
    accent: '#D99A63',
    accentForeground: '#24170F',
    destructive: '#E07B70',
    destructiveForeground: '#24100E',
    border: '#35473B',
    input: '#415347',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
