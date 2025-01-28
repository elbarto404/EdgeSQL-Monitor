import os
import json
import subprocess
import logging

# Configurations
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [%(levelname)s] %(message)s")

def format_time_range(milliseconds):
    # Convertire millisecondi in secondi
    seconds = milliseconds / 1000
    
    # Calcolo delle unità di tempo
    minute = 60
    hour = minute * 60
    day = hour * 24
    week = day * 7
    month = day * 30  # Approssimazione di un mese
    year = month * 12

    # Determinare il time range
    if seconds >= year:
        return f"{int(seconds // year)}Y"
    elif seconds >= month:
        return f"{int(seconds // month)}M"
    elif seconds >= week:
        return f"{int(seconds // week)}W"
    elif seconds >= day:
        return f"{int(seconds // day)}D"
    elif seconds >= hour:
        return f"{int(seconds // hour)}H"
    elif seconds >= minute:
        return f"{int(seconds // minute)}m"
    else:
        return f"{int(seconds)}s"
    
def get_panel_filename(working_dir, panel):
    posX = f"0000{panel['gridPos']['x']}"[-4:]
    posY = f"0000{panel['gridPos']['y']}"[-4:]
    return os.path.join(f"{working_dir}/images", f"panel_{posY}-{posX}.png")

def generate_tex(working_dir, latex_content, dashboard, config):
    print(f"Config: {config}")

    # Replace placeholders in the template
    orientation = config.get('var-orient', 'landscape')
    print(f"orientation: {orientation}. type {type(orientation)}")
    if orientation == 'landscape':
        xf = 30
        yf = 17
        maxy = 470
    else:
        xf = 20
        yf = 11
        maxy = 720

    discardID = config.get('discardID', '')
    discardID = list(map(int, discardID.split())) if discardID else []
    print(f"discardID: {discardID}. type {type(discardID)}")

    title = config.get('title', config.get('var-title', dashboard['dashboard']['title']))
    print(f"title: {title}. type {type(title)}")

    subtitle = config.get('subtitle', config.get('var-subtitle', '') )
    if not title == dashboard['dashboard']['title'] and subtitle == '':
        subtitle = dashboard['dashboard']['title']
    print(f"subtitle: {subtitle}. type {type(subtitle)}")

    from_date = config.get('var-from_text', config.get('from', 'None'))
    print(f"from_date: {from_date}. type {type(from_date)}")

    to_date = config.get('var-to_text', config.get('to', 'None'))
    print(f"to_date: {to_date}. type {type(to_date)}")

    interval = int(config.get('var-interval_ms', '0'))
    if interval:
        interval = format_time_range(interval)
    else:
        interval = 'None'
    print(f"interval: {interval}. type {type(interval)}")

    time_range = int(config.get('var-time_range', '0'))
    if time_range:
        time_range = format_time_range(int(time_range))
    else:
        time_range = 'None'
    print(f"time_range: {time_range}. type {type(time_range)}")

    f1 = config.get('f1', '')
    f2 = config.get('f2', '')
    f3 = config.get('f3', '')
    f4 = config.get('f4', '')
    f5 = config.get('f5', '')
    f6 = config.get('f6', '')
    print(f1,f2,f3,f4,f5,f6)

    latex_content = latex_content.replace("{{title}}", title)
    latex_content = latex_content.replace("{{subtitle}}", subtitle)
    latex_content = latex_content.replace("{{from_date}}", from_date)
    latex_content = latex_content.replace("{{to_date}}", to_date)
    latex_content = latex_content.replace("{{time_range}}", time_range)
    latex_content = latex_content.replace("{{interval}}", interval)
    latex_content = latex_content.replace("{{f1}}", f1)
    latex_content = latex_content.replace("{{f2}}", f2)
    latex_content = latex_content.replace("{{f3}}", f3)
    latex_content = latex_content.replace("{{f4}}", f4)
    latex_content = latex_content.replace("{{f5}}", f5)
    latex_content = latex_content.replace("{{f6}}", f6)

    # Generate the LaTeX code for the main document
    document = "\\begin{document}\n\\setlength{\\unitlength}{1pt}\n\n"
    starty = 0
    ipc = 0

    for panel in dashboard['dashboard']['panels']:
        if panel['id'] not in discardID:
            if panel['type'] == 'row' and not panel['collapsed']:
                starty = panel['gridPos']['y']
                # End current picture and start a new page if necessary
                document += "\\end{picture}\n\n" if starty > 0 else ""
                document += "\\newpage\n\n" if ipc > 0 else ""
                ipc = 0
                # Add a chapter for the row title
                document += "\\makebox[0pt][l]{\\rule{0pt}{1pt}}\n"
                document += f"\\section{{{panel['title']}}}\n\n"
                document += "\\begin{picture}(0,0)(-20,-15)\n"
            else:
                img = get_panel_filename(working_dir, panel)
                if os.path.exists(img):
                    # Calculate position and dimensions
                    posx = panel['gridPos']['x'] * xf
                    posy = (panel['gridPos']['y'] + panel['gridPos']['h'] - starty) * yf

                    if posy > maxy:  # Start a new page if y position exceeds max
                        document += "\\end{picture}\n\n"
                        document += "\\newpage\n\n"
                        ipc = 0
                        starty = panel['gridPos']['y']
                        posy = panel['gridPos']['h'] * yf
                        document += "\\begin{picture}(0,0)(-10,0)\n"

                    width = panel['gridPos']['w'] * xf
                    height = panel['gridPos']['h'] * yf

                    # Add the image at the calculated position
                    document += (
                        f"\\put({posx},-{posy}){{\\includegraphics[width={width}pt,height={height}pt]{{"
                        f"{str(img).replace('\\', '/')}}}}}\n"
                    )
                    ipc += 1

    # End the final picture and close the document
    document += "\\end{picture}\n\n"
    document += "\\end{document}\n"

    # Replace DOCUMENT placeholder in the template
    latex_content = latex_content.replace("{{DOCUMENT}}", document)
    
    # Save the LaTeX file
    tex_file = f"{working_dir}/report.tex"
    try:
        with open(tex_file, "w") as f:
            f.write(latex_content)
    except Exception as e:
        logging.error(f"Error writing LaTeX file: {e}")
        return None
    
    return tex_file


