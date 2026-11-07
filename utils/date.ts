import { TIME_ZONE } from '../config/maintenance'

/** e.g. "Nov 7, 2026, 3:22 AM EST". Everyone sees the same time, wherever they are. */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    timeZone: TIME_ZONE,
    timeZoneName: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
