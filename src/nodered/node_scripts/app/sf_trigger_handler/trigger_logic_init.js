let trigger = global.get('triggers').find(t => t.id === env.get('TRIGGER_ID'));
let endpoint = global.get('endpoints').find(e => e.name === trigger.endpoint);
let meta_table = global.get('tag_tables').find(tt => tt.name === trigger.tag_table);

context.set('trigger', trigger);
context.set('endpoint', endpoint);
context.set('meta_table', meta_table);