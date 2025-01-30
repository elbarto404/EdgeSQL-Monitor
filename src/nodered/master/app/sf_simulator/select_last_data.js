let table_name = env.get('DATA_TABLE');
let endpoint = env.get('ENDPOINT_ID');

if (msg.error) {
    node.error(msg.error.message, msg)
    node.status({ fill: 'red', shape: 'ring', text: `${msg.error.message}` });
    return null;
}

msg = {};
msg.topic = "update";

msg.query = `

SELECT created_at, CY, TCY, TOff, TWait
FROM ${table_name}
WHERE endpoint = ${endpoint}
ORDER BY CY DESC
LIMIT 1

`;

return msg;