// This function takes the complete flows array returned by the GET /flows request,
// finds the tab labeled "dynamic_deploy", calculates a new (unique) ID, finds the
// maximum Y position among existing nodes in that tab, then pushes a new Comment node.

let allNodes = msg.payload;

if (!Array.isArray(allNodes)) {
    node.warn("Unexpected flows data. Expected an array.");
    return;
}

// 1) Find the tab with label 'dynamic_deploy'
let tab = allNodes.find(n => n.type === 'tab' && n.label === 'dynamic_deploy');
if (!tab) {
    node.warn("Tab 'dynamic_deploy' not found.");
    return;
}

// 2) Collect all node IDs in the entire flow (to avoid duplicates)
let usedIds = allNodes.map(n => n.id);

// 3) Filter out the nodes that belong to that tab
let tabNodes = allNodes.filter(n => n.z === tab.id);

// 4) Find the maximum Y coordinate
let maxY = 0;
for (let node of tabNodes) {
    if (typeof node.y === 'number' && node.y > maxY) {
        maxY = node.y;
    }
}

// 5) Generate a new unique ID not yet in usedIds
function generateId() {
    // A short, random hex-like ID; Node-RED often uses 8 or 16 hex digits.
    function randomHex(n) {
        const chars = "0123456789abcdef";
        let str = "";
        for (let i = 0; i < n; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }
    
    let newId;
    do {
        newId = randomHex(usedIds[0].length);
    } while (usedIds.includes(newId));
    return newId;
}

let newId = generateId();

// 6) Create a new comment node
//    We'll place it at x=200, y = maxY+100 to ensure it doesn't overlap.
let newCommentNode = {
    id: newId,
    type: "comment",
    z: tab.id,
    name: "Dynamic Inserted Comment",
    info: "",
    x: 200,
    y: maxY + 100,
    wires: []
};

// 7) Add the new node to the flows array
allNodes.push(newCommentNode);

// 8) Return the updated flows for the next HTTP PUT request
msg.payload = allNodes;

return msg;
