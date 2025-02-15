import time

# Simulazione di dati di input
tag_tables = [
    {"name": "table1"},
    {"name": "table2"}
]

global_context = {
    "table1": [{"address": "A1", "name": "Tag1"}, {"address": "A2", "name": "Tag2"}, {"address": "A1", "name": "Tag3"}],
    "table2": [{"address": "A1", "name": "Tag1"}, {"address": "A3", "name": "Tag4"}, {"address": "A2", "name": "Tag2"}],
}

# Funzione originale con JSON.stringify
def method_json_stringify(tag_tables, global_context):
    complete_vartable = []
    for table in tag_tables:
        tags = global_context.get(table["name"], [])
        vartable = [{"addr": tag["address"], "name": tag["name"]} for tag in tags]
        complete_vartable = list({str(item): item for item in complete_vartable + vartable}.values())
    return complete_vartable

# Funzione con Map e chiave addr-name
def method_map_key(tag_tables, global_context):
    complete_vartable = []
    for table in tag_tables:
        tags = global_context.get(table["name"], [])
        vartable = [{"addr": tag["address"], "name": tag["name"]} for tag in tags]
        complete_vartable = list({f"{item['addr']}-{item['name']}": item for item in complete_vartable + vartable}.values())
    return complete_vartable

# Funzione con Map e Set per raggruppare i nomi per indirizzo
def method_map_set(tag_tables, global_context):
    complete_vartable = {}
    for table in tag_tables:
        tags = global_context.get(table["name"], [])
        for tag in tags:
            if tag["address"] not in complete_vartable:
                complete_vartable[tag["address"]] = {"addr": tag["address"], "names": set()}
            complete_vartable[tag["address"]]["names"].add(tag["name"])
    return [{"addr": addr, "names": list(data["names"])} for addr, data in complete_vartable.items()]

# Test di performance
iterations = 10000

start_time = time.time()
for _ in range(iterations):
    method_json_stringify(tag_tables, global_context)
time_json = time.time() - start_time

start_time = time.time()
for _ in range(iterations):
    method_map_key(tag_tables, global_context)
time_map_key = time.time() - start_time

start_time = time.time()
for _ in range(iterations):
    method_map_set(tag_tables, global_context)
time_map_set = time.time() - start_time

# Risultati
performance_results = {
    "JSON Stringify": time_json,
    "Map Key": time_map_key,
    "Map Set (Grouped Names)": time_map_set
}

import pandas as pd
import ace_tools as tools

df_results = pd.DataFrame(list(performance_results.items()), columns=["Method", "Execution Time (s)"])
tools.display_dataframe_to_user(name="Performance Comparison", dataframe=df_results)
