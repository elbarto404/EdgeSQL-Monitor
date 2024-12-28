
global.set("endpoints", msg.data);
msg.topic = "reload";
return [null, msg];