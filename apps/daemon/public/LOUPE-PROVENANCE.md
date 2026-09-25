# Vendored Loupe viewer bundle

Static build of the Loupe viewer, in `loupe/` beside this file, served by the
daemon at `/loupe/` and framed by the card pane's Thread tab. It is a prebuilt
artifact, not source: edit it in the loupe repo and rebuild, never here.

**This file lives here, one level up, and not in `loupe/`, because `loupe/` is a
build output directory.** The refresh command below empties it. This file used to
sit inside it and say "then restore this file", which is a procedure somebody has
to remember at the one moment they are busy doing something else; the two hand
edits recorded at the bottom are the kind of thing that is lost that way and not
missed for weeks. Out here the build cannot reach it. It is also no longer served
over HTTP: the daemon mounts `public/loupe`, not `public`.

- Source: https://github.com/rdryfoos/loupe, `packages/viz`
- Commit: b045352 ("Merge pull request #4 from rdryfoos/field-flag"), on main,
  re-vendored 2026-09-25. It adds `?field=0`, which hides the single-thread view's
  "Back to field" control and changes nothing else. The Thread tab passes it, because
  after Rik's ruling of 2026-09-25 that tab shows one view and the field is not
  somewhere it can go: an offer of it is an offer of somewhere the reader was never
  coming from. Absent means reachable, so nothing that does not pass it is affected.
  Loupe's own suite passes at that commit, 216 tests.

  It carries everything f10d43c did, from the ninth and tenth cold runs: the strand
  field drawn at full size with no expand control, the descent's statements and
  evidence lines wrapped to two lines with the full text on each element's own `title`,
  and a parent row with no test of its own reading "proven through 3 criteria" where it
  read "no proof yet" beside a green mark. And R5 as revised, from 180f450: a started
  node answers for its own work, so started debt over a backlog child reads amber
  rather than falling through to blue. The colour rule is unchanged by either.
- Built with: `vite build --base=/loupe/ --outDir <here> --emptyOutDir`

The `--base=/loupe/` is load-bearing. The public loupe.dryfoos.com bundle is
built with `--base=/app/`, which bakes `/app/assets/...` into index.html; that
bundle 404s if dropped in here unchanged.

The bundle makes no network requests of its own. It fetches exactly two things,
both from the daemon that served it:

- the artifact named by `?manifest=<url>`
- `/api/source?repoPath=...&path=...&line=...`, and only when the manifest came
  from its own origin

Both are answered by `apps/daemon/src/server/routes/thread.routes.ts`.

To refresh:

    cd <loupe>/packages/viz
    ./node_modules/.bin/vite build --base=/loupe/ \
      --outDir <potato-cannon>/apps/daemon/public/loupe --emptyOutDir

then update the commit line above. **Do not re-apply anything by hand.** This line
used to say "and re-apply the hand edits below", which is the opposite of what the
section below says, and the section below is the one that is right: a hand edit in a
build output is a change with no home. Nothing needs restoring either:
`--emptyOutDir` empties `loupe/`, and this file is not in it.

## Hand edits that are no longer here, 2026-09-20 to 2026-09-23

Two changes were once made by hand in the built bundle, and this file said a rebuild
would erase them. **They are gone, and they were already gone before the re-vendor of
2026-09-23.** The bundle vendored at a971926 carries the same inline `#e8bd52` stroke
this file says was replaced, so the loss happened at that refresh and nobody noticed
for a day: exactly the silent loss the warning predicted, with the warning itself left
standing as though it had worked.

They are kept below as a record of what was wanted and where it belongs, which is
Loupe's own source. Do not re-apply them here. A hand edit in a build output is a
change with no home, and this section is what one costs.

**One of the two has landed there, and the other has not.** At `f10d43c`: the field is
expanded in Loupe's own source, and more completely than the hand edit asked for, so
item 1 is closed. `web/src/strand.ts` still writes the hex inline, four times, so
item 2 is still owed and is still Loupe's to fix.

1. ~~**The field opens expanded.**~~ **Closed in Loupe at `f10d43c`.** The hand edit
   flipped the expanded flag's initial value and left the collapse control alone.
   Loupe's own ruling of 2026-09-25 went further and took the state, the control and
   the handler out together: there is no flag to flip now, and the field is drawn at
   full size with nothing to fold it. Kept here struck through rather than deleted,
   because a docket line that simply vanishes reads like one nobody did.
2. **The descent nodes are coloured by their own stage, from the palette.** Every
   inline hex in the descent SVG generator is gone, replaced by `var(--ok)`,
   `var(--brand-accent)`, `var(--debt)`, `var(--gap)` and `var(--muted)` through
   inline `style`, because a `var()` in a presentation attribute does not resolve.
   The three nodes are intent at `cy=8`, build at `cy=40`, proof at `cy=72`:

   | Row state | intent | build | proof | stroke |
   |---|---|---|---|---|
   | `proven` | `--ok` | `--ok` | `--ok` | `--muted` |
   | `tracked-debt` | `--ok` | `--debt` | `--debt`, hollow | `--muted` |
   | `backlog` | `--brand-accent` | `--muted` | `--muted` | `--muted` |
   | `GAP`, build earned | `--ok` | `--ok` | `--gap` | `--muted` |
   | `GAP`, nothing built | `--ok` | `--gap` | | `--muted` |

   Before this the stroke was `#e8bd52`, the palette's `--gold`, on proven, tracked
   debt and backlog alike, which is what read as a warning colour on rows that were
   nothing of the kind.

Item 2 belongs in Loupe's own source and is docketed there.

The Thread tab drives it through the URL, and after 2026-09-25 it sends the same five
every time: `?embed=1` for the bare shell, `?lens=list`, `?field=0`, `?ids=` for the
card's own ids, `?title=` for the card's name, and `?id=` for the one id the rail is
open on. There is no sub-tab row any more; the tab shows one view.

`lens=list` is not a request for the field. An `?id=` draws that row's thread over the
list, because Loupe reads the id before it reads the lens
(`descentOpen = !!deepLinkId`). The tab always sends one, so the rail is always what
comes up, and the reader picks which id from the line above the frame.

This line has been wrong twice and both times a cold run found it. It said
`?lens=thread`, and Loupe has no lens called thread: `main.ts` takes "list", "map" or
"descent" and silently ignores anything else, so the tab set nothing and Loupe stayed
on its default. And it went on saying `?id=` belonged to one sub-tab for a week after
the sub-tabs' behaviour changed under it.
