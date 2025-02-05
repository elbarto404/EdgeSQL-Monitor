switch (msg.endpoint.protocol) {
    case 'S7': {
        msg.target = `s7control_e${msg.endpoint.id}_in`;
        msg.topic = `trigger_sent`;
        break;
    }
    case 'Modbus': {
        msg.target = `modbuscontrol_e${msg.endpoint.id}_in`;
        msg.topic = `trigger_sent`;
        break;
    }
    case 'OPC-UA': {
        msg.target = `opcuacontrol_e${msg.endpoint.id}_in`;
        msg.topic = `trigger_sent`;
        break;
    }
    case 'MQTT': {
        msg.target = `mqttcontrol_e${msg.endpoint.id}_in`;
        msg.topic = `trigger_sent`;
        break;
    }
    case 'HTTP': {
        msg.target = `httpcontrol_e${msg.endpoint.id}_in`;
        msg.topic = `trigger_sent`;
        break;
    }
    default: {
        node.error(`Invalid protocol - ${msg.endpoint.protocol}`);
        msg.topic = `trigger_sent`;
        return null;
    }
}

return msg;