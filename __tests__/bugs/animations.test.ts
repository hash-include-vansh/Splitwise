/**
 * Bug 1: Expenses/Groups not visible — stagger animation broken
 *
 * Root cause (DEEPER): Two issues working together:
 * 1. `staggerContainer` was missing `initial` key — FIXED in prior pass
 * 2. `staggerItem` has `transition` at the TOP level of the object, outside `animate`.
 *    When used as a framer-motion variant (via `variants={staggerItem}`), framer-motion
 *    only reads `initial` and `animate` keys from the variant object. A top-level
 *    `transition` is IGNORED in variant mode. The transition must be embedded
 *    INSIDE the `animate` object for it to work.
 *
 * Without a proper transition inside animate, framer-motion may not correctly
 * interpolate from initial→animate, causing children to stay at opacity: 0.
 *
 * The fix:
 * - staggerContainer must have `initial` key (already done)
 * - staggerItem.animate must contain `transition` inside it (not at top level)
 * - staggerItem should NOT have a top-level `transition` key (it's ignored in variants)
 */
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations'

describe('Bug 1: Animation variants must have proper structure for framer-motion', () => {
  describe('staggerContainer', () => {
    test('must have an "initial" variant key', () => {
      expect(staggerContainer).toHaveProperty('initial')
    })

    test('must have an "animate" variant key', () => {
      expect(staggerContainer).toHaveProperty('animate')
    })

    test('animate must define staggerChildren', () => {
      expect(staggerContainer.animate).toHaveProperty('transition')
      expect((staggerContainer.animate as any).transition).toHaveProperty('staggerChildren')
      expect((staggerContainer.animate as any).transition.staggerChildren).toBeGreaterThan(0)
    })
  })

  describe('staggerItem', () => {
    test('must have "initial" with opacity 0', () => {
      expect(staggerItem).toHaveProperty('initial')
      expect((staggerItem as any).initial).toHaveProperty('opacity', 0)
    })

    test('must have "animate" with opacity 1', () => {
      expect(staggerItem).toHaveProperty('animate')
      expect((staggerItem as any).animate).toHaveProperty('opacity', 1)
    })

    test('animate must contain transition (not at top level) for variant mode to work', () => {
      // THIS IS THE CRITICAL TEST: when used as `variants={staggerItem}`,
      // framer-motion only reads `initial` and `animate` from the variant.
      // A top-level `transition` is IGNORED. It must be inside `animate`.
      expect((staggerItem as any).animate).toHaveProperty('transition')
      expect((staggerItem as any).animate.transition).toHaveProperty('duration')
    })

    test('should NOT have a top-level transition (it is ignored in variant mode)', () => {
      // Top-level transition only works when passed as a separate prop to <motion.div transition={...}>,
      // NOT when the object is used as a variant. Having it here is misleading and non-functional.
      expect(staggerItem).not.toHaveProperty('transition')
    })
  })

  describe('fadeInUp (used with spread props, not variants)', () => {
    // fadeInUp is used as: <motion.div initial={fadeInUp.initial} animate={fadeInUp.animate} transition={fadeInUp.transition}>
    // So top-level transition IS correct for fadeInUp since it's spread as props, not used as a variant
    test('must have all required keys', () => {
      expect(fadeInUp).toHaveProperty('initial')
      expect(fadeInUp).toHaveProperty('animate')
      expect(fadeInUp).toHaveProperty('transition')
      expect(fadeInUp.initial).toHaveProperty('opacity', 0)
      expect(fadeInUp.animate).toHaveProperty('opacity', 1)
    })
  })
})
