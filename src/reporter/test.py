import subprocess
import logging

logging.basicConfig(level=logging.DEBUG)

tex_file = "templates/test_page.tex"
OUTPUT_PDF = "reports"
pdf_name = "grafana_dashboard"

# Run pdflatex to generate the PDF
try:
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
    logging.debug(f"pdflatex stdout:\n{result.stdout}")
    logging.debug(f"pdflatex stderr:\n{result.stderr}")
except subprocess.CalledProcessError as e:
    logging.error(f"pdflatex failed with error: {e}")
    logging.error(f"Command output:\n{e.output}")
except Exception as e:
    logging.error(f"Unexpected error during PDF generation: {e}")

