# Custom Postgres with pg_uuidv7 extension
FROM postgres:16

# Install build dependencies and server dev headers
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    ca-certificates \
    postgresql-server-dev-16 \
 && rm -rf /var/lib/apt/lists/*

# Build and install pg_uuidv7 extension from source
RUN git clone --depth 1 https://github.com/fboulnois/pg_uuidv7 /tmp/pg_uuidv7 \
 && cd /tmp/pg_uuidv7 \
 && make \
 && make install \
 && cd / \
 && rm -rf /tmp/pg_uuidv7

# The extension can be enabled per-database with:
#   CREATE EXTENSION IF NOT EXISTS pg_uuidv7;
# Your migrations will handle this.
