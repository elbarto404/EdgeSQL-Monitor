// Function Node for Node-RED: Simulate Lime Kiln Data with cycle_time as the sum of other times

// Utility function to generate random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility function to generate random float between min and max with specified decimals
function getRandomFloat(min, max, decimals=2) {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

// Helper function to distribute total time into 'count' random parts
function distributeTime(total, count) {
    if (count === 0) return [];
    if (count === 1) return [total];
    
    let points = [];
    for (let i = 0; i < count - 1; i++) {
        points.push(Math.random());
    }
    points.sort((a, b) => a - b);
    
    let times = [];
    let prev = 0;
    for (let i = 0; i < points.length; i++) {
        times.push(Math.round((points[i] - prev) * total));
        prev = points[i];
    }
    times.push(Math.round((1 - prev) * total));
    
    return times;
}

let cycle_id = flow.get("cycle_id") + 1;

// Generate simulated data
let payload = {
    cycle_id: cycle_id,
    
    // Production Data
    shaft_combustion: getRandomInt(50, 150), // e.g., number of combustions
    limestone_cycle: getRandomFloat(100.0, 500.0), // tons per cycle
    limestone_cycle_setpoint: 400.0, // target tons per cycle
    lime_cycle: getRandomFloat(200.0, 600.0), // tons produced per cycle
    nominal_prod: 500.0, // nominal production capacity in tons
    shaft1_strokes: getRandomInt(1000, 5000),
    shaft2_strokes: getRandomInt(1000, 5000),
    
    // Fuel Data
    heat_consumption: getRandomFloat(1000.0, 5000.0), // e.g., kJ
    heat_consumption_setpoint: 4000.0,
    fuel_cycle: getRandomFloat(200.0, 800.0), // liters per cycle
    fuel_cycle_setpoint: 600.0,
    fuel_flow: getRandomFloat(50.0, 300.0), // liters per hour
    fuel_flow_setpoint: 250.0,
    natural_gas_output_regulator: getRandomFloat(1.0, 5.0), // regulator setting
    
    // Air Data
    low_heat_val_air_calc: getRandomFloat(0.5, 2.0),
    stoich_air_calc: getRandomFloat(1.0, 3.0),
    combustion_air_flow_theo: getRandomFloat(500.0, 1500.0), // theoretical air flow
    combustion_air_flow: getRandomFloat(450.0, 1600.0),
    combustion_air_index: getRandomFloat(0.95, 1.05),
    combustion_air_index_setpoint: 1.00,
    combustion_air_blower_speed: getRandomFloat(1500.0, 2500.0), // RPM
    combustion_air_blower_speed_setpoint: 2000.0,
    cool_air_flow_theo: getRandomFloat(300.0, 1000.0),
    cool_air_flow: getRandomFloat(350.0, 950.0),
    cool_air_ratio: getRandomFloat(1.0, 2.0),
    cool_air_ratio_setpoint: 1.5,
    cool_air_blower_speed: getRandomFloat(1000.0, 2000.0),
    cool_air_blower_speed_setpoint: 1500.0,
    
    // Temperatures
    channel_temp1: getRandomFloat(200.0, 800.0), // °C
    channel_temp2: getRandomFloat(200.0, 800.0),
    waste_gases_temp_outlet_kiln: getRandomFloat(300.0, 900.0),
    waste_gases_temp_inlet_kiln_filter: getRandomFloat(150.0, 400.0),
    shaft1_drawer_pipe_temp: getRandomFloat(100.0, 300.0),
    shaft1_drawer_skip_temp: getRandomFloat(100.0, 300.0),
    shaft2_drawer_pipe_temp: getRandomFloat(100.0, 300.0),
    shaft2_drawer_skip_temp: getRandomFloat(100.0, 300.0),
    natural_gas_temp: getRandomFloat(20.0, 100.0), // °C
    hydraulic_oil_temp: getRandomFloat(40.0, 90.0), // °C
    
    // Pressures
    combustion_air_pressure: getRandomFloat(1.0, 5.0), // bar
    lime_cool_air_pressure: getRandomFloat(1.0, 5.0),
    channel_air_pressure: getRandomFloat(1.0, 5.0),
    shaft1_lances_cool_air_pressure: getRandomFloat(1.0, 5.0),
    shaft2_lances_cool_air_pressure: getRandomFloat(1.0, 5.0),
    natural_gas_pressure: getRandomFloat(1.0, 5.0),
    hydraulic_oil_pressure: getRandomFloat(10.0, 100.0), // bar
    
    // Cycle Times (to be defined below)
    // cycle_time will be set as the sum of the following times:
    // combustion_time, inversion_time, cycle_disabled_time, fuel_supply_time,
    // waiting_time, unavailability_time, drawer_sampling_time, valves_maint_time,
    // hyd_oil_unit_maint_time, hyd_oil_plant_maint_time, blower_maint_time,
    // skip_maint_time, limestone_hopper_time, other_maint_time,
    // mechanical_issue_time, electrical_issue_time, process_issue_time,
    // other_issue_time
};

// Define cycle_time between 10 and 15 minutes (600 to 900 seconds)
let cycle_time = getRandomInt(600, 900); // in seconds
payload.cycle_time = cycle_time;

// List of other time-related variables to distribute cycle_time
let timeVariables = [
    "combustion_time",
    "inversion_time",
    "cycle_disabled_time",
    "fuel_supply_time",
    "waiting_time",
    "unavailability_time",
    "drawer_sampling_time",
    "valves_maint_time",
    "hyd_oil_unit_maint_time",
    "hyd_oil_plant_maint_time",
    "blower_maint_time",
    "skip_maint_time",
    "limestone_hopper_time",
    "other_maint_time",
    "mechanical_issue_time",
    "electrical_issue_time",
    "process_issue_time",
    "other_issue_time"
];

// Distribute cycle_time among the other time variables
let distributedTimes = distributeTime(cycle_time, timeVariables.length);

// Assign the distributed times to the payload
for (let i = 0; i < timeVariables.length; i++) {
    payload[timeVariables[i]] = distributedTimes[i];
}

// Continue assigning other variables that are not part of cycle_time
// Example: If there are other variables not related to cycle_time, assign them here
// (In this case, all time-related variables are handled above)

flow.set("cycle_id", cycle_id);

// Assign the payload to msg.payload
msg.topic = "simulated_data";
msg.payload = payload;

// Return the message
return msg;
