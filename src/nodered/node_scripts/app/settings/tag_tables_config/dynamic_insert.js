// This code checks if each item in msg.data has a corresponding subflow in the allNodes (msg.payload) and:
// 1. Adds the required nodes if they are missing.
// 2. Removes nodes that no longer correspond to msg.data.

const inputData = msg.data; // Array of objects to verify
const inputHistory = msg.history; // Array of objects to verify
let allNodes = msg.payload;   // Current nodes
let deployNeded = false;    // Flag to indicate if a deploy is needed

if (!Array.isArray(inputData) || !Array.isArray(inputHistory) || !Array.isArray(allNodes)) {
    node.error("Input data or history or allNodes is not in the expected format.");
    return;
}

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

// Collect all currently existing IDs
let existingIds = allNodes.map(node => node.id);
const updatedNodes = [...allNodes];

// Filter out the nodes that belong to the tab with ID "4b69c9fd15f72033" (Settings tab)
const tabNodes = allNodes.filter(node => node.z === "4b69c9fd15f72033");

// Find the maximum Y coordinate in the tab
let maxY = 0;
for (let node of tabNodes) {
    if (typeof node.y === 'number' && node.y > maxY) {
        maxY = node.y;
    }
}

// Function to create the required nodes for a specific name
function createNodesForItem(item) {
    const name = item.name;
    const baseId = generateId(existingIds);
    const linkCallId = generateId(existingIds);

    return [
        {
            id: baseId,
            type: "subflow:96d5a2eeb5f112bc",
            z: "4b69c9fd15f72033",
            name: name,
            env: [
                { name: "SCHEMA", value: "tags", type: "str" },
                { name: "TABLE", value: name, type: "str" },
                { name: "PROCESS_SCHEMA", value: msg.database.processSchema, type: "str" },
                { name: "DATA_TABLE", value: item.data_table, type: "str" },
                { name: "PROTOCOL", value: item.protocol, type: "str" }
            ],
            x: 350,
            y: maxY + 100, // Position below the current maximum Y
            wires: [[linkCallId]]
        },
        {
            id: generateId(existingIds),
            type: "link in",
            z: "4b69c9fd15f72033",
            name: name,
            links: ["bc31f07c227e2c67"],
            x: 105,
            y: maxY + 100, // Match Y position
            wires: [[baseId]]
        },
        {
            id: linkCallId,
            type: "link call",
            z: "4b69c9fd15f72033",
            name: "to_database",
            links: [],
            linkType: "dynamic",
            timeout: "30",
            x: 640,
            y: maxY + 100, // Match Y position
            wires: [[baseId]]
        }
    ];
}

// _________________________History Processing (edits)_______________________________

for (const action of inputHistory) {
    if (action.newItem && action.oldItem &&
        (action.newItem.name !== action.oldItem.name ||                     // Name change
            action.newItem.data_table !== action.oldItem.data_table ||    // Process Table change
            action.newItem.protocol !== action.oldItem.protocol)) {             // Protocol change
        const oldName = action.oldItem.name;
        const newName = action.newItem.name;
        const newProcessTable = action.newItem.data_table;
        const newProtocol = action.newItem.protocol;

        // Check if the subflow for the old name exists
        const oldSubflow = updatedNodes.find(node => node.name === oldName && node.type === "subflow:96d5a2eeb5f112bc");

        if (oldSubflow) {
            // Update the subflow name
            oldSubflow.name = newName;
            // Update the environment variables where the table name is stored (if present else add it)
            let tableUpdated = false;
            let processUpdated = false;
            let protocolUpdated = false;
            for (let env of oldSubflow.env) {
                if (env.name === "TABLE") {
                    env.value = newName;
                    tableUpdated = true;
                }
                if (env.name === "DATA_TABLE") {
                    env.value = newProcessTable;
                    processUpdated = true;
                }
                if (env.name === "PROTOCOL") {
                    env.value = newProtocol;
                    protocolUpdated = true;
                }
            }
            if (!tableUpdated) {
                oldSubflow.env.push({ name: "TABLE", value: newName, type: "str" });
            }
            if (!processUpdated) {
                oldSubflow.env.push({ name: "DATA_TABLE", value: newProcessTable, type: "str" });
            }
            if (!protocolUpdated) {
                oldSubflow.env.push({ name: "PROTOCOL", value: newProtocol, type: "str" });
            }
            // Update the link in node name
            const linkInNode = updatedNodes.find(node => node.type === "link in" && node.name === oldName);
            if (linkInNode) {
                linkInNode.name = newName;
            }
            deployNeded = true;
        }
    }

}

// ______________________Data Processing (new or delete)_____________________________

// Add the required nodes for each table name in the inputData (new)
for (const item of inputData) {
    // Check if the subflow for this name already exists
    const isPresent = allNodes.some(node => node.name === item.name && node.type.startsWith("subflow"));

    if (!isPresent) {
        // Add the required nodes for this name
        const newNodes = createNodesForItem(item);
        maxY += 100; // Increase the maximum Y coordinate
        updatedNodes.push(...newNodes);
        const settingsOut = updatedNodes.find(node => node.id === "bc31f07c227e2c67");
        settingsOut.links.push(newNodes[1].id);
        settingsOut.links.sort();
        deployNeded = true;
    }
}

// Remove nodes that not correspond to inputData (delete)
const namesInData = inputData.map(item => item.name);
let idsToRemove = [];
for (let node of updatedNodes) {
    if (node.type === "subflow:96d5a2eeb5f112bc" && !namesInData.includes(node.name)) {
        // Remove the subflow and its associated nodes
        const subflowId = node.id;
        idsToRemove.push(subflowId);
        for (let n of updatedNodes) {
            if (Object.keys(n).includes("wires") && Array.isArray(n.wires)) {
                for (let i = 0; i < n.wires.length; i++) {
                    if (n.wires[i].includes(subflowId)) {
                        idsToRemove.push(n.id);
                    };
                }
            }
        }
        deployNeded = true;
    }
}

const finalNodes = updatedNodes.filter(node => !idsToRemove.includes(node.id));
const settingsOut = updatedNodes.find(node => node.id === "bc31f07c227e2c67");
settingsOut.links.filter(id => !idsToRemove.includes(id));

msg.payload = finalNodes;

if (deployNeded) { return [msg, null]; } else { return [null, msg]; }
