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
- Commit: a971926 ("The card lens"), on branch feat/descent-view
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

## Hand edits in this vendored copy, 2026-09-20

Two changes were made here by hand, in the built bundle, and **a rebuild by the
command above will erase them.** They are written down because a silent loss is the
likeliest way this goes wrong.

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

Both belong in Loupe's own source, and are docketed there. Until that lands, a
refresh of this directory has to re-apply them.

The Thread tab drives it through the URL: `?embed=1` for the bare shell,
`?lens=thread|descent` for which view, `?ids=` for the card's own ids, and
`?title=` for the card's name in the rail header.
