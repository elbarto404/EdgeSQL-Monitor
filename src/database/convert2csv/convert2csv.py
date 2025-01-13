# Python program to convert a text file containing data definitions into a CSV file
# The user can specify the CSV separator

import pandas as pd

def convert_text_to_csv(input_file_path, output_file_path, separator=','):
    """
    Converts a text file containing data definitions into a CSV file.

    Parameters:
    - input_file_path (str): Path to the input text file.
    - output_file_path (str): Path to save the CSV file.
    - separator (str): CSV separator (default is comma ',').
    """
    csv_data = []

    # Reading the input file
    with open(input_file_path, 'r') as file:
        lines = file.readlines()

    # Parsing each line
    count = 0
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            parts = line.split(":")
            name = parts[0].replace("ODR_", "").strip()  # Remove the "ODR_" prefix
            print(parts[1])
            data_type, comment = parts[1].split("//")
            data_type = data_type.replace(";", "").strip()
            data_type = "Real"
            enabled = True
            label = None
            address = f"DB121,R{count}"
            access = "Read"
            csv_data.append([enabled, name, label, data_type, address, access, comment.strip()])

        except (IndexError, ValueError) as e:
            print(f"Skipping invalid line: {line} ({e})")

        count += 4  # Incrementing the byte offset

    # Creating a Pandas DataFrame
    print(f"Creating DataFrame with {len(csv_data)} rows")
    print(csv_data)
    df = pd.DataFrame(csv_data, columns=["enabled", "name", "label", "data_type", "address", "access", "comment"])

    # Saving the DataFrame to a CSV file
    df.to_csv(output_file_path, index=False, sep=separator)
    print(f"CSV file saved to {output_file_path}")

# Example usage
if __name__ == "__main__":
    input_file = r"src/database/convert2csv/data_source.txt"
    output_file = r"src/database/convert2csv/data_source.csv"
    separator_choice = ';'  # You can change this to ',' or '\t' for tab
    convert_text_to_csv(input_file, output_file, separator_choice)
