#!/bin/sh
set -e

# Railway injects $PORT at runtime. We substitute ONLY ${PORT} into the
# nginx template — leaving nginx's own variables ($uri, $host, etc.) untouched.
PORT=${PORT:-80}

envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template \
                  > /etc/nginx/conf.d/default.conf

echo "nginx: listening on port $PORT"

exec "$@"