def generate_pdf(working_dir, output_dir, template_file, config):
    """
    Generate a PDF from rendered PNG images using a LaTeX template.
    """
    # List PNG files in the output directory
    print(f"{working_dir} type {type(working_dir)}")
    images = sorted([f for f in os.listdir(f"{working_dir}/images") if f.endswith(".png")])

    if not images:
        logging.error(f"No PNG images found in the output directory: {working_dir}/images")
        return

    logging.debug(f"Found images for PDF generation: {images}")

    # Read LaTeX template
    try:
        with open(template_file, "r") as template:
            latex_content = template.read()
    except FileNotFoundError:
        logging.error(f"Template file not found: {template_file}")
        return
    
    # Read dashboard
    try:
        with open(os.path.join(working_dir, 'dashboard.json'), "r") as dashfile:
            dashboard = json.load(dashfile)
    except FileNotFoundError:
        logging.error(f"dashboard.json not found in {working_dir}")
        return
    
    # Generate LaTeX code
    tex_path = generate_tex(working_dir, latex_content, dashboard, config)
    if not tex_path:
        return
    
    # Extract Dashboard name
    pdf_name = dashboard["meta"]["slug"]

    # Run pdflatex to generate the PDF
    try:
        logging.debug(f"Running pdflatex to generate PDF from {tex_path}")
        result = subprocess.run(
            [
                "pdflatex",
                "-interaction=nonstopmode",
                "-file-line-error",
                f"-output-directory={output_dir}",
                f"-jobname={pdf_name}",
                tex_path,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True, 
            check=True,
        )
        logging.debug(f"Running pdflatex to generate PDF from {tex_path}\nSecond Run")
        result = subprocess.run(
            [
                "pdflatex",
                "-interaction=nonstopmode",
                "-file-line-error",
                f"-output-directory={output_dir}",
                f"-jobname={pdf_name}",
                tex_path,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True, 
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
        return

    return os.path.join(output_dir, f"{pdf_name}.pdf")


if __name__ == "__main__":
    WORKING_DIR = "temp"
    OUTPUT_DIR = "reports"
    LATEX_TEMPLATE = "templates/report_template.tex"
    CONFIG = dict(
        [('dashboardUID', 'reversyover1'), ('apitoken', 'glsa_y03J0NCnlAGUkCObzu94iX63vJ6ldVfX_6dc86681'), ('from', 'now-7d'), ('to', 'now'), ('timezone', 'browser'), ('var-endpoint', 'Reversy_S7_SIM1'), ('var-endpoint_id', '18'), ('var-tag_table', 'tags_odr_reversy_s7'), ('var-data_table', 'data_odr_reversy_s7'), ('var-lables', 'air'), ('var-time_range', '604800'), ('var-aggregation', 'Interval'), ('var-interval_text', '3h'), ('var-interval_ms', '10800000'), ('var-title', 'Flex Reversy 1')]
    )
    generate_pdf(WORKING_DIR, OUTPUT_DIR, LATEX_TEMPLATE, CONFIG)

