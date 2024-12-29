
global.set("machines", msg.data);
msg.topic = "reload";
return [null, msg];