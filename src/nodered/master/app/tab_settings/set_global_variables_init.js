// Function node script to initialize global variables as column-based arrays

const tz = "Europe/Rome";

// Data from the table
const protocol = [
    "S7",
    "ModBus",
    "OPC-UA",
    "MQTT",
    "HTTP",
    "Manual"
];
const data_type = {
    "Bool": "BOOLEAN",
    "Byte": "SMALLINT",
    "Char": "CHAR(1)",
    "Word": "SMALLINT",
    "DWord": "INTEGER",
    "LWord": "BIGINT",
    "SInt": "SMALLINT",
    "USInt": "SMALLINT",
    "Int": "SMALLINT",
    "UInt": "INTEGER",
    "DInt": "INTEGER",
    "UDInt": "BIGINT",
    "LInt": "BIGINT",
    "ULInt": "NUMERIC",
    "Real": "REAL",
    "LReal": "DOUBLE PRECISION",
    "Time": "INTERVAL",
    "Date": "DATE",
    "TimeOfDay": "TIME",
    "DateTime": "TIMESTAMP",
    "String": "VARCHAR(254)",
    "WString": "TEXT"
};
const access = [
    "Read",
    "Write",
    "Read/Write"
];
const sampling_mode = [
    "Continous",
    "ContinousOnChange",
    "Trigger",
    "Manual"
];
const sampling_freq = [
    "None",
    "500ms",
    "1s",
    "2s",
    "5s"
];
const aggregations = [
    "None",
    "1m",
    "3m",
    "5m",
    "15m",
    "30m",
    "1h",
    "12h",
    "1g",
    "1w",
    "1M",
    ["1m", "1h"],
    ["1m", "1h", "1g", "1w"],
    ["1m", "1h", "1g", "1w", "1M"]
];
const aggregation_type = [
    "None",
    "Sum",
    "Mean"
];


// Initialize global variables
global.set("tz", tz);
global.set("protocol", protocol);
global.set("data_type", data_type);
global.set("access", access);
global.set("sampling_mode", sampling_mode);
global.set("sampling_freq", sampling_freq);
global.set("aggregations", aggregations);
global.set("aggregation_type", aggregation_type);

node.status({ fill: "blue", shape: "dot", text: "Global variables initialized" });