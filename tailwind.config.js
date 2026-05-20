/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container-high": "#272a31",
        "on-secondary": "#520070",
        "on-surface-variant": "#bbc9cf",
        "secondary-container": "#6e208c",
        "tertiary-fixed": "#4dffb2",
        "on-surface": "#e1e2eb",
        "on-tertiary": "#003822",
        "surface": "#10131a",
        "secondary-fixed": "#f9d8ff",
        "background": "#10131a",
        "tertiary-container": "#00de94",
        "on-background": "#e1e2eb",
        "primary": "#a8e8ff",
        "on-error-container": "#ffdad6",
        "on-secondary-fixed-variant": "#6e208c",
        "on-primary-fixed": "#001f27",
        "inverse-on-surface": "#2e3037",
        "primary-fixed": "#b4ebff",
        "surface-tint": "#3cd7ff",
        "on-tertiary-container": "#005c3b",
        "primary-container": "#00d4ff",
        "outline": "#859398",
        "secondary": "#edb1ff",
        "inverse-surface": "#e1e2eb",
        "tertiary-fixed-dim": "#00e297",
        "on-primary-container": "#00586b",
        "inverse-primary": "#00677e",
        "on-secondary-fixed": "#320046",
        "error": "#ffb4ab",
        "surface-variant": "#32353c",
        "error-container": "#93000a",
        "outline-variant": "#3c494e",
        "on-secondary-container": "#e498ff",
        "on-error": "#690005",
        "surface-container-low": "#191c22",
        "on-primary-fixed-variant": "#004e5f",
        "tertiary": "#00feaa",
        "surface-dim": "#10131a",
        "surface-container-lowest": "#0b0e14",
        "primary-fixed-dim": "#3cd7ff",
        "surface-container": "#1d2026",
        "secondary-fixed-dim": "#edb1ff",
        "on-tertiary-fixed": "#002112",
        "on-primary": "#003642",
        "surface-container-highest": "#32353c",
        "surface-bright": "#363940",
        "on-tertiary-fixed-variant": "#005234"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "gutter": "12px",
        "panel-padding": "16px",
        "canvas-margin": "24px",
        "base": "8px"
      },
      fontFamily: {
        "headline-lg": ["inter"],
        "label-caps": ["jetbrainsMono"],
        "data-mono": ["jetbrainsMono"],
        "body-sm": ["inter"],
        "body-lg": ["inter"],
        "headline-md": ["inter"]
      },
      fontSize: {
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "label-caps": ["11px", {"lineHeight": "16px", "letterSpacing": "0.08em", "fontWeight": "700"}],
        "data-mono": ["13px", {"lineHeight": "18px", "fontWeight": "500"}],
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
      }
    }
  }
}
