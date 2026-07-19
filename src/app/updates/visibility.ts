export type Visibility = 'private' | 'close' | 'all'

export const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'private', label: 'Private' },
  { value: 'close', label: 'Close family & friends' },
  { value: 'all', label: 'All volunteers' },
]

export const VISIBILITY_BADGE: Record<Visibility, { label: string; bg: string; text: string }> = {
  private: { label: 'Private', bg: '#f3f4f6', text: '#4b5563' },
  close:   { label: 'Close family & friends', bg: '#fef3c7', text: '#92400e' },
  all:     { label: 'All volunteers', bg: '#d1fae5', text: '#065f46' },
}
