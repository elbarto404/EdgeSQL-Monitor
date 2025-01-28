// In up status:
if (msg.database.replace_all_procedures) {
    deploy_needed = true;
}

// In switch
msg.database = msg.database || {};
msg.database.name = env.get("DATABASE");
msg.database.schema = env.get("SCHEMA");
msg.database.table = tabName;
msg.database.tagsSchema = env.get("TAGS_SCHEMA");
msg.database.dataSchema = env.get("DATA_SCHEMA");

// In deploy
let replace_all_procedures = flow.get('REPLACE_ALL_PROCEDURES');
if (typeof msg.replace_all_procedures === 'boolean') {
    replace_all_procedures = msg.replace_all_procedures;
    flow.set('REPLACE_ALL_PROCEDURES', replace_all_procedures);
}

if (replace_all_procedures) {
    commands.push(`CALL create_views_by_label('${tagTable}', '${dataTable}');`);   
}
