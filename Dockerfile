# Container image for serving the static Redis Web site via Nginx
FROM nginx:1.27-alpine

# Remove default site content and add project assets
RUN rm -rf /usr/share/nginx/html/*
COPY index.html /usr/share/nginx/html/index.html
COPY assets /usr/share/nginx/html/assets
COPY scripts /usr/share/nginx/html/scripts
COPY styles /usr/share/nginx/html/styles

# Provide a sensible default Nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
