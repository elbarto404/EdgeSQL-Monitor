FROM python:3.10-slim

# Installa dipendenze essenziali
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-pictures \
    ghostscript \
    wget \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Aggiungi i file dell'applicazione
WORKDIR /app
COPY app.py requirements.txt templates/ ./

# Installa le librerie Python
RUN pip install --no-cache-dir -r requirements.txt

# Espone la porta 8088
EXPOSE 8088

# Avvia l'applicazione
CMD ["python", "app.py"]
