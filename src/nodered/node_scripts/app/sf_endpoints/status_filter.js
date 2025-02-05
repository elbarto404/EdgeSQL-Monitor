if (msg.status){
    msg.status.fill = msg.status.fill || "green";
    msg.status.shape = msg.status.shape || "dot";
    if (!msg.status.text || msg.status.text === "0"){
        const localTime = new Date().toLocaleString("it-IT", { timeZone: global.get('tz') }).replace(',', '');
        msg.status.text = `last update: ${localTime}`;
    }
    if (msg.status.fill === "blue") {
        msg.status.fill = "green"
    }
    return msg;
}
return null
