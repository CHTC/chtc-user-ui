# CHTC User UI

# Development

Run the command below and navigate to http://localhost:4000.

```shell
docker compose up
```

This will forward the traffic for the UI and the API through the same host. You will also need to serve the website via
`pnpm run dev` as described below which will be proxied by the docker container.

`/api/` goes to a local API on port 1111. Start it from chtc-user-app-api with its own database (see that repo's
README, "Local development database"). Nginx logs you in as that database's admin user 4 with a token signed with the
dev `SECRET_KEY` (`local-dev-only`), so no `.env` is needed. If your `.env` sets `SECRET_KEY`, it overrides the dev key
and must match the API's.

You might have to enable host networking depending...

## PNPM

[Install pnpm](https://pnpm.io/installation) and run `pnpm install` (only need to do it once).

Run `pnpm run dev`.

This will be the fastest if you aren't on linux.
