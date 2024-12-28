const removeExtension = filename => filename.replace(/\.[^/.]+$/, "");

msg.title = removeExtension(env.get("FILE_NAME"));

msg.file = {};
msg.file.name = env.get("FILE_NAME");
msg.file.title = msg.title;
msg.file.directory = env.get("FILE_DIR");
msg.file.path = "/home/nodered/node-red-home/node-red-files/" + msg.file.directory + msg.file.name;
return msg