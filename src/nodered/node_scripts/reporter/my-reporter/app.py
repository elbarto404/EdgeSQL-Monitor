import os
import json
import sys
import requests # type: ignore
from flask import Flask, request, jsonify # type: ignore
from concurrent.futures import ThreadPoolExecutor
from subprocess import run
import logging
from time import sleep

app = Flask(__name__)

# Configurazioni
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(message)s")

GRAFANA_URL = sys.argv[1] if len(sys.argv) > 1 else input("Inserisci l'URL del server Grafana (es. http://grafana:3000): ").strip()
RENDER_URL = f"{GRAFANA_URL}/render/d-solo"
POS_LAYOUT = True
LATEX_TEMPLATE = "templates/report_template.tex"
OUTPUT_DIR = "reports"
MAX_CONCURRENT_RENDER = 3

# Assicura che la directory di output esista
os.makedirs(OUTPUT_DIR, exist_ok=True)

def remove_all_files_from_folder(folder_path):
    try:
        # Check if the folder exists
        if not os.path.exists(folder_path):
            logging.warning(f"The folder '{folder_path}' does not exist.")
            return

        # Iterate through the files in the folder
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            
            # Check if it is a file (not a directory)
            if os.path.isfile(file_path):
                os.remove(file_path)  # Remove the file
                logging.info(f"Removed: {file_path}")
            else:
                logging.info(f"Skipping non-file item: {file_path}")

        logging.info("All files removed successfully.")
    except Exception as e:
        logging.info(f"An error occurred: {e}")

def get_panel_filename(panel):
    if POS_LAYOUT:
        posX = f"000{panel['gridPos']['x']}"[-3:]
        posY = f"000{panel['gridPos']['y']}"[-3:]
        return os.path.join(OUTPUT_DIR, f"panel_{posY}-{posX}.png")
    else:
        return os.path.join(OUTPUT_DIR, f"panel_{panel['id']}.png")

def fetch_dashboard(dashboard_uid, api_token):
    logging.debug(f"Fetching dashboard with UID: {dashboard_uid}")
    headers = {"Authorization": f"Bearer {api_token}"}
    response = requests.get(f"{GRAFANA_URL}/api/dashboards/uid/{dashboard_uid}", headers=headers)
    logging.debug(f"Dashboard fetch response status: {response.status_code}")
    response.raise_for_status()
    return response.json()

def render_panel(panel, dashboard_uid, dashboard_slug, output_file, api_token, params):
    logging.debug(f"Rendering panel {panel['id']} from dashboard {dashboard_uid}")

    params['panelId'] = panel['id']
    params['height']  = 40 * panel['gridPos']['h']
    params['width']   = 60 * panel['gridPos']['w']

    # Construct the URL with the parameters
    query_string = "&".join(f"{key}={value}" for key, value in params.items() if value != "")
    url = f"{RENDER_URL}/{dashboard_uid}/{dashboard_slug}?{query_string}&kiosk"
    
    headers = {"Authorization": f"Bearer {api_token}"}
    
    # Log the final URL and headers
    logging.info(f"Request URL: {url}")
    logging.info(f"Headers: {headers}")
    
    # Make the GET request
    response = requests.get(url, headers=headers, stream=True)
    
    # Log the response status and preview
    logging.debug(f"Panel render response status: {response.status_code}")
    logging.debug(f"Content length: {len(response.content)}")

    # Raise an exception for bad HTTP status codes
    response.raise_for_status()
    
    # Write the response content to the output file
    with open(output_file, "wb") as f:
        f.write(response.content)
    
    logging.debug(f"Panel {panel['id']} saved to {output_file}")

def render_with_retry(panel, dashboard_uid, dashboard_slug, output_file, api_token, params, max_retries=2):
    """
    Attempt to render a panel with retries on failure.
    """
    attempt = 0
    while attempt <= max_retries:
        try:
            render_panel(panel, dashboard_uid, dashboard_slug, output_file, api_token, params)
            return True  # Render succeeded
        except Exception as e:
            attempt += 1
            logging.warning(f"Retrying render for panel {panel['id']} (Attempt {attempt}/{max_retries})")
            sleep(5)  # Optional delay between retries
    logging.error(f"Panel {panel['id']} failed to render after {max_retries} retries.")
    return False

