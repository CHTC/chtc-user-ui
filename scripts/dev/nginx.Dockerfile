FROM nginx:1.29.4-alpine-slim

ADD ./nginx.conf /etc/nginx/templates/nginx.conf.template
COPY --chmod=755 ./dev-tokens.envsh /docker-entrypoint.d/05-dev-tokens.envsh
