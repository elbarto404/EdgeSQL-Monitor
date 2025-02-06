// This code rewrite the configuration of all connection tabs in Node-RED:

// ________________________Heplpers___________________________

// Helper function to generate unique IDs
function generateId(existingIds) {
    function randomHex(size) {
        const chars = "0123456789abcdef";
        let id = "";
        for (let i = 0; i < size; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    let id;
    do {
        id = randomHex(16);
    } while (existingIds.includes(id));

    existingIds.push(id);
    return id;
}

// Helper function to convert time to milliseconds
function timeToMilliseconds(timeStr) {
    if (timeStr === undefined || timeStr === null || timeStr === '' || timeStr.toLowerCase() === 'none') {
        return 0;
    }
    // Extract the numeric part and the unit part
    const num = parseFloat(timeStr);
    const unit = timeStr.replace(num, '').trim();

    // Convert based on the unit
    switch(unit) {
        case 'ms':
            return num; // Already in milliseconds
        case 's':
            return num * 1000; // Convert seconds to milliseconds
        case 'm':
            return num * 1000 * 60; // Convert minutes to milliseconds
        case 'h':
            return num * 1000 * 60 * 60; // Convert hours to milliseconds
        case 'd':
            return num * 1000 * 60 * 60 * 24; // Convert days to milliseconds
        default:
            node.error(`Invalid time unit - ${timeStr} - ${num} - ${unit}`);
    }
}

// Helper function to safely parse the endpoint address
function parseEndpointAddress(endpoint, endpointRegex) {
    if (!endpoint || !endpoint.address) {
        node.error(`Invalid endpoint object or missing address.`);
        node.status({ fill: "red", shape: "dot", text: `Invalid endpoint object or missing address` });
        return null;
    }

    // Match the address against the regex pattern
    const match = endpoint.address.match(endpointRegex);
    if (!match) {
        node.error(`Endpoint ${endpoint.name} address is not in the correct format. Expected format: "IP:PORT@RACK:SLOT"`);
        node.status({ fill: "red", shape: "dot", text: `Endpoint ${endpoint.name} address is not in the correct format` });
        return null
    }

    // Extract matched values
    const [, address, port, rack, slot] = match;

    return {
        address,
        port: String(port),
        rack: String(rack),
        slot: String(slot)
    };
}


// ________________________Insert Prototypes___________________________

// Function to generate the status and catch flows
function generateStaticNodes() {
    updatedNodes.push(...[
        {
            "id": "nS_connections",
            "type": "status",
            "z": "tab_connections",
            "name": "",
            "scope": null,
            "x": 120,
            "y": 60,
            "wires": [
                [
                    "loS_connections"
                ]
            ]
        },
        {
            "id": "loS_connections",
            "type": "link out",
            "z": "tab_connections",
            "name": "status_connections",
            "mode": "link",
            "links": [
                "liALL_status"
            ],
            "x": 235,
            "y": 60,
            "wires": []
        },
        {
            "id": "nC_connections",
            "type": "catch",
            "z": "tab_connections",
            "name": "",
            "scope": null,
            "uncaught": false,
            "x": 520,
            "y": 60,
            "wires": [
                [
                    "loC_connections"
                ]
            ]
        },
        {
            "id": "loC_connections",
            "type": "link out",
            "z": "tab_connections",
            "name": "error_connections",
            "mode": "link",
            "links": [
                "liALL_errors"
            ],
            "x": 635,
            "y": 60,
            "wires": []
        }
    ]);
    startY += 150;
}

// Function to generate the nodes for a S7 endpoint with a custom trigger
function generateS7triggered(endpoint, tag_tables) {
    const endpointRegex = /^([\w\-.]+):(\d+)@(\d+):(\d+)$/; // Regex to match the endpoint address
    const S7endpointId = `S7endpoint_e${endpoint.id}`;
    const S7inId = `s7in_e${endpoint.id}`;
    const S7controlId = `s7control_e${endpoint.id}`;
    const S7linkInId = `s7control_e${endpoint.id}_in`;
    const S7linkOutId = `s7control_e${endpoint.id}_out`;
    const endpointNode = updatedNodes.find(node => node.id === S7endpointId);
    if (!endpoint.enabled && endpointNode) {
        updatedNodes = updatedNodes.filter(node => node.id !== S7endpointId);
        deployNeeded = true;
    }
    if (!endpoint.enabled) {
        return;
    }
    if (!tag_tables.length) {
        return;
    }
    const parsedAddress = parseEndpointAddress(endpoint, endpointRegex);
    if (!parsedAddress) {
        return;
    }
    const { address, port, rack, slot } = parsedAddress;
    updatedNodes.push({
        "id": `comment_e${endpoint.id}`,
        "type": "comment",
        "z": "tab_connections",
        "name": `Endpoint ${endpoint.id}: ${endpoint.name} - triggered`,
        "info": `README: https://github.com/st-one-io/node-red-contrib-s7/blob/master/README.md`,
        "x": 220,
        "y": startY,
        "wires": []
    });
    startY += 50;

    // Check if the endpoint node for this endpoint already exists
    if (!endpointNode) {
        deployNeeded = true;
        updatedNodes.push({
            "id": S7endpointId,
            "type": "s7 endpoint",
            "transport": "iso-on-tcp",
            "address": address,
            "port": port,
            "rack": rack,
            "slot": slot,
            "localtsaphi": "01",
            "localtsaplo": "00",
            "remotetsaphi": "01",
            "remotetsaplo": "00",
            "connmode": "rack-slot",
            "adapter": "",
            "busaddr": "2",
            "cycletime": "0",
            "timeout": "5000",
            "name": "",
            "vartable": []
        });
    } else {
        deployNeeded = endpointNode.address !== address || endpointNode.port !== port || endpointNode.rack !== rack || endpointNode.slot !== slot;
        if (deployNeeded) {
            endpointNode.address = address;
            endpointNode.port = port;
            endpointNode.rack = rack;
            endpointNode.slot = slot;
        }
    }

    // Create the data handler flow for each table
    let sf_data_handlerIds = [];
    let dY = startY + 50;
    for (let table of tag_tables) {
        const triggerId = `trigger_e${endpoint.id}_t${table.id}_out`;
        const sf_data_handlerId = `sf_data_handler_e${endpoint.id}_t${table.id}`;
        const linkInId = `sf_data_handler_e${endpoint.id}_t${table.id}_in`;
        const linkCallId = `sf_data_handler_e${endpoint.id}_t${table.id}_call`;
        sf_data_handlerIds.push(sf_data_handlerId);
        updatedNodes.push(...[
            {
                "id": sf_data_handlerId,
                "type": "subflow:sf_data_handler",
                "z": "tab_connections",
                "name": `${table.name}@${endpoint.id}`,
                "env": [
                    {
                        "name": "ENDPOINT_ID",
                        "value": String(endpoint.id),
                        "type": "num"
                    },
                    {
                        "name": "TAG_TABLE",
                        "value": table.name,
                        "type": "str"
                    }
                ],
                "x": 520,
                "y": dY,
                "wires": [
                    [
                        linkCallId
                    ]
                ]
            },
            {
                "id": linkCallId,
                "type": "link call",
                "z": "tab_connections",
                "name": "dynamic",
                "links": [],
                "linkType": "dynamic",
                "timeout": "30",
                "x": 820,
                "y": dY,
                "wires": [
                    [
                        sf_data_handlerId
                    ]
                ]
            },
            {
                "id": linkInId,
                "type": "link in",
                "z": "tab_connections",
                "name": linkInId,
                "links": [
                    triggerId
                ],
                "x": 220,
                "y": dY,
                "wires": [
                    [
                        sf_data_handlerId
                    ]
                ]
            }
        ]);
        dY += 100;

        // Check if the trigger node for this endpoint already exists
        /*
        const triggerNode = updatedNodes.find(node => node.id === triggerId);
        if (!triggerNode) {
            deployNeeded = true;
            updatedNodes.push({
                "id": triggerId,
                "type": "link out",
                "z": "tab_triggers",
                "name": triggerId,
                "mode": "link",
                "links": [
                    sf_data_handlerId
                ],
                "x": 400,
                "y": 100,
                "wires": []
            });
        }
        */
    }

    // Create the S7 in and S7 control nodes
    sf_data_handlerIds.sort();
    updatedNodes.push(...[{
        "id": S7inId,
        "type": "s7 in",
        "z": "tab_connections",
        "endpoint": S7endpointId,
        "mode": "all",
        "variable": "",
        "diff": false,
        "name": "",
        "x": 220,
        "y": startY,
        "wires": [
            sf_data_handlerIds
        ]
    },
    {
        "id": S7linkInId,
        "type": "link in",
        "z": "tab_connections",
        "name": S7linkInId,
        "links": [],
        "x": 520,
        "y": startY,
        "wires": [
            [
                S7controlId
            ]
        ]
    },
    {
        "id": S7controlId,
        "type": "s7 control",
        "z": "tab_connections",
        "endpoint": S7endpointId,
        "function": "trigger",
        "name": "",
        "x": 770,
        "y": startY,
        "wires": [
            [
                S7linkOutId
            ]
        ]
    },
    {
        "id": S7linkOutId,
        "type": "link out",
        "z": "tab_connections",
        "name": S7linkOutId,
        "mode": "return",
        "links": [],
        "x": 1020,
        "y": startY,
        "wires": []
    }]);

    startY += (dY - startY);
}

// Function to generate the nodes for a S7 endpoint with a custom trigger
function generateS7continous(endpoint, tag_tables, period, diff) {
    const endpointRegex = /^([\w\-.]+):(\d+)@(\d+):(\d+)$/; // Regex to match the endpoint address
    const S7endpointId = `S7endpoint_e${endpoint.id}_${period}`;
    const suffix = diff ? "diff" : "ever";
    const S7inId = `s7in_e${endpoint.id}_${period}_${suffix}`;
    const endpointNode = updatedNodes.find(node => node.id === S7endpointId);
    if (!endpoint.enabled && endpointNode) {
        updatedNodes = updatedNodes.filter(node => node.id !== S7endpointId);
        deployNeeded = true;
    }
    if (!endpoint.enabled) {
        return;
    }
    if (!tag_tables.length) {
        return;
    }
    const parsedAddress = parseEndpointAddress(endpoint, endpointRegex);
    if (!parsedAddress) {
        return;
    }
    const { address, port, rack, slot } = parsedAddress;
    updatedNodes.push({
        "id": `comment_e${endpoint.id}_${period}_${suffix}`,
        "type": "comment",
        "z": "tab_connections",
        "name": `Endpoint ${endpoint.id}: ${endpoint.name} - ${period} - ${suffix}`,
        "info": `README: https://github.com/st-one-io/node-red-contrib-s7/blob/master/README.md`,
        "x": 220,
        "y": startY,
        "wires": []
    });
    startY += 50;

    // Check if the endpoint node for this endpoint already exists
    if (!endpointNode) {
        deployNeeded = true;
        updatedNodes.push({
            "id": S7endpointId,
            "type": "s7 endpoint",
            "transport": "iso-on-tcp",
            "address": address,
            "port": port,
            "rack": rack,
            "slot": slot,
            "localtsaphi": "01",
            "localtsaplo": "00",
            "remotetsaphi": "01",
            "remotetsaplo": "00",
            "connmode": "rack-slot",
            "adapter": "",
            "busaddr": "2",
            "cycletime": String(timeToMilliseconds(period)),
            "timeout": "5000",
            "name": "",
            "vartable": []
        });
    } else {
        deployNeeded = endpointNode.address !== address || endpointNode.port !== port || endpointNode.rack !== rack || endpointNode.slot !== slot;
        if (deployNeeded) {
            endpointNode.address = address;
            endpointNode.port = port;
            endpointNode.rack = rack;
            endpointNode.slot = slot;
        }
    }

    // Create the data handler flow for each table
    let sf_data_handlerIds = [];
    let dY = startY;
    for (let table of tag_tables) {
        const sf_data_handlerId = `sf_data_handler_e${endpoint.id}_t${table.id}`;
        const linkCallId = `sf_data_handler_e${endpoint.id}_t${table.id}_call`;
        sf_data_handlerIds.push(sf_data_handlerId);
        updatedNodes.push(...[
            {
                "id": sf_data_handlerId,
                "type": "subflow:sf_data_handler",
                "z": "tab_connections",
                "name": `${table.name}@${endpoint.id}`,
                "env": [
                    {
                        "name": "ENDPOINT_ID",
                        "value": String(endpoint.id),
                        "type": "num"
                    },
                    {
                        "name": "TAG_TABLE",
                        "value": table.name,
                        "type": "str"
                    }
                ],
                "x": 540,
                "y": dY,
                "wires": [
                    [
                        linkCallId
                    ]
                ]
            },
            {
                "id": linkCallId,
                "type": "link call",
                "z": "tab_connections",
                "name": "dynamic",
                "links": [],
                "linkType": "dynamic",
                "timeout": "30",
                "x": 820,
                "y": dY,
                "wires": [
                    [
                        sf_data_handlerId
                    ]
                ]
            },
        ]);
        dY += 100;
    }

    // Create the S7 in and S7 control nodes
    sf_data_handlerIds.sort();
    updatedNodes.push({
        "id": S7inId,
        "type": "s7 in",
        "z": "tab_connections",
        "endpoint": S7endpointId,
        "mode": "all",
        "variable": "",
        "diff": diff,
        "name": "",
        "x": 220,
        "y": startY,
        "wires": [
            sf_data_handlerIds
        ]
    });

    startY += (dY - startY);
}


// _________________________Main_______________________________

const endpoints = msg.data;  // Array of all endpoints
const history = msg.history; // Array of all history
const allNodes = msg.payload;   // Current nodes
const tag_tables = global.get('tag_tables');

if (!Array.isArray(endpoints) || !Array.isArray(allNodes)) {
    node.error("Input data or allNodes is not in the expected format.");
    return;
}

// Collect all currently existing IDs
let existingIds = allNodes.map(node => node.id);

// Filter out all "tab_connections" nodes to rigenerate them
let updatedNodes = (JSON.parse(JSON.stringify(allNodes))).filter(node => node.z !== "tab_connections");
let deployNeeded = false;
let startY = 0;

// Generate nodes

generateStaticNodes();

for (let endpoint of endpoints) {
    const trigger_tables = tag_tables.filter(table =>
        endpoint.tag_tables.includes(table.name) &&
        table.protocol === endpoint.protocol &&
        ["trigger", "trigger_custom"].includes(table.sampling_mode)
    );
    const c_tables = tag_tables.filter(table =>
        endpoint.tag_tables.includes(table.name) &&
        table.protocol === endpoint.protocol &&
        table.sampling_mode === "continous"
    );
    const coc_tables = tag_tables.filter(table =>
        endpoint.tag_tables.includes(table.name) &&
        table.protocol === endpoint.protocol &&
        table.sampling_mode === "continous_on_change"
    );

    switch (endpoint.protocol) {
        case "S7": {
            generateS7triggered(endpoint, trigger_tables);
            let sampling_periods_set = new Set(c_tables.map(table => table.sampling_freq));
            for (let period of sampling_periods_set) {
                const tables = c_tables.filter(table => table.sampling_freq === period);
                generateS7continous(endpoint, tables, period, false);
            }
            for (let period of sampling_periods_set) {
                const tables = coc_tables.filter(table => table.sampling_freq === period);
                generateS7continous(endpoint, tables, period, true);
            }
        }
    }
}

// Remove nodes if the endpoint is deleted
for (let edit of history) {
    if (edit.oldItem && !edit.newItem) {
        deployNeeded = true;
        const endpoint = edit.oldItem;
        const S7endpointId = `S7endpoint_e${endpoint.id}`;
        updatedNodes = updatedNodes.filter(node => node.id !== S7endpointId);
        const tag_tables = global.get('tag_tables').filter(table => endpoint.tag_tables.includes(table.name));
        /*
        for (let table of tag_tables) {
            const triggerId = `trigger_e${endpoint.id}_t${table.id}_out`;
            updatedNodes = updatedNodes.filter(node => node.id !== triggerId);
        }
        */
    }
}

// Deploy needed check and return
const previousTabNodes = allNodes.filter(node => node.z === "tab_connections").sort((a, b) => a.id.localeCompare(b.id));
const updatedTabNodes = updatedNodes.filter(node => node.z === "tab_connections").sort((a, b) => a.id.localeCompare(b.id));
deployNeeded = deployNeeded || JSON.stringify(previousTabNodes) !== JSON.stringify(updatedTabNodes);

if (deployNeeded) {
    const deploycount = global.get("dpc_connections") + 1 || 1;
    global.set("dpc_connections", deploycount);
    msg.payload = updatedNodes
    node.status({ fill: "green", shape: "dot", text: `Deploy ${deploycount} sent` });
    msg.log = msg.log || [];
    msg.log.push({ oldFlow: previousTabNodes, newFlow: updatedTabNodes });
    return [msg, null];
} else {
    return [null, msg];
}
