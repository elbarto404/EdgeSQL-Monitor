function escapeValue(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    } else if (Array.isArray(value) || typeof value === 'object') {
        const jsonString = JSON.stringify(value);
        return `'${jsonString.replace(/'/g, "''")}'`; // Wrap JSON in single quotes
    } else if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
    } else if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE'; // PostgreSQL boolean
    } else {
        return value; // Numbers and others
    }
}

function escapeIdentifier(identifier) {
    return `"${identifier.replace(/"/g, '""')}"`; // Escape double quotes
}

let commands = [];

const table = escapeIdentifier(msg.database.table);
const schema = escapeIdentifier(msg.database.schema);
const tagsSchema = escapeIdentifier(msg.database.tagsSchema);
const dataSchema = escapeIdentifier(msg.database.dataSchema);

for (const change of msg.dashboard.history) {
    const { index, oldItem, newItem } = change;
    const oldName = oldItem ? escapeIdentifier(oldItem.name) : null;
    const oldDataTable = oldItem ? escapeIdentifier(oldItem.data_table) : null;

    if (oldItem && !newItem) {
        commands.push(`DELETE FROM ${schema}.${table} WHERE name = ${escapeValue(oldItem.name)};`);
        commands.push(`DROP TABLE IF EXISTS ${tagsSchema}.${oldName} CASCADE;`);
        commands.push(`DROP TABLE IF EXISTS ${dataSchema}.${oldDataTable} CASCADE;`);
    } else if (!oldItem && newItem) {
        const keys = Object.keys(newItem).map(escapeIdentifier);
        const values = Object.values(newItem).map(escapeValue).join(', ');
        commands.push(`INSERT INTO ${schema}.${table} (${keys.join(', ')}) VALUES (${values});`);
    } else if (oldItem && newItem) {
        const updates = Object.keys(newItem)
            .map(key => `${escapeIdentifier(key)} = ${escapeValue(newItem[key])}`)
            .join(', ');
        commands.push(`UPDATE ${schema}.${table} SET ${updates} WHERE name = ${escapeValue(oldItem.name)};`);

        if (oldItem.name !== newItem.name) {
            commands.push(`ALTER TABLE IF EXISTS ${tagsSchema}.${oldName} RENAME TO ${escapeIdentifier(newItem.name)};`);
        }
        if (oldItem.data_table !== newItem.data_table) {
            commands.push(`ALTER TABLE IF EXISTS ${dataSchema}.${oldDataTable} RENAME TO ${escapeIdentifier(newItem.data_table)};`);
        }
    }
}

msg.query = `
DO $$
BEGIN
    ${commands.join('\n')}
END $$;
`;

msg.target = msg.database.name;
msg.topic = 'database_updated';

return msg;
