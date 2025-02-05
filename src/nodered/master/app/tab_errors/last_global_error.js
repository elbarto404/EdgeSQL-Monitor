if (msg.error) {
    node.status({ fill: 'red', shape: 'ring', text: msg.error.message });
}
