if (msg.topic === 'update_last_id' && !msg.error) {
    if (msg.payload && msg.payload.length) {
        flow.set('last_time', msg.payload[0].created_at);
        flow.set('CY', msg.payload[0].cy);
        flow.set('TCY', msg.payload[0].tcy);
        flow.set('TOff', msg.payload[0].toff);
        flow.set('TWait', msg.payload[0].twait);
    } else {
        flow.set('last_time', new Date().toISOString());
        flow.set('CY', 0);
        flow.set('TCY', 0);
        flow.set('TOff', 0);
        flow.set('TWait', 0);
    }
}

msg = {};
msg.topic = 'start'
return msg;