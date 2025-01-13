let table_name = "data_odr_s7";

msg.query = `

SELECT cycle_id 
FROM ${table_name}
ORDER BY cycle_id DESC
LIMIT 1

`;

msg.topic = "update_last_id";
return msg;