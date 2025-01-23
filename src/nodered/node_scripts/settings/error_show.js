msg.dashboard.snackbar = {
    show: true,
    text: `${msg.title} - ${msg.topic} error: ${msg.error.message}`,
    color: "red-lighten-3"
}

node.status({ fill: "red", shape: "dot", text: msg.dashboard.snackbar.text });

msg.dashboard.history = [];

msg.dashboard.loading = false;

return msg;