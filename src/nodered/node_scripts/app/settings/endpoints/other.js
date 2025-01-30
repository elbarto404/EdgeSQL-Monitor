/*
for (let node of tabNodes) {
    if (typeof node.y === 'number' && node.y > startY) {
        startY = node.y;
    }
}
*/


        /*
        // Check if the subflow for this table already exists
        const matchingNode = updatedNodes.find(node => 
            node.type === "subflow:dataHandler" 
            && node.env.find(e => e.name === "ENDPOINT")?.value === String(endpoint.id)
            && node.env.find(e => e.name === "TAG_TABLE")?.value === table.name
        );
        const matchingId = matchingNode ? matchingNode.id : null; 

        if (matchingId) {
            dataHandlerIds.push(matchingId);
            continue;
        }
        */



        // _________________________History Processing (edits)_______________________________
/*
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

// Add the required nodes for each table name in the endpoints (new)
for (const endpoint of endpoints) {
    // Check if the subflow for this name already exists
    const isPresent = allNodes.some(node => node.name === endpoint.name && node.type.startsWith("subflow"));

    if (!isPresent) {
        // Add the required nodes for this name
        const newNodes = createNodesForItem(endpoint);
        startY += 100; // Increase the maximum Y coordinate
        updatedNodes.push(...newNodes);
        const settingsOut = updatedNodes.find(node => node.id === "bc31f07c227e2c67");
        settingsOut.links.push(newNodes[1].id);
        settingsOut.links.sort();
        deployNeded = true;
    }
}

// Remove nodes that not correspond to endpoints (delete)
const namesInData = endpoints.map(endpoint => endpoint.name);
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
*/