try {
    // Validate that msg.payload is an array
    if (!Array.isArray(msg.payload)) {
        node.warn("msg.payload is not an array");
        return msg;
    }

    // Validate that msg.columns exists and is a non-empty string
    if (!msg.columns || typeof msg.columns !== 'string') {
        node.warn("msg.columns is undefined or not a string");
        return msg;
    }

    // Store payload in global context
    global.set("machines", msg.payload);

    // Clear payload to prevent unintended propagation
    msg.payload = null;
    return msg;

} catch (error) {
    node.error(`An error occurred: ${error.message}`);
    return msg;
}
