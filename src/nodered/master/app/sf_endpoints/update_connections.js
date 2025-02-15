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
    switch (unit) {
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
    const S7endpointId = `s7edt_e${endpoint.id}`;
    const S7inId = `s7in_e${endpoint.id}`;
    const S7controlId = `s7control_e${endpoint.id}`;
    const S7linkInId = `s7control_e${endpoint.id}_in`;
    const S7linkOutId = `s7control_e${endpoint.id}_out`;
    const endpointNode = updatedNodes.find(node => node.id === S7endpointId);
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

    // Prepare vartable
    let completeVartable = [];

    for (let table of tag_tables) {
        let tags = global.get(table.name);
        if (!tags) {
            node.error(`Tag table ${table.name} not found in global context.`);
            continue;
        }

        let vartable = tags.map(tag => ({ addr: tag.address, name: tag.name }));

        // Add the new vartable to the complete vartable avoiding duplicates
        completeVartable = Array.from(
            new Map(
                [...completeVartable, ...vartable].map(item => [`${item.addr}-${item.name}`, item])
            ).values()
        ).sort((a, b) => `${a.addr}-${a.name}`.localeCompare(`${b.addr}-${b.name}`));
    }

    // Create the endpoint node if it does not exist
    if (!endpointNode) {
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
            "vartable": completeVartable
        });
    } else {
        completeVartable = Array.from(
            new Map(
                [...endpointNode.vartable, completeVartable].map(item => [`${item.addr}-${item.name}`, item])
            ).values()
        ).sort((a, b) => `${a.addr}-${a.name}`.localeCompare(`${b.addr}-${b.name}`));
        endpointNode.vartable = completeVartable;
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

// Function to generate the nodes for a S7 endpoint with continous sampling
function generateS7continous(endpoint, tag_tables, period, diff) {
    logs.push(`Generating S7 continous nodes for endpoint ${endpoint.name} with period ${period} and diff ${diff}. Tag tables: ${tag_tables.map(table => table.name).join(", ")}`);
    const endpointRegex = /^([\w\-.]+):(\d+)@(\d+):(\d+)$/; // Regex to match the endpoint address
    const S7endpointId = `s7edc_e${endpoint.id}_${period}`;
    const suffix = diff ? "diff" : "ever";
    const S7inId = `s7in_e${endpoint.id}_${period}_${suffix}`;
    const endpointNode = updatedNodes.find(node => node.id === S7endpointId);
    if (!endpoint.enabled) {
        logs.push(`Endpoint ${endpoint.name} is disabled.`);
        return;
    }
    if (!tag_tables.length) {
        logs.push(`Endpoint ${endpoint.name} does not have any tag tables.`);
        return;
    }
    const parsedAddress = parseEndpointAddress(endpoint, endpointRegex);
    if (!parsedAddress) {
        logs.push(`Endpoint ${endpoint.name} address is not in the correct format.`);
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

    // Prepare vartable
    let completeVartable = [];

    for (let table of tag_tables) {
        let tags = global.get(table.name);
        if (!tags) {
            node.error(`Tag table ${table.name} not found in global context.`);
            continue;
        }

        let vartable = tags.map(tag => ({ addr: tag.address, name: tag.name }));

        // Add the new vartable to the complete vartable avoiding duplicates
        completeVartable = Array.from(
            new Map(
                [...completeVartable, ...vartable].map(item => [`${item.addr}-${item.name}`, item])
            ).values()
        ).sort((a, b) => `${a.addr}-${a.name}`.localeCompare(`${b.addr}-${b.name}`));
    }

    // Create the endpoint node if it does not exist
    if (!endpointNode) {
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
            "vartable": completeVartable
        });
    } else {
        completeVartable = Array.from(
            new Map(
                [...endpointNode.vartable, completeVartable].map(item => [`${item.addr}-${item.name}`, item])
            ).values()
        ).sort((a, b) => `${a.addr}-${a.name}`.localeCompare(`${b.addr}-${b.name}`));
        endpointNode.vartable = completeVartable;
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

    // Create the S7 in node
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

const logs = msg.logs || [];

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
let updatedNodes = (JSON.parse(JSON.stringify(allNodes)))
    .filter(node => node.z !== "tab_connections") // Remove previous connections
    .filter(node => !node.id.startsWith("s7edt") && !node.id.startsWith("s7edc")); // Remove endpoint nodes
let deployNeeded = false;
let startY = 0;

// Generate nodes

generateStaticNodes();

for (let endpoint of endpoints) {
    const trigger_tables = tag_tables.filter(table =>
        endpoint.tag_tables.includes(table.name) &&
        table.protocol === endpoint.protocol &&
        table.sampling_mode === "Trigger"
    );
    const c_tables = tag_tables.filter(table =>
        endpoint.tag_tables.includes(table.name) &&
        table.protocol === endpoint.protocol &&
        table.sampling_mode === "Continous"
    );
    const coc_tables = tag_tables.filter(table =>
        endpoint.tag_tables.includes(table.name) &&
        table.protocol === endpoint.protocol &&
        table.sampling_mode === "ContinousOnChange"
    );
    logs.push({
        endpoint: endpoint,
        trigger_tables: trigger_tables.map(table => table.name),
        c_tables: c_tables.map(table => table.name),
        coc_tables: coc_tables.map(table => table.name)
    });

    switch (endpoint.protocol) {
        case "S7": {
            if (trigger_tables.length) {
                generateS7triggered(endpoint, trigger_tables);
            }
            if (c_tables.length) {
                const sampling_periods_set = new Set(c_tables.map(table => table.sampling_freq));
                for (let period of sampling_periods_set) {
                    const tables = c_tables.filter(table => table.sampling_freq === period);
                    logs.push({ period, tables: tables.map(table => table.name) });
                    generateS7continous(endpoint, tables, period, false);
                }
            }
            if (coc_tables.length) {
                const sampling_periods_set = new Set(coc_tables.map(table => table.sampling_freq));
                for (let period of sampling_periods_set) {
                    const tables = coc_tables.filter(table => table.sampling_freq === period);
                    logs.push({ period, tables: tables.map(table => table.name) });
                    generateS7continous(endpoint, tables, period, true);
                }
            }
            break;
        }
    }
}

// Deploy needed check and return
const sortedAllNodes = [...allNodes].sort((a, b) => a.id.localeCompare(b.id));
const sortedUpdatedNodes = [...updatedNodes].sort((a, b) => a.id.localeCompare(b.id));
deployNeeded = deployNeeded || JSON.stringify(sortedAllNodes) !== JSON.stringify(sortedUpdatedNodes);

if (deployNeeded) {
    const deploycount = global.get("dpc_connections") + 1 || 1;
    global.set("dpc_connections", deploycount);
    msg.payload = updatedNodes
    node.status({ fill: "green", shape: "dot", text: `Deploy ${deploycount} sent` });
    msg.logs = logs;
    return [msg, null];
} else {
    msg.logs = logs;
    return [null, msg];
}
