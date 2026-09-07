export const chamber = {
  bg: '#0A0908',
  bgElevated: '#14110E',
  bgSunken: '#080706',
  panel: '#1A1612',
  panelEdge: '#3D3428',
  gold: '#C9A227',
  goldSoft: '#E4D5A8',
  goldDim: '#8A7324',
  ink: '#F3EDE2',
  muted: '#C2B6A0',
  faint: '#A39886',
  danger: '#C45C4A',
  ok: '#7BA17A',
  raw: '#8A8175',
  psa: '#C9A227',
  bgs: '#6E8CA8',
  tag: '#A67C52',
} as const;

export const chamberTheme = {
  dark: true,
  colors: {
    primary: chamber.gold,
    background: chamber.bg,
    card: chamber.bgElevated,
    text: chamber.ink,
    border: chamber.panelEdge,
    notification: chamber.danger,
  },
} as const;
