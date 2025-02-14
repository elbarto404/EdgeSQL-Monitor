let endpoint = context.get('endpoint');
let trigger = context.get('trigger');
let lastVal = context.get('lastVal');
let nowVal = undefined;

if (msg.topic === 'trigger') {
    const localTime = new Date().toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
    node.status({ fill: "green", shape: "dot", text: `${trigger.name} - Tiggered at ${localTime}` });
    return { 
        topic: 'trigger',
        time: localTime,
        trigger: trigger,
        payload: 'manual_trigger',
        _msgid: msg._msgid 
    };
}


switch (endpoint.protocol) {
    case "S7":
        nowVal = msg.payload[trigger.name];
        break;
    case "Modbus":
        nowVal = msg.payload.values[trigger.name];
        break;
    case "OPC-UA":
        nowVal = msg.payload[trigger.name];
        break;
    case "HTTP":
        nowVal = msg.payload[trigger.name];
        break;
    case "MQTT":
        nowVal = msg.payload[trigger.name];
        break;
    default:
        node.status({fill:"red",shape:"dot",text:`protocol not recognised - ${endpoint.protocol}`});
        break;
}

// node.status({fill:"blue",shape:"dot",text:`${trigger.name} - nv: ${nowVal}, lv: ${lastVal}`});
if (nowVal !== lastVal) {
    if (nowVal === undefined) {
        node.status({ fill: "red", shape: "dot", text: `${trigger.name} not found` });
        return null;
    } 
    if (nowVal === null) {
        node.status({ fill: "yellow", shape: "dot", text: `${trigger.name} has null value` });
        return null;
    }
    context.set('lastVal', nowVal);
    if(nowVal){
        const localTime = new Date().toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
        node.status({ fill: "green", shape: "dot", text: `${trigger.name} - Tiggered at ${localTime}` });
        return { 
            topic: 'trigger',
            time: localTime,
            trigger: trigger,
            payload: nowVal,
            _msgid: msg._msgid 
        };
    }
}
let lastStatus = flow.get('lastStatus');
if (lastStatus.fill === "green" && lastStatus.shape !== "ring") {
    node.status({ fill: lastStatus.fill, shape: "ring", text: lastStatus.text });
}
return null;
