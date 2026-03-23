FROM nginx:alpine

# Install apache2-utils for htpasswd
RUN apk add --no-cache apache2-utils

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy app files
COPY index.html style.css app.js /usr/share/nginx/html/

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