def render_dashboard_panels(panels, dashboard_uid, dashboard_slug, api_token, params):
    """
    Render all panels in a dashboard with retry mechanism for failures.
    """
    images = []
    failed_panels = []

    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_RENDER) as executor:
        future_to_panel = {
            executor.submit(
                render_with_retry,
                panel,
                dashboard_uid,
                dashboard_slug,
                get_panel_filename(panel),
                api_token,
                params
            ): panel
            for panel in panels
        }

        for future in future_to_panel:
            panel = future_to_panel[future]
            try:
                success = future.result()
                if success:
                    images.append(os.path.join(OUTPUT_DIR, f"panel_{panel['id']}.png"))
                else:
                    failed_panels.append(panel)
            except Exception as e:
                logging.error(f"Unhandled exception for panel {panel['id']}: {e}")
                failed_panels.append(panel)

    if failed_panels:
        logging.info(f"Retrying failed panels: {[panel['id'] for panel in failed_panels]}")
        for panel in failed_panels:
            output_file = get_panel_filename(panel)
            success = render_with_retry(panel, dashboard_uid, dashboard_slug, output_file, api_token, params)
            if success:
                images.append(output_file)
            else:
                logging.error(f"Final failure for panel {panel['id']} after retries.")

    logging.info(f"Rendering complete. Total panels rendered: {len(images)}")
    return images

def generate_pdf(images, output_pdf):
    logging.debug("Generating PDF from rendered images")
    with open(LATEX_TEMPLATE, "r") as template:
        latex_content = template.read()
    image_includes = "\n".join([f"\\includegraphics[width=\\textwidth]{{{img}}}" for img in images])
    latex_content = latex_content.replace("{{images}}", image_includes)
    tex_file = os.path.join(OUTPUT_DIR, "report.tex")
    with open(tex_file, "w") as f:
        f.write(latex_content)
    logging.debug(f"Running pdflatex to generate PDF at {output_pdf}")
    run(["pdflatex", "-output-directory", OUTPUT_DIR, tex_file], check=True)
    os.rename(os.path.join(OUTPUT_DIR, "report.pdf"), output_pdf)
    logging.debug("PDF generation complete")

@app.route("/generate_report", methods=["GET"])
def generate_report():
    try:
        logging.info(f"Received request with params: {request.args}")
        remove_all_files_from_folder(OUTPUT_DIR)
        # Parse parameters from the query string
        params = {
            "panelId": 0,
            "orgId": 1,
            "width": 500,
            "height": 1000,
            "theme": "light"
        }
        query_params = request.args.to_dict()
        dashboard_uid = query_params.pop("dashboardUID", None)
        api_token = query_params.pop("apitoken", None)
        params.update(query_params)
        
        if not dashboard_uid or not api_token:
            logging.error("Missing dashboardUID or apitoken in the request")
            return jsonify({"error": "Both 'dashboardUID' and 'apitoken' are required"}), 400

        logging.info(f"Generating report for dashboard UID: {dashboard_uid}")
        dashboard = fetch_dashboard(dashboard_uid, api_token)

        logging.info(f"Requested Dashboard RAW: {dashboard}")
        panels = dashboard["dashboard"]["panels"]
        dashboard_slug = dashboard["meta"]["slug"]
        images = render_dashboard_panels(panels, dashboard_uid, dashboard_slug, api_token, params)

        output_pdf = os.path.join(OUTPUT_DIR, "report.pdf")
        generate_pdf(images, output_pdf)
        return jsonify({"message": "Report generated", "pdf": output_pdf}), 200
    
    except Exception as e:
        logging.error(f"Error generating report: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    logging.info("Starting the Flask server")
    app.run(host="0.0.0.0", port=8088)
