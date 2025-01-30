import os
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def extract_and_save_scripts(input_folder, output_master_folder):
    input_file = os.path.join(input_folder, "flows.json")
    
    if not os.path.exists(input_file):
        logging.error(f"Error: The file {input_file} does not exist.")
        return
    
    with open(input_file, "r", encoding="utf-8") as f:
        try:
            flows = json.load(f)
        except json.JSONDecodeError:
            logging.error("Error reading the JSON file.")
            return
    
    total_nodes = 0
    saved_files = 0
    
    for node in flows:
        if "type" in node and "z" in node and "name" in node:
            logging.debug(f"Processing node: {node['name']} (Type: {node['type']})")
            total_nodes += 1
            
            node_type = node["type"]
            node_name = node["name"].replace("/", "_").replace("\\", "_")
            node_z = node["z"].replace("subflow:", "")
            
            scripts = {}
            
            if node_type == "function" and "func" in node and node["func"].strip():
                scripts[f"{node_name}.js"] = node["func"]
            if node_type == "function" and "initialize" in node and node["initialize"].strip():
                scripts[f"{node_name}_init.js"] = node["initialize"]
            if node_type == "function" and "finalize" in node and node["finalize"].strip():
                scripts[f"{node_name}_end.js"] = node["finalize"]
            if node_type == "ui-template" and "format" in node and node["format"].strip():
                scripts[f"{node_name}.html"] = node["format"]
            
            if scripts:
                output_folder = os.path.join(output_master_folder, node_z)
                os.makedirs(output_folder, exist_ok=True)
                
                for filename, content in scripts.items():
                    output_file = os.path.join(output_folder, filename)
                    with open(output_file, "w", encoding="utf-8") as out_f:
                        out_f.write(content)
                    
                    logging.info(f"Saved: {output_file}")
                    saved_files += 1
    
    logging.debug(f"End of script execution. Metrics:")
    logging.info(f"Total nodes processed: {total_nodes}")
    logging.info(f"Total files saved: {saved_files}")

if __name__ == "__main__":
    input_folder = r"C:\Users\matteo.bartoli\OneDrive - grupposet.it\04222-Industrial Edge Project\Software_beta\EdgeSQL-Monitor\docker_images\nodered\nodered_data"
    output_master_folder = r"C:\Users\matteo.bartoli\OneDrive - grupposet.it\04222-Industrial Edge Project\Software_beta\EdgeSQL-Monitor\src\nodered\master\app"
    extract_and_save_scripts(input_folder, output_master_folder)
