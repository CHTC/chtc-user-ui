# CHTC User UI

# Development

Run the command below and navigate to http://localhost:4000.

```shell
docker compose up
```

This will forward the traffic for the UI and the API through the same host. You will also need to serve the website via
`pnpm run dev` as described below which will be proxied by the docker container.

You might have to enable host networking depending...

## PNPM

[Install pnpm](https://pnpm.io/installation) and run `pnpm install` (only need to do it once).

Run `pnpm run dev`.

This will be the fastest if you aren't on linux.
