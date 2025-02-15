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

// Helper function to align x coo
function alignX(targetX, name) {
    const nodeWidth = 50 + 5 * name.length;
    return targetX + nodeWidth / 2;
}

// Helper function to safely parse the endpoint address
function parseEndpointAddress(endpoint) {
    if (!endpoint || !endpoint.address) {
        node.error(`Invalid endpoint object or missing address.`);
        node.status({ fill: "red", shape: "dot", text: `Invalid endpoint object or missing address` });
        return null;
    }

    // Match the address against the regex pattern
    const match = endpoint.address.match(addressRegex);
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
            "id": "nS_triggers",
            "type": "status",
            "z": "tab_triggers",
            "name": "",
            "scope": null,
            "x": 120,
            "y": 60,
            "wires": [
                [
                    "loS_triggers"
                ]
            ]
        },
        {
            "id": "loS_triggers",
            "type": "link out",
            "z": "tab_triggers",
            "name": "status_triggers",
            "mode": "link",
            "links": [
                "liALL_status"
            ],
            "x": 235,
            "y": 60,
            "wires": []
        },
        {
            "id": "nC_triggers",
            "type": "catch",
            "z": "tab_triggers",
            "name": "",
            "scope": null,
            "uncaught": false,
            "x": 520,
            "y": 60,
            "wires": [
                [
                    "loC_triggers"
                ]
            ]
        },
        {
            "id": "loC_triggers",
            "type": "link out",
            "z": "tab_triggers",
            "name": "error_triggers",
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

// Function to generate the nodes for a S7 trigger with a custom trigger
function generateS7triggers(trigger, endpoint, tag_tables) {
    const S7endpointId = `s7et_e${endpoint.id}`;
    const S7inId = `s7in_trig${trigger.id}`;
    const endpointNode = updatedNodes.find(node => node.id === S7endpointId);
    if (!trigger.enabled) {
        return;
    }
    if (!tag_tables.length) {
        return;
    }
    const parsedAddress = parseEndpointAddress(endpoint);
    if (!parsedAddress) {
        return;
    }
    const { address, port, rack, slot } = parsedAddress;
    updatedNodes.push({
        "id": `comment_trig${trigger.id}`,
        "type": "comment",
        "z": "tab_triggers",
        "name": `Trigger ${trigger.id}: ${trigger.name}`,
        "info": "",
        "x": 160,
        "y": startY,
        "wires": []
    });
    startY += 50;

    // Prepare vartable
    let completeVartable = [{ addr: trigger.tag_address, name: trigger.name }];

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
            "cycletime": "1000",
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
    let sf_trigger_handlerIds = [];
    let dY = startY + 50;
    for (let table of tag_tables) {
        const sf_trigger_handlerId = `sf_trigger_handler_trig${trigger.id}_t${table.id}`;
        const manualInId = `manual_trig${trigger.id}_t${table.id}`;
        const linkOutId = `trigger_e${endpoint.id}_t${table.id}_out`;
        const linkDataHandlerId = `sf_data_handler_e${endpoint.id}_t${table.id}_in`
        sf_trigger_handlerIds.push(sf_trigger_handlerId);
        updatedNodes.push(...[
            {
                "id": sf_trigger_handlerId,
                "type": "subflow:sf_trigger_handler",
                "z": "tab_triggers",
                "name": `trig${trigger.id} - ${table.name}`,
                "env": [
                    {
                        "name": "TRIGGER_ID",
                        "value": String(trigger.id),
                        "type": "num"
                    },
                    {
                        "name": "TAG_TABLE",
                        "value": table.name,
                        "type": "str"
                    }
                ],
                "x": 620,
                "y": dY,
                "wires": [
                    [
                        linkOutId
                    ]
                ]
            },
            {
                "id": manualInId,
                "type": "inject",
                "z": "tab_triggers",
                "name": "Manual Trigger",
                "props": [
                    {
                        "p": "topic",
                        "vt": "str"
                    }
                ],
                "repeat": "",
                "crontab": "",
                "once": false,
                "onceDelay": 0.1,
                "topic": "trigger",
                "x": 220,
                "y": dY,
                "wires": [
                    [
                        sf_trigger_handlerId
                    ]
                ]
            },
            {
                "id": linkOutId,
                "type": "link out",
                "z": "tab_triggers",
                "name": linkOutId,
                "mode": "link",
                "links": [
                    linkDataHandlerId
                ],
                "x": 850,
                "y": dY,
                "wires": []
            }
        ]);
        dY += 100;
    }

    // Create the S7 in and S7 control nodes
    sf_trigger_handlerIds.sort();
    updatedNodes.push({
        "id": S7inId,
        "type": "s7 in",
        "z": "tab_triggers",
        "endpoint": S7endpointId,
        "mode": "all",
        "variable": "",
        "diff": false,
        "name": "",
        "x": 220,
        "y": startY,
        "wires": [
            sf_trigger_handlerIds
        ]
    });

    logs.push({ sf_trigger_handlerIds: sf_trigger_handlerIds });
    startY += 120;
}


// _________________________Main_______________________________

const logs = msg.logs || [];

const triggers = msg.data;  // Array of all triggers
logs.push({ triggers: triggers });
const history = msg.history; // Array of all history
const allNodes = msg.payload;   // Current nodes
const tag_tables = global.get('tag_tables');
const endpoints = global.get('endpoints');
const addressRegex = /^([\w\-.]+):(\d+)@(\d+):(\d+)$/; // Regex to match the trigger address

if (!Array.isArray(triggers) || !Array.isArray(allNodes)) {
    node.error("Input data or allNodes is not in the expected format.");
    return;
}

// Collect all currently existing IDs
let existingIds = allNodes.map(node => node.id);

// Filter out all "tab_triggers" nodes to rigenerate them
let updatedNodes = (JSON.parse(JSON.stringify(allNodes)))
    .filter(node => node.z !== "tab_triggers") // Remove tab_triggers nodes
    .filter(node => !node.id.startsWith("s7et")); // Remove endpoint nodes
let deployNeeded = false;
let startY = 0;

// Generate nodes

generateStaticNodes();

for (let endpoint of endpoints) {
    const endp_triggers = triggers.filter(trigger => trigger.endpoint === endpoint.name);
    logs.push({ endpoint: endpoint, triggers: endp_triggers });
    for (let trigger of endp_triggers) {
        const trigger_tables = tag_tables.filter(table =>
            trigger.tag_tables.includes(table.name) &&
            table.protocol === endpoint.protocol &&
            table.sampling_mode === "Trigger"
        );
        logs.push({ trigger: trigger, tables: trigger_tables });
        switch (endpoint.protocol) {
            case "S7": {
                generateS7triggers(trigger, endpoint, trigger_tables);

            }
        }
    }
}

// Deploy needed check and return
const sortedAllNodes = [...allNodes].sort((a, b) => a.id.localeCompare(b.id));
const sortedUpdatedNodes = [...updatedNodes].sort((a, b) => a.id.localeCompare(b.id));
deployNeeded = deployNeeded || JSON.stringify(sortedAllNodes) !== JSON.stringify(sortedUpdatedNodes);

if (deployNeeded) {
    const deploycount = global.get("dpc_triggers") + 1 || 1;
    global.set("dpc_triggers", deploycount);
    msg.payload = updatedNodes
    node.status({ fill: "green", shape: "dot", text: `Deploy ${deploycount} sent` });
    msg.logs = logs;
    return [msg, null];
} else {
    msg.logs = logs;
    return [null, msg];
}
