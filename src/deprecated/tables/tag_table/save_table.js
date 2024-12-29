const tags = global.get("tags")  || {};
tags[msg.dashboard.table.title] = msg.data;
global.set("tags", tags);

msg.topic = "reload";
return [null, msg];