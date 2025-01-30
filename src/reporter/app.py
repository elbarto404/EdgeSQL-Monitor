import os
import io
import json
import argparse
import requests 
from flask import Flask, request, send_file, jsonify 
from concurrent.futures import ThreadPoolExecutor
import logging
from time import sleep
import traceback

from generate_pdf import generate_pdf

app = Flask(__name__)

# Configurations
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(message)s")

# Command-line arguments setup
parser = argparse.ArgumentParser(description="Generate and render Grafana reports.")
parser.add_argument("--grafana-url", type=str, default="http://grafana:3000", help="URL of the Grafana server (default: http://grafana:3000)")
parser.add_argument("--render", action="store_true", help="Flag to enable image rendering")
parser.add_argument("--generate", action="store_true", help="Flag to enable report generation")
parser.add_argument("--xfactor", type=int, default=80, help="Value for the x-factor (default: 80)")
parser.add_argument("--yfactor", type=int, default=45, help="Value for the y-factor (default: 45)")
parser.add_argument("--template", type=str, default="report_template.tex", help="Latex template file name (report_template.tex)")

args = parser.parse_args()

GRAFANA_URL = args.grafana_url.strip()
RENDER_URL = f"{GRAFANA_URL}/render/d-solo"
WORKING_DIR = "temp" 
OUTPUT_DIR = "reports"
TEX_NAME = "report.tex"
MAX_CONCURRENT_RENDER = 3

os.makedirs(WORKING_DIR, exist_ok=True)
os.makedirs(f"{WORKING_DIR}/images", exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

render_flag = args.render
generate_flag = args.generate
xfactor = args.xfactor
yfactor = args.yfactor
latex_template = f"templates/{args.template}"

params = {
    "panelId": 0,
    "orgId": 1,
    "width": 500,
    "height": 1000,
    "theme": "light"
}


def remove_all_files_from_folder_recursive(folder_path):
    try:
        # Check if the folder exists
        if not os.path.exists(folder_path):
            logging.warning(f"The folder '{folder_path}' does not exist.")
            return

        # Walk through the folder and its subfolders
        for root, _, files in os.walk(folder_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                try:
                    os.remove(file_path)  # Remove the file
                    logging.info(f"Removed: {file_path}")
                except Exception as e:
                    logging.error(f"Failed to remove {file_path}: {e}")

        logging.info("All files removed successfully.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")

def get_panel_filename(panel):
    posX = f"0000{panel['gridPos']['x']}"[-4:]
    posY = f"0000{panel['gridPos']['y']}"[-4:]
    return os.path.join(f"{WORKING_DIR}/images", f"panel_{posY}-{posX}.png")

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
    params['width']   = xfactor * panel['gridPos']['w']
    params['height']  = yfactor * panel['gridPos']['h']

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
    failed_panels = []
    images_count = 0

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
                    images_count += 1
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
                images_count += 1
            else:
                logging.error(f"Final failure for panel {panel['id']} after retries.")

    logging.info(f"Rendering complete. Total panels rendered: {images_count}")
    return 

# C:\Users\matteo.bartoli\AppData\Local\MiKTeX

@app.route("/generate_report", methods=["GET"])
def generate_report():
    global pdf_name, params
    try:
        logging.info(f"Received request with params: {request.args}")

        remove_all_files_from_folder_recursive(WORKING_DIR) if render_flag else None

        # Parse parameters from the query string
        query_params = request.args.to_dict()
        dashboard_uid = query_params.pop("dashboardUID", None)
        api_token = query_params.pop("apitoken", None)
        params.update(query_params)
        
        if not dashboard_uid or not api_token:
            logging.error("Missing dashboardUID or apitoken in the request")
            return jsonify({"error": "Both 'dashboardUID' and 'apitoken' are required"}), 400

        logging.info(f"Generating report for dashboard UID: {dashboard_uid}")
        dashboard = fetch_dashboard(dashboard_uid, api_token)
        with open(os.path.join(WORKING_DIR, 'dashboard.json'), 'w') as out:
            json.dump(dashboard, out, indent=2)

        logging.info(f"Requested Dashboard RAW: {dashboard}")
        panels = []
        for panel in dashboard["dashboard"]["panels"]:
            if panel['type'] == 'row':
                logging.debug(f"Skip Panel: {panel}")
                continue
            panels.append(panel)
        dashboard_slug = dashboard["meta"]["slug"]

        render_dashboard_panels(panels, dashboard_uid, dashboard_slug, api_token, params) if render_flag else None

        pdf_path = generate_pdf(WORKING_DIR, OUTPUT_DIR, latex_template, params) if generate_flag else None
        if not pdf_path:
            return jsonify({"test": 'ok'}), 500
        
        logging.info(f"Report pdf generated. Path: {pdf_path}")

        with open(pdf_path, "rb") as pdf_file:
            pdf_content = io.BytesIO(pdf_file.read())
            pdf_content.seek(0)

        logging.info(f"File read successfully")

        # Return the PDF file as a response
        return send_file(
            pdf_content,
            as_attachment=False,  # Force download if True, inline preview if False
            download_name=f"{dashboard['meta']['provisionedExternalId'].replace(".json", "")}.pdf",  # Name for the downloaded file
            mimetype='application/pdf'
        )
        
    except Exception as e:
        traceback.print_exc()
        logging.error(f"Error generating report: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    logging.info("Starting the Flask server")
    app.run(host="0.0.0.0", port=8088)
