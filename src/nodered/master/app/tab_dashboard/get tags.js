let tag_tables = global.get('tag_tables');
let count = 0;
for (let datum of tag_tables) {
    let table = global.get(datum.name)
    count += table.length
}
msg.payload = count
return msg;