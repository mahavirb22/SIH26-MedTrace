---
name: VeriMed Clinical Trust
colors:
  surface: '#faf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f0'
  surface-container: '#efeeea'
  surface-container-high: '#e9e8e4'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#414845'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f2f1ed'
  outline: '#717975'
  outline-variant: '#c1c8c4'
  surface-tint: '#406659'
  primary: '#00261c'
  on-primary: '#ffffff'
  primary-container: '#163c31'
  on-primary-container: '#80a798'
  inverse-primary: '#a7cfc0'
  secondary: '#506600'
  on-secondary: '#ffffff'
  secondary-container: '#c8f248'
  on-secondary-container: '#556d00'
  tertiary: '#15231e'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a3933'
  on-tertiary-container: '#92a29a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c2ebdb'
  primary-fixed-dim: '#a7cfc0'
  on-primary-fixed: '#002118'
  on-primary-fixed-variant: '#284e42'
  secondary-fixed: '#c8f248'
  secondary-fixed-dim: '#add52b'
  on-secondary-fixed: '#161f00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#d6e6dd'
  tertiary-fixed-dim: '#bacac1'
  on-tertiary-fixed: '#101e19'
  on-tertiary-fixed-variant: '#3b4a43'
  background: '#faf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
typography:
  headline-xl:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  max-width: 1200px
---

## Brand & Style

The design system is anchored in the concept of "Verified Integrity." It targets healthcare providers, pharmacists, and patients who require immediate, unambiguous confirmation of medicinal authenticity. The emotional response is one of calm, professional reassurance and clinical precision.

The aesthetic follows a **Modern Corporate** direction with **Minimalist** sensibilities. It prioritizes clarity over decoration, using high-quality whitespace and a restricted color palette to focus the user’s eye on verification statuses and data strings. A subtle tactile influence is introduced through "blister-pack" motifs—repeating pill-shaped geometries—which serve as a visual metaphor for the pharmaceutical industry. The interface must feel intentional, authoritative, and medically sound.

## Colors

This design system utilizes a high-contrast, professional palette designed for legibility and trust. 

- **Primary (#163C31):** A deep forest green used for the core identity, primary navigation, and main action buttons. It represents stability and growth.
- **CTA/Highlight (#C8F248):** A bright lime used exclusively for high-priority calls to action, success badges, and "Verified" status indicators. Use sparingly to maintain its impact.
- **Background (#FAF9F5):** A warm off-white that reduces eye strain compared to pure white, providing a "paper-like" clinical feel.
- **Neutral/Borders (#7C8C84):** A muted sage used for secondary information, UI borders, and inactive states. 
- **Text (#14231D):** A near-black ink used for all primary reading content to ensure maximum accessibility.

## Typography

Typography is used to distinguish between narrative guidance and technical data. 

- **Headlines:** Use *Syne* (as a high-character alternative to Clash Display) for a bold, distinctive, and modern look.
- **Body:** Use *Hanken Grotesk* (as an alternative to Satoshi) for its clean, contemporary, and highly readable proportions.
- **Technical IDs:** Use *JetBrains Mono* (as an alternative to IBM Plex Mono) for all serial numbers, batch codes, and verification hashes. This monospaced font ensures that similar characters (like '0' and 'O') are easily distinguishable to prevent errors in manual entry.

Maintain a strict vertical rhythm. All labels for data fields should use the `label-caps` style to differentiate them from the values they represent.

## Layout & Spacing

The design system employs a **Fixed Grid** on desktop and a **Fluid Grid** on mobile.

- **Desktop:** A 12-column centered layout with a max-width of 1200px. Gutters are fixed at 24px to ensure content breathability.
- **Mobile:** A 4-column fluid layout with 16px side margins. 
- **The Blister Motif:** As a unique spatial divider, a horizontal row of 8px x 8px circles with 4px spacing can be used to separate major sections. These should be rendered in the secondary text color (#7C8C84) at 20% opacity.

Spacing follows an 8px base unit. Use larger gaps (48px+) between distinct information groups (e.g., Product Details vs. Chain of Custody) to maintain a clinical, organized appearance.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

1.  **Level 0 (Background):** The warm off-white surface (#FAF9F5).
2.  **Level 1 (Cards/Sections):** White surfaces (#FFFFFF) with a 1px solid border in Muted Sage (#7C8C84) at 30% opacity. No shadow.
3.  **Level 2 (Active States/Modals):** A very soft, diffused shadow (0px 4px 20px rgba(22, 60, 49, 0.05)) to suggest a slight lift without breaking the flat, clinical aesthetic.

Avoid all gradients. Depth should feel structural and architectural, like a physical medical chart.

## Shapes

The shape language combines the efficiency of rectangles with the organic safety of pill shapes.

- **Buttons:** All primary and secondary buttons must be fully rounded (Pill-shaped) to provide a soft, approachable contrast to the grid-heavy layout.
- **Containers:** Informational cards and data modules use a `rounded-xl` (24px) radius on desktop and `rounded-lg` (16px) on mobile to reinforce the "blister-pack" metaphor.
- **Input Fields:** Use a moderate `rounded-md` (8px) to balance the softness of the buttons with the precision of the data entry fields.

## Components

- **Buttons:** Primary buttons are #163C31 with white text. CTA Highlight buttons are #C8F248 with #14231D text. All buttons feature a "pill" radius.
- **Badges/Status:** "Verified" status badges use a background of #C8F248 at 20% opacity with #163C31 text. "Warning" or "Unverified" badges use a soft coral background (add contextually as needed) to maintain the clinical tone.
- **Cards:** Cards should have a subtle 1px border (#7C8C84 @ 30%) and a white background. Header sections within cards may have a light fill of #FAF9F5 to separate metadata from the main content.
- **Input Fields:** Use #14231D for typed text and #7C8C84 for placeholders. The border should thicken by 1px and change to #163C31 upon focus.
- **ID Display:** Any serial number or barcode ID should be contained within a light gray code block using the Monospace font, slightly inset with a 4px radius.
- **Progress/Timeline:** Use the "blister" motif (circles) to indicate steps in a medicine's journey through the supply chain. Completed steps are filled with Primary Forest Green; current steps are outlined.
