function escapeValue(value) {
    if (value === null || value === undefined) {
        // Handles NULL values
        return 'NULL';
    }
    else if (Array.isArray(value) || typeof value === 'object') {
        // Convert arrays and objects to JSON, then escape single quotes
        const jsonString = JSON.stringify(value);
        return `'${jsonString.replace(/'/g, "''")}'`;
    }
    else if (typeof value === 'string') {
        // Escapes dangerous characters like single quotes ('), replacing them with double single quotes ('')
        return `'${value.replace(/'/g, "''")}'`;
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

function escapeIdentifier(identifier) {
    // Ensures proper escaping of column and table names using double quotes
    return `"${identifier.replace(/"/g, '""')}"`;
}

let commands = [];
const table = escapeIdentifier(msg.database.table);
const schema = escapeIdentifier(msg.database.schema);
const dataSchema = escapeIdentifier(msg.database.dataSchema);
const dataTable = escapeIdentifier(msg.database.dataTable);
const data_type_dict = global.get("data_type");

for (const change of msg.dashboard.history) {
    const { index, oldItem, newItem } = change;

    if (oldItem && !newItem) {
        // Case: deletion
        const oldName = escapeIdentifier(oldItem.name);
        commands.push(`DELETE FROM ${schema}.${table} WHERE name = ${escapeValue(oldItem.name)};`);
        commands.push(`ALTER TABLE IF EXISTS ${dataSchema}.${dataTable} DROP COLUMN IF EXISTS ${oldName};`);

    } else if (!oldItem && newItem) {
        // Case: insertion
        const keys = Object.keys(newItem).map(key => escapeIdentifier(key));
        const values = Object.values(newItem)
            .map(value => `${escapeValue(value)}`) // Escape values
            .join(', ');
        commands.push(`INSERT INTO ${schema}.${table} (${keys.join(', ')}) VALUES (${values});`);
        const data_type = data_type_dict[newItem.data_type] ? data_type_dict[newItem.data_type] : 'TEXT';
        commands.push(`ALTER TABLE IF EXISTS ${dataSchema}.${dataTable} ADD COLUMN IF NOT EXISTS ${escapeIdentifier(newItem.name)} ${data_type};`);

    } else if (oldItem && newItem) {
        // Case: update
        const updates = Object.keys(newItem)
            .map(key => `${escapeIdentifier(key)} = ${escapeValue(newItem[key])}`) // Escape values and identifiers
            .join(', ');
        commands.push(`UPDATE ${schema}.${table} SET ${updates} WHERE name = ${escapeValue(oldItem.name)};`);
        if (oldItem.name !== newItem.name) {
            commands.push(`ALTER TABLE IF EXISTS ${dataSchema}.${dataTable} RENAME COLUMN ${escapeIdentifier(oldItem.name)} TO ${escapeIdentifier(newItem.name)};`);
        }
        if (oldItem.data_type !== newItem.data_type) {
            const data_type = data_type_dict[newItem.data_type] ? data_type_dict[newItem.data_type] : 'TEXT';
            commands.push(`ALTER TABLE IF EXISTS ${dataSchema}.${dataTable} ALTER COLUMN ${escapeIdentifier(newItem.name)} TYPE ${data_type};`);
        }
    }
}

// Constructs the PL/pgSQL block
msg.query = `
DO $$ 
BEGIN
    ${commands.join('\n    ')}
END $$;
`;

msg.target = msg.database.name;
msg.topic = 'deploy_changes';
return msg;
