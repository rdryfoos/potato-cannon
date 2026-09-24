/**
 * The URL a try script printed, if it printed one.
 *
 * `try.sh` starts the card's web app on a free loopback port and prints the link. The
 * panel showed that link inside a block of monospaced transcript, so a reader had to
 * find it, select it without catching the surrounding text, and paste it. The link is
 * the whole point of pressing the button on a card that built a screen.
 *
 * Loopback only, and http or https only. The transcript is output from a script running
 * on the reader's own machine, and a link in it is a link the panel is about to open:
 * anything that is not this machine is not something this button offers.
 */
const LOOPBACK = /\bhttps?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d{1,5})?(?:\/[^\s<>"')]*)?/gi

export function findOpenableUrl(output: string | null | undefined): string | null {
  if (!output) return null
  const matches = String(output).match(LOOPBACK)
  if (!matches || matches.length === 0) return null
  // The last one: a script that prints a front page and then the route it means prints
  // the route second, and the route is the thing the card is about.
  return matches[matches.length - 1].replace(/[.,;)]+$/, '')
}
