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
- Commit: 180f450 ("Merge pull request #2 from rdryfoos/feat/r5-own-status-speaks"), on main,
  re-vendored 2026-09-23. It carries R5 as revised: a started node answers for its own
  work, so started debt over a backlog child reads amber instead of falling through to
  blue. Loupe's own `descent.test.ts` passes at that commit, 34 tests.
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

then update the commit line above, and re-apply the hand edits below. Nothing
needs restoring: `--emptyOutDir` empties `loupe/`, and this file is not in it.

## Hand edits that are no longer here, 2026-09-20 to 2026-09-23

Two changes were once made by hand in the built bundle, and this file said a rebuild
would erase them. **They are gone, and they were already gone before the re-vendor of
2026-09-23.** The bundle vendored at a971926 carries the same inline `#e8bd52` stroke
this file says was replaced, so the loss happened at that refresh and nobody noticed
for a day: exactly the silent loss the warning predicted, with the warning itself left
standing as though it had worked.

They are kept below as a record of what was wanted and where it belongs, which is
Loupe's own source. Neither is in Loupe at `180f450`: `web/src/strand.ts` still writes
the hex inline. Do not re-apply them here. A hand edit in a build output is a change
with no home, and this section is what one costs.

1. **The field opens expanded.** The `O` flag that tracks the expanded state starts
   true rather than false. The collapse control is untouched, so a reader can still
   fold it.
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

Both belong in Loupe's own source, and are docketed there.

The Thread tab drives it through the URL: `?embed=1` for the bare shell,
`?lens=thread|descent` for which view, `?ids=` for the card's own ids, and
`?title=` for the card's name in the rail header.
