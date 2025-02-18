# Use the official Python 3.9 slim image as the base image
FROM python:3.9-slim

# Install system dependencies required for building TeX Live
RUN apt-get update && apt-get install -y \
    wget \
    perl \
    xz-utils \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Download and install TeX Live using a minimal (scheme-basic) profile
RUN wget -O /tmp/install-tl-unx.tar.gz \ 
    http://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz && \
    mkdir /tmp/install-tl && \
    tar -xzf /tmp/install-tl-unx.tar.gz -C /tmp/install-tl --strip-components=1 && \
    # Create a minimal profile using scheme-basic
    echo "selected_scheme scheme-basic" > /tmp/texlive.profile && \
    echo "TEXDIR /usr/local/texlive/2024" >> /tmp/texlive.profile && \
    echo "TEXMFCONFIG ~/.texlive2024/texmf-config" >> /tmp/texlive.profile && \
    echo "TEXMFHOME ~/texmf" >> /tmp/texlive.profile && \
    echo "TEXMFLOCAL /usr/local/texlive/texmf-local" >> /tmp/texlive.profile && \
    echo "TEXMFSYSCONFIG /usr/local/texlive/2024/texmf-config" >> /tmp/texlive.profile && \
    echo "TEXMFSYSVAR /usr/local/texlive/2024/texmf-var" >> /tmp/texlive.profile && \
    /tmp/install-tl/install-tl -profile /tmp/texlive.profile && \
    rm -rf /tmp/install-tl /tmp/install-tl-unx.tar.gz /tmp/texlive.profile

# Add TeX Live binaries to the PATH
ENV PATH="/usr/local/texlive/2024/bin/x86_64-linux:${PATH}"

# Update tlmgr and install the additional required LaTeX packages
RUN tlmgr update --self && \
    tlmgr install roboto xkeyval fontaxes lastpage titlesec

# Install Python dependencies (Flask and requests; others are part of the standard library)
RUN pip install flask requests

# Create and set the working directory for the application
WORKDIR /app

# Copy the Python source files and the templates folder
COPY app.py generate_pdf.py /app/
COPY templates /app/templates

# Create an initially empty 'temp' directory
RUN mkdir /app/temp
RUN mkdir /app/reports

# Expose the port on which the Flask server will run
EXPOSE 8088

# Set the entrypoint to run the application
ENTRYPOINT ["python", "app.py"]
