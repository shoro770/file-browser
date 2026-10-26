const HEX = /^#[0-9A-Fa-f]{6}$/

/**
 * Splits a `#RRGGBB` colour into its three 0-255 channels.
 *
 * @param hex - A six-digit hex colour with a leading `#`, in either case.
 * @returns The red, green and blue channels.
 * @throws If `hex` is not a six-digit hex colour.
 */
function channels(hex: string): [number, number, number] {
  if (!HEX.test(hex)) throw new Error(`Not a #RRGGBB colour: "${hex}"`)
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Computes WCAG 2.1 relative luminance.
 *
 * @param hex - A `#RRGGBB` colour.
 * @returns Luminance from 0 (black) to 1 (white).
 */
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Computes the WCAG 2.1 contrast ratio between two colours.
 *
 * @param fg - A `#RRGGBB` colour.
 * @param bg - A `#RRGGBB` colour. The order of `fg` and `bg` does not matter.
 * @param digits - Decimal places to round to; 2 matches the DESIGN.md table, `null` leaves it unrounded.
 * @returns The ratio, from 1 (identical) to 21 (black on white).
 * @throws If either colour is not a `#RRGGBB` hex string.
 */
export function contrastRatio(fg: string, bg: string, digits: number | null = 2): number {
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number]
  const ratio = (light + 0.05) / (dark + 0.05)
  return digits === null ? ratio : Number(ratio.toFixed(digits))
}

/**
 * Blends a colour at partial opacity over an opaque background.
 *
 * @param fg - The `#RRGGBB` colour drawn on top.
 * @param bg - The opaque `#RRGGBB` colour underneath.
 * @param alpha - Opacity of `fg`, from 0 (all `bg`) to 1 (all `fg`).
 * @returns The resulting colour as uppercase `#RRGGBB`.
 * @throws If a colour is malformed or `alpha` is outside 0 to 1.
 */
export function blendOver(fg: string, bg: string, alpha: number): string {
  if (!(alpha >= 0 && alpha <= 1)) throw new Error(`alpha must be between 0 and 1: ${alpha}`)
  const top = channels(fg)
  const under = channels(bg)
  const mixed = top.map((value, i) => Math.round(value * alpha + under[i]! * (1 - alpha)))
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}
