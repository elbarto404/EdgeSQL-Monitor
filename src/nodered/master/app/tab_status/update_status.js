let logs = [];
if (msg.status && msg.status.source && msg.status.source.type) {
    logs.push(`Source type: ${msg.status.source.type}`);
    switch (msg.status.source.type) {
        case "s7 in":
            logs.push(`Source ID: ${msg.status.source.id}`);

            // Data S7 Endpoint
            let match = msg.status.source.id.match(/e(\d+)/);
            let endpointID = match ? parseInt(match[1], 10) : null;
            logs.push(`Data Match: ${match}, Endpoint ID: ${endpointID}`);
            if (endpointID) {
                let endpoints = global.get("endpoints") || [];
                let endpoint = endpoints.find(e => e.id === endpointID);
                logs.push(`Endpoint: ${endpoint}`);
                if (endpoint) {
                    endpoint.status = msg.status.fill;
                    node.status({ fill: msg.status.fill, shape: "ring", text: `${endpoint.name} - ${msg.status.text}` });
                    global.set("endpoints", endpoints);
                    if (msg.status.fill === "red") {
                        if (endpoint.tag_tables.length > 0) {
                            for (let tableName of endpoint.tag_tables) {
                                let tagTable = global.get(tableName) || [];
                                for (let tag of tagTable) {
                                    tag[endpoint.name] = "red";
                                }
                                global.set(tableName, tagTable);
                            }
                        }
                    }
                }
            }

            // Trigger S7 Endpoint
            match = msg.status.source.id.match(/trig(\d+)/);
            let triggerID = match ? parseInt(match[1], 10) : null;
            logs.push(`Trigger Match: ${match}, Trigger ID: ${triggerID}`);
            if (triggerID) {
                let triggers = global.get("triggers") || [];
                let trigger = triggers.find(e => e.id === triggerID);
                logs.push(`Trigger: ${trigger}`);
                
                if (trigger) {
                    trigger.status = msg.status.fill;
                    global.set("triggers", triggers);
                    let endpoints = global.get("endpoints") || [];
                    let endpoint = endpoints.find(e => e.name === trigger.endpoint);
                    logs.push(`Endpoint: ${endpoint}`);
                    if (endpoint) {
                        endpoint.status = msg.status.fill;
                        node.status({ fill: msg.status.fill, shape: "ring", text: `${endpoint.name} - ${msg.status.text}` });
                        global.set("endpoints", endpoints);
                    }
                }
            }
            
            break;

        default:
            break;
    }
}
msg.logs = logs;
return msg;
