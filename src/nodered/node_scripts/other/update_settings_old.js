// Initialize log array if not already present
msg.log = msg.log || [];
function logStep(step, variables) {
    msg.log.push({ step, variables });
}

// This code checks if each item in msg.data has a corresponding subflow in the allNodes (msg.payload) and:
// 1. Adds the required nodes if they are missing.
// 2. Removes nodes that no longer correspond to msg.data.

const inputData = msg.data; // Array of objects to verify
const inputHistory = msg.history; // Array of objects to verify
let allNodes = msg.payload;   // Current nodes
let deployNeded = false;    // Flag to indicate if a deploy is needed

/* logStep("Initialized inputs", { 
    inputData, 
    inputHistory, 
    allNodes, 
    deployNeded 
});
*/

if (!Array.isArray(inputData) || !Array.isArray(inputHistory) || !Array.isArray(allNodes)) {
    node.error("Input data or history or allNodes is not in the expected format.");
    logStep("Error: Unexpected input format", { inputData, inputHistory, allNodes });
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
    // logStep("Generated new ID", { id, existingIds });
    return id;
}

// Collect all currently existing IDs
const existingIds = allNodes.map(node => node.id);
// logStep("Collected existing IDs", { existingIds });

// Make a shallow copy of allNodes for updates
const updatedNodes = [...allNodes];
// logStep("Created updatedNodes copy", { updatedNodesCount: updatedNodes.length });

// Filter out the nodes that belong to the tab with ID "tab_settings" (Settings tab)
const tabNodes = allNodes.filter(node => node.z === "tab_settings");
// logStep("Filtered tab_nodes (tab_settings)", { tabNodesCount: tabNodes.length });

// Find the maximum Y coordinate in the tab
let maxY = 0;
for (let node of tabNodes) {
    if (typeof node.y === 'number' && node.y > maxY) {
        maxY = node.y;
    }
}
// logStep("Calculated maximum Y coordinate", { maxY });

