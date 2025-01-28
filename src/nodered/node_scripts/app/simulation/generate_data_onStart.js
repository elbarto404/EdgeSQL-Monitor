// Define setpoints and parameters for the simulation

context.set('maintenance_probability', 10); // Maintenance probability [%]
context.set('issue_probability', 1); // Issue probability [%]

let TCYsp = env.get('CYCLE_TIME'); // Cycle time setpoint [s]
context.set('TCYsp', TCYsp);
context.set('TCOsp', 750.0); // Combustion time setpoint [s]
context.set('TFSsp', 600.0); // Time fuel supply setpoint [s]

context.set('LSCY1sp', 1800.0); // Limestone for cycle, first charge - Setpoint [kg/cy]
context.set('LSCY2sp', 1200.0); // Limestone for cycle, second charge - Setpoint [kg/cy]
context.set('LSCY3sp', 1200.0); // Limestone for cycle, third charge - Setpoint [kg/cy]
context.set('HCsp', 5000.0); // Heat consumption - Setpoint [kcal/kg]
context.set('FCYsp', 1800.0); // Fuel for Cycle - Setpoint [m3(n)/cy]
context.set('EANsp', 25.0); // Combustion air index (Excess of air) - Setpoint [#]
context.set('ALCsp', 40.0); // Lime cooling air ratio - Setpoint [#]


let TWaitPar = [  // weight for probaility, min time, max time
    { name: 'TWait1', weight: 0.65, tRange: [TCYsp * 0.05, TCYsp * 0.15] },  // Drawer Sampling [s]	
    { name: 'TWait2', weight: 0.05, tRange: [TCYsp * 0.2, TCYsp * 0.8] },  // Valves Maintenance [s]
    { name: 'TWait3', weight: 0.05, tRange: [TCYsp * 0.8, TCYsp * 2.0] },  // Hydraulic Oil Unit Maintenance [s]
    { name: 'TWait4', weight: 0.05, tRange: [TCYsp * 1.0, TCYsp * 3.0] },  // Hydraulic Oil Plant Maintenance [s]
    { name: 'TWait5', weight: 0.05, tRange: [TCYsp * 0.5, TCYsp * 1.5] },  // Blower Maintenance [s]
    { name: 'TWait6', weight: 0.05, tRange: [TCYsp * 0.4, TCYsp * 2.0] },  // Skip Maintenance [s]
    { name: 'TWait7', weight: 0.02, tRange: [TCYsp * 0.2, TCYsp * 0.4] },  // Weighed hopper calibration [s]
    { name: 'TWait8', weight: 0.02, tRange: [TCYsp * 0.2, TCYsp * 0.5] },  // Coal weighed tank calibration [s]
    { name: 'TWait9', weight: 0.06, tRange: [TCYsp * 0.5, TCYsp * 2.0] }   // Other Maintenance [s]
];
context.set('TWaitPar', TWaitPar);

let TOffPar = [  // weight for probaility, min time, max time
    { name: 'TOff1', weight: 0.30, tRange: [TCYsp * 1.0, TCYsp * 3.0] },   // Mechanical Issue [s]
    { name: 'TOff2', weight: 0.20, tRange: [TCYsp * 0.5, TCYsp * 2.0] },   // Electrical Issue [s]
    { name: 'TOff3', weight: 0.30, tRange: [TCYsp * 0.5, TCYsp * 2.0] },   // Process Issue [s]
    { name: 'TOff4', weight: 0.20, tRange: [TCYsp * 0.5, TCYsp * 3.0] }    // Other Issue [s]
];
context.set('TOffPar', TOffPar);

// Reset simulation running status
context.set('simulationRunning', false);