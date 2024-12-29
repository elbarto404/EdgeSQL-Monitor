
global.set("machines_types", msg.data);
msg.topic = "reload";
return [null, msg];