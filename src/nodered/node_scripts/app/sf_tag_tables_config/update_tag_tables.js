// This code checks if each item in msg.data has a corresponding subflow in the allNodes (msg.payload)


// ________________________Insert Prototypes___________________________

// Function to generate the status and catch flows
function generateStaticNodes() {
    updatedNodes.push(...[
        {
            "id": "nS_tag_tables",
            "type": "status",
            "z": "tab_tag_tables",
            "name": "",
            "scope": null,
            "x": 120,
            "y": 60,
            "wires": [
                [
                    "loS_tag_tables"
                ]
            ]
        },
        {
            "id": "loS_tag_tables",
            "type": "link out",
            "z": "tab_tag_tables",
            "name": "status_tag_tables",
            "mode": "link",
            "links": [
                "liALL_status"
            ],
            "x": 235,
            "y": 60,
            "wires": []
        },
        {
            "id": "nC_tag_tables",
            "type": "catch",
            "z": "tab_tag_tables",
            "name": "",
            "scope": null,
            "uncaught": false,
            "x": 520,
            "y": 60,
            "wires": [
                [
                    "loC_tag_tables"
                ]
            ]
        },
        {
            "id": "loC_tag_tables",
            "type": "link out",
            "z": "tab_tag_tables",
            "name": "error_tag_tables",
            "mode": "link",
            "links": [
                "liALL_errors"
            ],
            "x": 635,
            "y": 60,
            "wires": []
        }
    ]);
    startY += 160;
}

// Function to create the required nodes for a specific item
function generateTagTables(item) {
    const name = item.name;
    const baseId = `sf_tag_table_t${item.id}`;
    const linkInId = `sf_tag_table_t${item.id}_in`;
    const linkCallId = `sf_tag_table_t${item.id}_call`;

    updatedNodes.push(...[
        {
            id: baseId,
            type: "subflow:sf_tag_table",
            z: "tab_tag_tables",
            name: name,
            env: [
                { name: "SCHEMA", value: "tags", type: "str" },
                { name: "TABLE", value: name, type: "str" },
                { name: "DATA_SCHEMA", value: msg.database.dataSchema, type: "str" },
                { name: "DATA_TABLE", value: item.data_table, type: "str" },
                { name: "PROTOCOL", value: item.protocol, type: "str" }
            ],
            x: 410,
            y: startY, // Position below the current maximum Y
            wires: [[linkCallId]]
        },
        {
            id: linkInId,
            type: "link in",
            z: "tab_tag_tables",
            name: name,
            links: ["lo_endpoints"],
            x: 180,
            y: startY, // Match Y position
            wires: [[baseId]]
        },
        {
            id: linkCallId,
            type: "link call",
            z: "tab_tag_tables",
            name: "to_database",
            links: [],
            linkType: "dynamic",
            timeout: "30",
            x: 700,
            y: startY, // Match Y position
            wires: [[baseId]]
        }
    ]);
    startY += 100;
    return linkInId;
}



// _________________________Main_______________________________

const tag_tables = msg.data; // Array of objects to verify
let allNodes = msg.payload;   // Current nodes
let deployNeded = false;    // Flag to indicate if a deploy is needed

if (!Array.isArray(tag_tables) || !Array.isArray(allNodes)) {
    node.error("Input data or allNodes is not in the expected format.");
    return;
}

// Collect all currently existing IDs
let existingIds = allNodes.map(node => node.id);

// Filter out all "tab_tag_tables" nodes to rigenerate them
let updatedNodes = (JSON.parse(JSON.stringify(allNodes))).filter(node => node.z !== "tab_tag_tables");
let deployNeeded = false;
let startY = 0;

// Generate nodes

generateStaticNodes();


let links = [];
for (let table of tag_tables) {
    links.push(generateTagTables(table));
}
links.sort();


// Deploy needed check and return
const previousTabNodes = allNodes.filter(node => node.z === "tab_tag_tables").sort((a, b) => a.id.localeCompare(b.id));
const updatedTabNodes = updatedNodes.filter(node => node.z === "tab_tag_tables").sort((a, b) => a.id.localeCompare(b.id));
deployNeeded = deployNeeded || JSON.stringify(previousTabNodes) !== JSON.stringify(updatedTabNodes);

if (deployNeeded) {
    const deploycount = global.get("dpc_tag_tables") + 1 || 1;
    global.set("dpc_tag_tables", deploycount);
    // Update link in
    let loNode = updatedNodes.find(node => node.id === "lo_endpoints");
    loNode.links = links;
    // Return updated nodes
    msg.log = msg.log || [];
    msg.log.push({ oldFlow: previousTabNodes, newFlow: updatedTabNodes });
    msg.payload = updatedNodes
    node.status({ fill: "green", shape: "dot", text: `Deploy ${deploycount} sent` });
    return [msg, null];
} else {
    return [null, msg];
}
