import pandas as pd

def generate_js_initialization(csv_file_path, output_file_path):
    # Load the CSV file
    df = pd.read_csv(csv_file_path, encoding='latin1', delimiter=';')
    
    # Prepare JavaScript initialization code
    js_code = "// JavaScript code to initialize variables from CSV\n"
    js_code += "// Assuming functions getRandomInt, getRandomFloat, getGaussianRandom are already available\n\n"
    js_code += "const initialValues = {\n"

    # Loop through the variables and generate the initialization code
    for _, row in df.iterrows():
        var_name = row['name']
        comment = row['comment'] if 'comment' in row else ''
        js_code += f"    {var_name}:\t\tgetGaussianRandom(100*0.9, 100*1.1]), // {comment}\n"

    js_code += "};\n\nconsole.log(\"Initialized Variables:\", initialValues);"

    # Write the generated code to a text file
    with open(output_file_path, "w") as file:
        file.write(js_code)

    print(f"JavaScript initialization code has been saved to: {output_file_path}")

if __name__ == "__main__":
    generate_js_initialization(
        r"C:\Users\matteo.bartoli\OneDrive - grupposet.it\04222-Industrial Edge Project\Software_beta\EdgeSQL-Monitor\src\database\convert2csv\flex_reversy_coal.csv", 
        r"src\nodered\node_scripts\simulation\javascript_initialization.js")
