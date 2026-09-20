# Vendored Loupe viewer bundle

Static build of the Loupe viewer, served by the daemon at `/loupe/` and framed
by the card pane's Thread tab. It is a prebuilt artifact, not source: edit it in
the loupe repo and rebuild, never here.

- Source: https://github.com/rdryfoos/loupe, `packages/viz`
- Commit: bd8c83e ("Corrected settled sample: 25/25 cited paths resolve")
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

then restore this file, which the build's --emptyOutDir removes.
