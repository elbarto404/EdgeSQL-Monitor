// ___________________Insert Prototypes________________________
function updateS7tags(endpoint, meta_table) {
    let suffix = '';
    if (['Continous', 'ContinousOnChange'].includes(meta_table.sampling_mode)) {
        suffix = `_${meta_table.sampling_freq}`;
    }
    const S7endpointId = `S7endpoint_e${endpoint.id}${suffix}`;
    const S7endpointNode = updatedNodes.find(node => node.id === S7endpointId);
    if (!S7endpointNode) {
        logs.push(`S7 endpoint NOT FOUND`);
        return;
    }
    logs.push(`S7 endpoint found`);
    const vartable = tags.map(tag => ({ addr: tag.address, name: tag.name }));
    const completeVartable = Array.from(
        new Map(
          [...JSON.parse(JSON.stringify(S7endpointNode.vartable)), ...vartable].map(item => [JSON.stringify(item), item])
        ).values()
      );      
    if (JSON.stringify(completeVartable) !== JSON.stringify(S7endpointNode.vartable)) {
        logs.push(`Vartable updated`);
        S7endpointNode.vartable = completeVartable;
        deployNeeded = true;
    } else {
        logs.push(`Vartable not updated (no changes)`);
    }
}


// _________________________Main_______________________________

const tags = msg.data;  // Array of all tags
const table = msg.database.table;  // Table name
const meta_table = global.get('tag_tables').find(t => t.name === table);  // Table metadata
const allNodes = msg.payload;   // Current nodes
const endpoints = global.get('endpoints');

if (!Array.isArray(tags) || !Array.isArray(allNodes)) {
    return [null, null];
}

// Filter out all "tab_connections" nodes to rigenerate them
let updatedNodes = JSON.parse(JSON.stringify(allNodes));
let deployNeeded = false;
let logs = [];

// Update endpoint nodes
for (let endpoint of endpoints) {
    logs.push(`Endpoint: ${endpoint.name}`);
    if (!endpoint.enabled || !endpoint.tag_tables.includes(table)) {
        logs.push(`Endpoint disabled or not containing ${table}`);
        continue;
    }
    switch (endpoint.protocol) {
        case "S7": {
            logs.push(`Updating S7 tags`);
            updateS7tags(endpoint, meta_table);
        }
        default:
            logs.push(`Protocol not supported`);
    }
}

let msg2 = { payload: logs };
if (deployNeeded) {
    let deploycount = global.get("dpc_tags") || 0;
    deploycount++;
    global.set("dpc_tags", deploycount);
    msg.payload = updatedNodes
    node.status({ fill: "green", shape: "dot", text: `Deploy ${deploycount} sent` });
    return [msg, msg2];
}
return [null, msg2];