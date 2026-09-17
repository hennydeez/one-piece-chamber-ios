/** Orange + white chamber tokens. Keep `gold*` keys so GoldButton and callers stay stable. */
export const chamber = {
  bg: '#FFFCF8',
  bgElevated: '#FFFFFF',
  bgSunken: '#FFF6EE',
  panel: '#FFFFFF',
  panelEdge: '#F0D0B8',
  gold: '#C44F0E',
  goldSoft: '#A84A16',
  goldDim: '#E8B48A',
  goldWash: '#FFF0E3',
  onGold: '#FFFFFF',
  ink: '#1F140C',
  muted: '#6B5344',
  faint: '#8C7260',
  danger: '#B42318',
  ok: '#2F6F3E',
  raw: '#6F6256',
  psa: '#C44F0E',
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
