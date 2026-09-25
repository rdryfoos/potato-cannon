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
- Commit: f10d43c ("Merge pull request #3 from rdryfoos/field-clamp-parents"), on main,
  re-vendored 2026-09-25. It carries three changes a fresh Bang user met on the ninth
  and tenth cold runs, seeing Loupe for the first time through the Thread tab: the
  strand field is drawn at full size with no expand control at all, so a reader's first
  look at the Field sub-tab is every thread rather than a box of small marks; the
  descent's statements and evidence lines wrap to two lines instead of being cut to one,
  with the full text on each element's own `title`; and a parent row with no test of its
  own reads "proven through 3 criteria" where it used to read "no proof yet" beside a
  green mark. Loupe's own suite passes at that commit, 210 tests.

  It also still carries R5 as revised, from 180f450: a started node answers for its own
  work, so started debt over a backlog child reads amber rather than falling through to
  blue. The colour rule is unchanged by f10d43c; only the words beside it are.
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

The Thread tab drives it through the URL: `?embed=1` for the bare shell,
`?lens=list|descent` for which view, `?ids=` for the card's own ids, `?title=` for the
card's name in the rail header, and `?id=` under Descent and only under Descent.

Two corrections in that line, both from cold runs. It said `?lens=thread`, and Loupe
has no lens called thread: `main.ts` accepts "list", "map" or "descent" and ignores
anything else, so the tab set nothing and Loupe stayed on its default. And `?id=` is
named here now because it belongs to one sub-tab: Loupe reads it before it reads the
lens (`descentOpen = !!deepLinkId`) and an id closes the field, so the Field sub-tab
sends none.
