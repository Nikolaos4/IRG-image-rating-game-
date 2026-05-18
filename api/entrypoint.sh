#!/bin/sh
set -e

echo "Running DB migrations..."
npm run db:migrate
npm run db:seed

echo "Starting app..."
exec "$@"