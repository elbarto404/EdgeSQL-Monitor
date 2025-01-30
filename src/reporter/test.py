import subprocess
import logging

logging.basicConfig(level=logging.DEBUG)

tex_file = "temp/report.tex"
# tex_file = r"C:\Users\matteo.bartoli\OneDrive - grupposet.it\04222-Industrial Edge Project\Software_beta\EdgeSQL-Monitor\src\reporter\temp\report.tex"
OUTPUT_PDF = "reports"
pdf_name = "grafana_dashboard"

# Run pdflatex to generate the PDF

logging.debug(f"Running pdflatex to generate PDF from {tex_file}")
result = subprocess.run(
    [
        "pdflatex",
        "-interaction=nonstopmode",
        "-file-line-error",
        f"-output-directory={OUTPUT_PDF}",
        f"-jobname={pdf_name}",
        tex_file,
    ],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,  # Ensures the output is in string format
    check=True,
)
logging.debug(f"Running pdflatex to generate PDF from {tex_file} - 2")
result = subprocess.run(
    [
        "pdflatex",
        "-interaction=nonstopmode",
        "-file-line-error",
        f"-output-directory={OUTPUT_PDF}",
        f"-jobname={pdf_name}",
        tex_file,
    ],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,  # Ensures the output is in string format
    check=True,
)
logging.debug("PDF generation complete")

