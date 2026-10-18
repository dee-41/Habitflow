// Full class names are written out so Tailwind can detect them.
export const STREAK_COLORS = {
  emerald: {
    label: 'Green',
    dot: 'bg-emerald-500',
    solid: 'bg-emerald-500 text-white hover:bg-emerald-600',
    soft: 'bg-emerald-50 text-emerald-700',
    ring: 'ring-emerald-500',
  },
  sky: {
    label: 'Blue',
    dot: 'bg-sky-500',
    solid: 'bg-sky-500 text-white hover:bg-sky-600',
    soft: 'bg-sky-50 text-sky-700',
    ring: 'ring-sky-500',
  },
  violet: {
    label: 'Purple',
    dot: 'bg-violet-500',
    solid: 'bg-violet-500 text-white hover:bg-violet-600',
    soft: 'bg-violet-50 text-violet-700',
    ring: 'ring-violet-500',
  },
  rose: {
    label: 'Pink',
    dot: 'bg-rose-500',
    solid: 'bg-rose-500 text-white hover:bg-rose-600',
    soft: 'bg-rose-50 text-rose-700',
    ring: 'ring-rose-500',
  },
  amber: {
    label: 'Yellow',
    dot: 'bg-amber-500',
    solid: 'bg-amber-500 text-white hover:bg-amber-600',
    soft: 'bg-amber-50 text-amber-700',
    ring: 'ring-amber-500',
  },
  orange: {
    label: 'Orange',
    dot: 'bg-orange-500',
    solid: 'bg-orange-500 text-white hover:bg-orange-600',
    soft: 'bg-orange-50 text-orange-700',
    ring: 'ring-orange-500',
  },
}

export function getStreakColor(name) {
  return STREAK_COLORS[name] ?? STREAK_COLORS.emerald
}