function escapeValue(value) {
    if (value === null || value === undefined) {
        // Handles NULL values
        return 'NULL';
    }
    else if (Array.isArray(value) || typeof value === 'object') {
        // Convert arrays and objects to JSON, then escape single quotes
        const jsonString = JSON.stringify(value);
        return `${jsonString.replace(/'/g, "''")}`;
    }
    else if (typeof value === 'string') {
        // Escapes dangerous characters like single quotes ('), 
        // replacing them with double single quotes ('')
        return `${value.replace(/'/g, "''")}`;
    }
    else if (typeof value === 'boolean') {
        // PostgreSQL uses 'TRUE'/'FALSE' for boolean values
        return value ? 'TRUE' : 'FALSE';
    }
    else {
        // For numbers (and other primitive types), return the value directly
        return value;
    }
}


let commands = [];
const table = escapeValue(msg.database.table);
const schema = escapeValue(msg.database.schema);
const tagsSchema = escapeValue(msg.database.tagsSchema);
const processSchema = escapeValue(msg.database.processSchema);

for (const change of msg.dashboard.history) {
    const { index, oldItem, newItem } = change;
    const oldName = oldItem ? escapeValue(oldItem.name) : null;
    const oldProcessTable = oldItem ? escapeValue(oldItem.data_table) : null;

    if (oldItem && !newItem) {
        // Case: deletion
        commands.push(`DELETE FROM "${schema}"."${table}"WHERE name = '${oldName}';`);
        commands.push(`DROP TABLE IF EXISTS "${tagsSchema}"."${oldName}";`);
        commands.push(`DROP TABLE IF EXISTS "${processSchema}"."${oldProcessTable}";`);

    } else if (!oldItem && newItem) {
        // Case: insertion
        const keys = Object.keys(newItem);
        const values = Object.values(newItem)
            .map(value => `'${escapeValue(value)}'`) // Escape values
            .join(', ');
        commands.push(`INSERT INTO "${schema}"."${table}" (${keys.join(', ')}) VALUES (${values});`);
        // New nodes autocreate the table

    } else if (oldItem && newItem) {
        // Case: update
        const updates = Object.keys(newItem)
            .map(key => `${key} = '${escapeValue(newItem[key])}'`) // Escape values
            .join(', ');
        commands.push(`UPDATE "${schema}"."${table}" SET ${updates} WHERE name = '${oldName}';`);
        if (oldName !== newItem.name) {
            commands.push(`ALTER TABLE IF EXISTS "${tagsSchema}"."${oldName}" RENAME TO "${escapeValue(newItem.name)}";`);
        }
        if (oldProcessTable !== newItem.data_table) {
            commands.push(`ALTER TABLE IF EXISTS "${processSchema}"."${oldProcessTable}" RENAME TO "${escapeValue(newItem.data_table)}";`);
        }
    }
}

// Constructs the PL/pgSQL block
msg.query = `
DO $$
BEGIN
    ${commands.join('\n')}
END $$;
`;

msg.target = msg.database.name;
msg.topic = 'deploy_changes';
return msg;
