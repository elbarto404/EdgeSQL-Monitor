function parseValue(value) {
    // Remove leading/trailing quotes if they exist
    if ((value.startsWith('"[') && value.endsWith(']"')) || (value.startsWith('"{') && value.endsWith('}"'))) {
        value = value.slice(1, -1).replace(/""/g, '"');
    }
    // Parse as JSON if its an object
    if ((value.startsWith('[') && value.endsWith(']')) || (value.startsWith('{') && value.endsWith('}'))) {
        try {
            return JSON.parse(value);
            } catch (error) {
            console.log("ERROR");
            return value;
            }
    }
    console.log("Other type");
    return value

  }
  
  const value = '"[""value1"", ""value2""]"'; // example
  console.log(`${JSON.stringify(parseValue(value))}`); 
  // => [ 'value1', 'value2' ]
  