// Function to create the required nodes for a specific item
function createNodesForItem(item) {
    const name = item.name;
    const baseId = generateId(existingIds);
    const linkCallId = generateId(existingIds);

    const newNodes = [
        {
            id: baseId,
            type: "subflow:sf_tag_table",
            z: "tab_settings",
            name: name,
            env: [
                { name: "SCHEMA", value: "tags", type: "str" },
                { name: "TABLE", value: name, type: "str" },
                { name: "DATA_SCHEMA", value: msg.database.dataSchema, type: "str" },
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
            z: "tab_settings",
            name: name,
            links: ["bc31f07c227e2c67"],
            x: 105,
            y: maxY + 100, // Match Y position
            wires: [[baseId]]
        },
        {
            id: linkCallId,
            type: "link call",
            z: "tab_settings",
            name: "to_database",
            links: [],
            linkType: "dynamic",
            timeout: "30",
            x: 640,
            y: maxY + 100, // Match Y position
            wires: [[baseId]]
        }
    ];
    // logStep("Created nodes for item", { item, newNodes });
    return newNodes;
}

// _________________________History Processing (edits)_______________________________

for (const action of inputHistory) {
    // logStep("Processing history action", { action });
    if (action.newItem && action.oldItem &&
        (action.newItem.name !== action.oldItem.name ||                     // Name change
            action.newItem.data_table !== action.oldItem.data_table ||           // Process Table change
            action.newItem.protocol !== action.oldItem.protocol)) {              // Protocol change

        const oldName = action.oldItem.name;
        const newName = action.newItem.name;
        const newdataTable = action.newItem.data_table;
        const newProtocol = action.newItem.protocol;

        // Check if the subflow for the old name exists
        const oldSubflow = updatedNodes.find(node => node.name === oldName && node.type === "subflow:sf_tag_table");
        // logStep("Found old subflow (if any)", { oldName, found: !!oldSubflow });

        if (oldSubflow) {
            // Update the subflow name
            oldSubflow.name = newName;
            // Update the environment variables where the table name is stored (if present else add it)
            let tableUpdated = false;
            let dataUpdated = false;
            let protocolUpdated = false;
            for (let env of oldSubflow.env) {
                if (env.name === "TABLE") {
                    env.value = newName;
                    tableUpdated = true;
                }
                if (env.name === "DATA_TABLE") {
                    env.value = newdataTable;
                    dataUpdated = true;
                }
                if (env.name === "PROTOCOL") {
                    env.value = newProtocol;
                    protocolUpdated = true;
                }
            }
            if (!tableUpdated) {
                oldSubflow.env.push({ name: "TABLE", value: newName, type: "str" });
            }
            if (!dataUpdated) {
                oldSubflow.env.push({ name: "DATA_TABLE", value: newdataTable, type: "str" });
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
            // logStep("Updated subflow and related nodes for history action", { oldName, newName, newdataTable, newProtocol });
        }
    }
}
// logStep("Completed history dataing", { deployNeded });

// ______________________Data Processing (new or delete)_____________________________

// Add the required nodes for each table name in the inputData (new)
for (const item of inputData) {
    // logStep("Processing inputData item", { item });
    // Check if the subflow for this name already exists
    const isPresent = allNodes.some(node => node.name === item.name && node.type.startsWith("subflow"));
    // logStep("Check if subflow exists for item", { name: item.name, isPresent });

    if (!isPresent) {
        // Add the required nodes for this name
        const newNodes = createNodesForItem(item);
        maxY += 100; // Increase the maximum Y coordinate
        updatedNodes.push(...newNodes);
        // Find the settings output node and update its links
        const settingsOut = updatedNodes.find(node => node.id === "bc31f07c227e2c67");
        if (settingsOut) {
            settingsOut.links.push(newNodes[1].id);
            settingsOut.links.sort();
        }
        deployNeded = true;
        // logStep("Added new nodes for item", { item, newNodes, updatedNodesCount: updatedNodes.length, settingsOut });
    }
}

// Remove nodes that do not correspond to inputData (delete)
const namesInData = inputData.map(item => item.name);
// logStep("Computed namesInData", { namesInData });

let idsToRemove = [];
for (let node of updatedNodes) {
    if (node.type === "subflow:sf_tag_table" && !namesInData.includes(node.name)) {
        // Remove the subflow and its associated nodes
        const subflowId = node.id;
        idsToRemove.push(subflowId);
        for (let n of updatedNodes) {
            if (Object.keys(n).includes("wires") && Array.isArray(n.wires)) {
                for (let i = 0; i < n.wires.length; i++) {
                    if (n.wires[i].includes(subflowId)) {
                        idsToRemove.push(n.id);
                    }
                }
            }
        }
        deployNeded = true;
        // logStep("Marked nodes for removal", { subflowId, nodeName: node.name, idsToRemove });
    }
}

const finalNodes = updatedNodes.filter(node => !idsToRemove.includes(node.id));
// logStep("Filtered finalNodes", { finalNodesCount: finalNodes.length, idsToRemove });

// Update the settings output node links by filtering out removed IDs
const settingsOut = updatedNodes.find(node => node.id === "bc31f07c227e2c67");
if (settingsOut && Array.isArray(settingsOut.links)) {
    settingsOut.links = settingsOut.links.filter(id => !idsToRemove.includes(id));
    // logStep("Updated settingsOut links", { settingsOutLinks: settingsOut.links });
}

msg.payload = {
    flows: finalNodes,
    deploy: "flows"
};
// logStep("Set final msg.payload", { payload: "flow" });

// Return based on whether a deploy is needed
if (deployNeded) {
    logStep("Deploy needed: Returning [msg, null]", { deployNeded });
    return [msg, null];
} else {
    logStep("Deploy not needed: Returning [null, msg]", { deployNeded });
    return [null, msg];
}
