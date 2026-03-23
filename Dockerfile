FROM nginx:alpine

# Install apache2-utils for htpasswd
RUN apk add --no-cache apache2-utils

# Set default credentials (override via environment variables in Coolify)
ARG AUTH_USER=saransh
ARG AUTH_PASS=invoice2024

# Generate htpasswd file
RUN htpasswd -cb /etc/nginx/.htpasswd ${AUTH_USER} ${AUTH_PASS}

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy app files
COPY index.html style.css app.js /usr/share/nginx/html/

EXPOSE 80
