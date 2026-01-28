FROM nginx:1.29.4-alpine-slim

ADD ./nginx.conf /etc/nginx/templates/nginx.conf.template
