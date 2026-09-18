/** Orange + white chamber tokens. Keep `gold*` keys so GoldButton and callers stay stable. */
export const chamber = {
  bg: '#FFFDF9',
  bgElevated: '#FFFFFF',
  bgSunken: '#FFF3E6',
  panel: '#FFFFFF',
  /** Clearer orange-tinted edge so cards, chips, and fields read as sections. */
  panelEdge: '#F0A56A',
  gold: '#F25C12',
  goldSoft: '#D9480C',
  goldDim: '#FFB27A',
  goldWash: '#FFE4CC',
  onGold: '#FFFFFF',
  ink: '#1F140C',
  muted: '#6B5344',
  faint: '#8C7260',
  danger: '#B42318',
  ok: '#2F6F3E',
  raw: '#6F6256',
  psa: '#F25C12',
  bgs: '#3A6584',
  tag: '#8B4E28',
} as const;

export const chamberTheme = {
  dark: false,
  colors: {
    primary: chamber.gold,
    background: chamber.bg,
    card: chamber.bgElevated,
    text: chamber.ink,
    border: chamber.panelEdge,
    notification: chamber.danger,
  },
} as const;
