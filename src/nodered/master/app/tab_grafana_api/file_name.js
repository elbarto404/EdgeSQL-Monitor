let dateTime = new Date().toISOString();
msg.image_path = `/home/nodered/node-red-home/node-red-files/${dateTime}_dashboard.png`
return msg;