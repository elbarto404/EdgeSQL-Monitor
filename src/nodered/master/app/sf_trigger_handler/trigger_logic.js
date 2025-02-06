let count = context.get('count') || 0;
let trigger = context.get('trigger') || false;

if(msg.topic === "Triggerino" && (msg.payload === true || msg.payload === false)){  //Boolean Trigger
    count += 1;
    const localTime = new Date().toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
    node.status({ fill: "green", shape: "ring", text: `reading ok ${count} - at ${localTime}` });
    context.set('count', count);
    if (msg.payload !== trigger) {
        node.status({ fill: "green", shape: "ring", text: `reading ok ${count} - value changed - at ${localTime}` });
        context.set('trigger', msg.payload);
        if (msg.payload) {
            context.set('count', 0);
            node.status({ fill: "green", shape: "dot", text: "trigger sent" });
            return [{ topic: "trigger", payload: true, _msgid: msg._msgid }, null]
        }
    }
} else {
    node.status({fill:"red",shape:"dot",text:"not_recognised"});
}