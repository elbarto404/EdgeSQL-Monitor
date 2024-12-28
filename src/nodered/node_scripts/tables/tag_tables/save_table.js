
global.set("tag_tables", msg.data);
msg.topic = "reload";
return [null, msg];