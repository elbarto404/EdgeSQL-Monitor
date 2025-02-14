if (msg.topic === 'reset_counters') {
    context.set("bad_status", 0);
    context.set("good_status", 0);
    context.set("warning_status", 0);
    context.set("other_status", 0);
    context.set("unknown_status", 0);
    msg.payload = 'done'
    return [msg, msg];
}

// Monitor and classify the global status of the system
let bad_status = context.get("bad_status") || 0;
let good_status = context.get("good_status") || 0;
let warning_status = context.get("warning_status") || 0;
let other_status = context.get("other_status") || 0;
let unknown_status = context.get("unknown_status") || 0;
let system_status = "";

if (msg.status && msg.status.fill) {
    switch (msg.status.fill) {
        case "red":
            bad_status++;
            system_status = "bad";
            break;
        case "green":
        case "blue":
            good_status++;
            system_status = "good";
            break;
        case "yellow":
            warning_status++;
            system_status = "warning";
            break;
        default:
            other_status++;
            system_status = "other";
            break;
    }

    // Save updated values in context
    context.set("bad_status", bad_status);
    context.set("good_status", good_status);
    context.set("warning_status", warning_status);
    context.set("other_status", other_status);
} else {
    unknown_status++;
    system_status = "unknown";
    context.set("unknown_status", unknown_status);
}

// Update Node-RED status
node.status({
    fill: "green",
    shape: "ring",
    text: `Good: ${good_status} | Warning: ${warning_status} | Bad: ${bad_status} | Other: ${other_status} | Unknown: ${unknown_status}`
});

msg = { type: system_status, ...msg }
return [msg, system_status === 'good' ? null : msg];
