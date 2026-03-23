#!/bin/sh

# Generate .htpasswd from environment variables at container start
AUTH_USER="${AUTH_USER:-saransh}"
AUTH_PASS="${AUTH_PASS:-invoice2024}"

htpasswd -cb /etc/nginx/.htpasswd "$AUTH_USER" "$AUTH_PASS"

# Start nginx
nginx -g "daemon off;"
