# BUILD as edge-prometheus:x.x.x
# docker build -t edge-prometheus:0.0.1

# Use the official Prometheus image as the base
FROM prom/prometheus:v2.54.1


# Copy all custom configuration and data.
# Search on running container files using docker extension

COPY prometheus.yml /etc/prometheus/prometheus.yml


# Expose Prometheus default port
EXPOSE 9090

# The entrypoint and command are inherited from the base image
