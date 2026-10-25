---
name: Obsidian Kinetic
colors:
  surface: '#10131c'
  surface-dim: '#10131c'
  surface-bright: '#363943'
  surface-container-lowest: '#0b0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#272a33'
  surface-container-highest: '#32343e'
  on-surface: '#e0e2ef'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e0e2ef'
  inverse-on-surface: '#2d303a'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#bdf4ff'
  on-secondary: '#00363d'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#ffffff'
  on-tertiary: '#680013'
  tertiary-container: '#ffdad9'
  on-tertiary-container: '#c61732'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#ffdad9'
  tertiary-fixed-dim: '#ffb3b2'
  on-tertiary-fixed: '#410008'
  on-tertiary-fixed-variant: '#92001f'
  background: '#10131c'
  on-background: '#e0e2ef'
  surface-variant: '#32343e'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  metric-numeral:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-interactive:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system establishes a high-performance athletic dark mode interface engineered for intense focus, biometric clarity, and immediate cognitive parsing under physical exertion. The brand personality balances elite strength conditioning with precision engineering: uncompromising, kinetic, and razor-sharp. 

The aesthetic synthesizes technical minimalism with high-contrast performance optics. Deep carbon foundations eliminate sensory overload, while precise hits of electric volt deliver instant state feedback. Avoid decorative gradients or rainbow status badges; visual punch is earned exclusively through decisive typography, tactical borders, and hyper-targeted luminous accents. The emotional goal is quiet intensity and peak physical confidence.

## Colors

The palette enforces a strict 60-30-10 distribution ratio to guarantee visual harmony:
- **60% Carbon Grounding:** Background canvas (`#090B10`), baseline surface (`#11141D`), and layered card container (`#181C27`).
- **30% Structural Slate Neutrals:** High-clarity typography (`#F8FAFC`), subdued metric metadata (`#94A3B8`), structural ghost borders (`#232938`), and muted track fills (`#334155`).
- **10% Kinetic High-Frequency Accents:** Dominant Volt Lime (`#CCFF00`) reserved strictly for primary execution triggers, target milestones, and active toggles. Secondary Cyan (`#00E5FF`) delivers pacing, cadence, and secondary telemetry data. Tertiary Electric Coral (`#FF4655`) is strictly constrained to peak heart rate zones, warnings, and rest timer completion.

Never place light text over Volt Lime; all `#CCFF00` interactive fills mandate deep contrast carbon text (`#0B1200`).

## Typography

The typographic hierarchy pairs the technical velocity of **Space Grotesk** with the neutral legibility of **Inter**. 

Space Grotesk drives all navigational titles, biometric readouts, counters, and high-frequency metric data points. Numbers require tabular figure support (`font-variant-numeric: tabular-nums`) to prevent shifting when counters, timers, or heart rates fluctuate in real time. **Inter** powers all instructional text, workout logging descriptions, and multi-line nutritional body copy to maximize clarity under screen glare and motion. Use `label-caps` in uppercase styling for all categorical workout labels and muscle group tags.

## Layout & Spacing

The layout is built on a responsive 4-column grid for mobile devices (<768px), an 8-column grid for tablets (768px-1024px), and a 12-column grid for widescreen dashboards (>1024px). 

Vertical rhythm is governed by a consistent 8px baseline scale. Dense data clusters (such as weight-by-reps tables and rest-timer modules) use `space-xs` and `space-sm` to maintain instant peripheral comprehension without scrolling. Mobile layout padding stays locked to `margin` (16px) to maximize screen real estate for touch targets, expanding smoothly at wider breakpoints.

## Elevation & Depth

Visual hierarchy uses tonal surface elevation reinforced by technical translucent borders, avoiding muddy drop shadows. 

1. **Base Ground (Level 0):** `#090B10`. The canvas foundation.
2. **Surface Foundation (Level 1):** `#11141D` with a crisp 1px border of `#232938`. Used for standard content sections and inactive workout day blocks.
3. **Elevated Card Container (Level 2):** `#181C27` with a 1px border of `#2D3548`. Used for active exercises, biometric graphs, and tappable summary modules.
4. **Active/Overlay State (Level 3):** `#1E2332` with a 1px translucent border (`rgba(204, 255, 0, 0.25)` or `rgba(255, 255, 255, 0.12)`) and an ultra-diffused atmospheric glow: `0 8px 32px -4px rgba(0, 0, 0, 0.7), 0 0 16px -2px rgba(204, 255, 0, 0.08)`.

Glassmorphic backdrops for bottom navigation bars and floating timer overlays utilize `backdrop-filter: blur(16px)` over an 80% opacity carbon fill (`rgba(9, 11, 16, 0.8)`).

## Shapes

The design system employs a refined geometric curve strategy:
- Base inputs, buttons, and sub-cards utilize a crisp **12px (`rounded`)** corner radius to maintain athletic velocity without looking aggressive or toy-like.
- Macro containers, tracking cards, and dashboard modular blocks use **16px (`rounded-lg`)**.
- Biometric progress rings, quick-set tags, and workout status chips use pure pills (`rounded-full` / 9999px) to contrast against structural rectilinear modules.

## Components

### Buttons
- **Primary Action (Start Workout, Finish Set):** Solid Volt Lime (`#CCFF00`) fill with contrast carbon typography (`#0B1200`, `font-weight: 700`). No border. Active states compress subtly (`transform: scale(0.98)`).
- **Secondary Action (Add Exercise, Plate Calculator):** Translucent carbon background (`#181C27`) with a 1px `#232938` steel border and slate text (`#F8FAFC`). Hover/focus illuminates the border to Cyan (`#00E5FF`).
- **Ghost/Tertiary Action:** Zero fill, slate-400 text (`#94A3B8`), turning `#CCFF00` on active focus.

### Metric Cards & Quick Actions
- Built on `#181C27` with a 1px `#232938` border.
- All workout cards share a singular architectural signature: a top-level uppercase label (`label-caps`), large tabular numeric readouts, and monochrome utility icons (`#94A3B8`). 
- When an exercise or target set is currently active, the card border transitions to `rgba(204, 255, 0, 0.4)` and displays a 2px vertical indicator bar in Volt Lime on its leading edge.

### Chips & Filter Tags
- Inactive tags utilize `#11141D` background with `#64748B` typography and a `#232938` border.
- Selected tags swap to `rgba(204, 255, 0, 0.12)` fill with `#CCFF00` text and a precise `rgba(204, 255, 0, 0.4)` perimeter highlight.

### Inputs & Number Steppers
- Heavy weight/rep inputs leverage `#090B10` background recesses within `#181C27` cards.
- Default border: `#232938`. Focused border: `#CCFF00` with zero offset.
- Incremental stepper triggers (+/- 5lb) use high-tactile square-radius buttons (44x44px minimum touch boundaries) in `#1E2332`.

### Checkboxes & Set Completion Radios
- Set completion triggers use 28px square or circular targets with a 2px `#334155` border.
- Upon completion, the element snaps to solid `#CCFF00` with a sharp `#0B1200` check glyph, providing definitive physical feedback.

### Biometric Progress Rings & Timers
- Track backgrounds sit at `#181C27`. Active stroke progress transitions dynamically from Cyan (`#00E5FF`) during cadence build-up to Volt Lime (`#CCFF00`) upon hitting daily output capacity.