FROM postgres:17

# Install dependencies and TimescaleDB
RUN apt-get update && apt-get install -y --no-install-recommends \
    gnupg \
    curl \
    ca-certificates \
    lsb-release \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://packagecloud.io/timescale/timescaledb/gpgkey | gpg --dearmor -o /etc/apt/keyrings/timescaledb.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/timescaledb.gpg] https://packagecloud.io/timescale/timescaledb/debian/ bullseye main" > /etc/apt/sources.list.d/timescaledb.list \
    && apt-get update \
    && apt-get install -y timescaledb-postgresql-17 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure TimescaleDB
RUN echo "shared_preload_libraries = 'timescaledb'" >> /usr/share/postgresql/postgresql.conf.sample
