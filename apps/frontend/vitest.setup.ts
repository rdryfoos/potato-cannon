/**
 * Why this suite refuses to run on the wrong Node, and says so.
 *
 * On 2026-09-25 thirty-three tests failed across four files, every one of them
 * `TypeError: Cannot read properties of undefined (reading 'setItem')` thrown from
 * inside zustand's persist middleware. Nothing in this repository was wrong. The
 * stack trace named a dependency, the failures looked like a storage bug, and the
 * cause was the Node the runner happened to be on.
 *
 * The chain, because it is not guessable from the error:
 *
 *   1. Node 22 has no `globalThis.localStorage`. Node 26 does, and its value is
 *      `undefined` unless the process was started with `--localstorage-file`.
 *   2. vitest's jsdom environment copies jsdom's window keys onto the Node global,
 *      and skips any key that is already `in` that global and is not on its own
 *      `KEYS` list. `localStorage` is not on that list.
 *   3. So on Node 26 the key is already there, jsdom's working `localStorage` is
 *      never copied, and Node's empty one stays. `sessionStorage` survives because
 *      Node's own is in-memory and works, which is why the failures look selective.
 *
 * It is not an opaque origin. The origin is `http://localhost:3000` and jsdom's own
 * `localStorage` works when jsdom is constructed directly, which is the first thing
 * anybody checks and the first thing to rule out.
 *
 * The check below is on the fact rather than on the version number: a Node that grows
 * a working `localStorage`, or a vitest that adds it to `KEYS`, passes without anybody
 * editing this file. The version is in the message because it is what the reader has
 * to change.
 */

/** The refusal, or null when there is nothing to refuse. */
export function webStorageRefusal(nodeVersion: string, localStorageAvailable: boolean): string | null {
  if (localStorageAvailable) return null
  return [
    `This suite needs Node 22, and this is Node ${nodeVersion}.`,
    '',
    'localStorage is undefined, so every persisted zustand store will throw',
    '"Cannot read properties of undefined (reading \'setItem\')" and the trace will',
    'name zustand rather than this.',
    '',
    'Node 22 has no global localStorage, so vitest copies jsdom\'s working one onto',
    'the global. Node 23 and later ship one that is undefined without',
    '--localstorage-file, and vitest skips any jsdom key the global already has, so',
    'the empty one wins. It is not an opaque origin.',
    '',
    'Run the suite on Node 22. There is an .nvmrc:',
    '',
    '    nvm use            # or: PATH="/opt/homebrew/opt/node@22/bin:$PATH"',
    '    pnpm test',
  ].join('\n')
}

const refusal = webStorageRefusal(process.version, typeof localStorage !== 'undefined')
if (refusal) throw new Error('\n\n' + refusal + '\n')
