// This code checks if each item in msg.data has a corresponding subflow in the allNodes (msg.payload) and:
// 1. Adds the required nodes if they are missing.
// 2. Removes nodes that no longer correspond to msg.data.

const inputData = msg.data; // Array of objects to verify
const inputHistory = msg.history; // Array of objects to verify
let allNodes = msg.payload;   // Current nodes

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
    return id;
}

// Collect all currently existing IDs
const existingIds = allNodes.map(node => node.id);
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
function createNodesForName(name) {
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
                { name: "TABLE", value: name, type: "str" }
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
            name: "",
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



// ______________________Data Processing (new or delete)_____________________________

// Process each item in inputData
let deployNeded = false;
for (const item of inputData) {
    const name = item.name;

    // Check if the subflow for this name already exists
    const isPresent = allNodes.some(node => node.name === name && node.type.startsWith("subflow"));

    if (!isPresent) {
        // Add the required nodes for this name
        const newNodes = createNodesForName(name);
        maxY += 100; // Increase the maximum Y coordinate
        updatedNodes.push(...newNodes);
        deployNeded = true;
    }
}

// Remove nodes that not correspond to inputData
const namesInData = inputData.map(item => item.name);
let idsToRemove = [];
for (let node of updatedNodes) {
    if (node.type === "subflow:96d5a2eeb5f112bc" && !namesInData.includes(node.name)) {
        // Remove the subflow and its associated nodes
        const subflowId = node.id;
        idsToRemove.push(subflowId);
        for (let n of updatedNodes) {
            for (let i = 0; i < n.wires.length; i++) {
                if (n.wires[i].includes(subflowId)) {
                    idsToRemove.push(n.id);
                };
            }
        }
        deployNeded = true;
    }
}

const finalNodes = updatedNodes.filter(node => !idsToRemove.includes(node.id));

msg.payload = finalNodes;

if (deployNeded) {return msg;} else {return null;}
