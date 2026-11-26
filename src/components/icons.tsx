// Small stroke icons, drawn for this app (24px grid, 1.75 stroke).
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size = 22): SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
})

export const IHome = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></svg>
export const IPlan = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
export const IHistory = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5M12 8v4.5l3 2" /></svg>
export const IProgress = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
export const IPlus = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>
export const IMinus = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M5 12h14" /></svg>
export const ICheck = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
export const IX = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
export const IChevronLeft = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="m15 5-7 7 7 7" /></svg>
export const IChevronRight = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="m9 5 7 7-7 7" /></svg>
export const IChevronDown = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="m5 9 7 7 7-7" /></svg>
export const IMore = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>
export const ISettings = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
export const IPlay = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M7 5v14l11-7z" fill="currentColor" stroke="none" /></svg>
export const ISearch = ({ size, ...p }: P) => <svg {...base(size)} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
export const ITrash = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
export const IUp = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
export const IDown = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M12 5v14M6 13l6 6 6-6" /></svg>
export const IStar = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="m12 4 2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6 9.6 9z" /></svg>
export const ICloud = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z" /></svg>
export const IRefresh = ({ size, ...p }: P) => <svg {...base(size)} {...p}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" /></svg>
export const IScale = ({ size, ...p }: P) => <svg {...base(size)} {...p}><rect x="3.5" y="4" width="17" height="16" rx="4" /><path d="M8.5 9.5a5 5 0 0 1 7 0L12 12.5" /></svg>
