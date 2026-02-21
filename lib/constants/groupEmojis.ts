// Popular emoji options for groups, organized by category
export const GROUP_EMOJI_OPTIONS = [
  // Travel & Places
  '🏠', '🏡', '🏢', '🏖', '🏔', '✈️', '🚗', '🏕',
  // Food & Drink
  '🍕', '🍔', '🍻', '☕', '🍜', '🍣', '🥘', '🎂',
  // Activities
  '🎮', '🎬', '🎵', '⚽', '🏀', '🎯', '🎲', '🎸',
  // People & Social
  '👨‍👩‍👧‍👦', '👫', '👯', '🤝', '💪', '🫂', '👥', '🎉',
  // Objects & Finance
  '💰', '💳', '🧾', '📊', '💼', '🎒', '📱', '💡',
  // Nature & Vibes
  '🌴', '🌊', '🔥', '⭐', '🌙', '🌈', '💎', '🦄',
  // Hearts & Symbols
  '❤️', '💙', '💚', '💜', '🧡', '💛', '🖤', '🤍',
]

// Default emoji when none is selected
export const DEFAULT_GROUP_EMOJI = '👥'

// Get a random emoji for new groups
export function getRandomGroupEmoji(): string {
  const funEmojis = ['🎉', '🚀', '⭐', '🔥', '💰', '🍕', '✈️', '🏠', '👥', '🎯', '💎', '🌈']
  return funEmojis[Math.floor(Math.random() * funEmojis.length)]
}
