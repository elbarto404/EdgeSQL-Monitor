// Get flow context values
let last_time = new Date(flow.get('last_time')) || new Date();
let last_CY = flow.get('CY') || 0;
let last_TCY = flow.get('TCY') || 0;
let last_TOff = flow.get('TOff') || 0;
let last_TWait = flow.get('TWait') || 0;

// Calculate the next cycle time
let new_time = last_time.getTime() + (last_TCY + last_TOff + last_TWait) * 1000;
let waitTime = new_time - Date.now();

// START - STOP simulation
if (msg.error) {
    node.status({ fill: 'red', shape: 'ring', text: `${msg.error.message}` });
    return null;
}
if (msg.topic === 'start') {
    msg = {topic: 'simulation_trigger'};
    if (context.get('simulationRunning')) {
        node.status({ fill: 'green', shape: 'ring', text: 'Simulation already running' });
        return null;  // Prevent starting a new simulation if already running
    }
    context.set('simulationRunning', true);
    node.status({ fill: 'blue', shape: 'ring', text: `Starting...` });
    if (waitTime <= 0) {
        msg.time = new_time;
        node.status({ fill: 'green', shape: 'dot', text: 'New Cycle Started' });
        context.set('simulationRunning', false);
        return msg;
    }
    let interval = setInterval(() => {
        waitTime -= 1000;
        if (waitTime <= 0 && context.get('simulationRunning')) {
            clearInterval(interval);
            msg.time = new_time;
            node.status({ fill: 'green', shape: 'dot', text: `New Cycle Started` });
            context.set('simulationRunning', false);
            return msg; // Send message only after waiting
        } else if (!context.get('simulationRunning')) {
            clearInterval(interval);
            node.status({ fill: 'yellow', shape: 'ring', text: 'Simulation stopped' });
        } else {
            node.status({ fill: 'green', shape: 'ring', text: ` 
                Last Cycle: ${last_CY}, 
                Created at: ${last_time.toISOString()}, 
                Waiting ${Math.ceil(waitTime / 1000)} sec
            ` });
        }
    }, 1000);
    return null;
} 
else if (msg.topic === 'stop') {
    if (!context.get('simulationRunning')) {
        node.status({ fill: 'red', shape: 'ring', text: 'No simulation running' });
        return null;  // Prevent stopping if no simulation is running
    }
    context.set('simulationRunning', false);
    node.status({ fill: 'yellow', shape: 'dot', text: 'Simulation stopped' });
    return null;
}
else {
    node.status({ fill: 'red', shape: 'ring', text: 'Invalid topic' });
    return null;
}
