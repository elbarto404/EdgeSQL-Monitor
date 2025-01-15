let table_name = "data_reversy_odr_s7";

msg = {};
msg.topic = "update_last_id";

msg.query = `

SELECT created_at, CY, TCY, TOff, TWait
FROM ${table_name}
ORDER BY CY DESC
LIMIT 1

`;

return msg;