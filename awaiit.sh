#!/bin/sh

HOST="$1"
shift

echo "waiting for $HOST:5432 to be ready..."

while ! nc -z "HOST" 5432; do
	echo "Waiting for postgres at $HOST:5432...."
	sleep 1
done

exec "$@"
