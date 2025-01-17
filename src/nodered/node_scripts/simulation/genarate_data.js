// Function Node for Node-RED: Simulate Lime Kiln Data with cycle_time as the sum of other times

// Utility function to generate random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utility function to generate random float between min and max with specified decimals
function getRandomFloat(min, max, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

// Utility function to get gaussian random number between min and max with factor precision
function getGaussianRandom(min, max, decimals = 2) {
    const factor = Math.pow(10, decimals);
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Avoid zero
    while (v === 0) v = Math.random(); // Avoid zero

    // Box-Muller transform
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    // Normalize to the desired range
    let mean = (max + min) / 2;
    let stddev = (max - min) / 6; // Approx 99.7% of data within [min, max]

    let value = mean + z * stddev;

    // Clamp the value to stay within bounds and round it with the factor
    value = Math.max(min, Math.min(max, value));
    return Math.round(value * factor) / factor;
}

// Utility function to generate random float with waithed probability
function getWeightedRandomItem(items) {
    // 1) Get total weight
    let totalWeight = 0;
    for (let item of items) {
        totalWeight += item.weight;
    }

    // 2) Generate a random number in [0, totalWeight)
    let random = Math.random() * totalWeight;

    // 3) Iterate until we find which key we land on
    let sum = 0;
    for (let item of items) {
        sum += item.weight;
        if (random <= sum) {
            return item;
        }
    }
    return items[-1];
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

// Define Cycle Number and Shaft
let CY = (flow.get("CY") || 0) + 1;
flow.set("CY", CY);

let S = flow.get("S") || 1;
S = S === 1 ? 2 : 1;
flow.set('S', S);

// Define setpoints
let TCYsp = context.get('TCYsp'); // Cycle time setpoint [s]
let TCOsp = context.get('TCOsp'); // Combustion time setpoint [s]
let TFSsp = context.get('TFSsp'); // Time fuel supply setpoint [s]

let LSCY1sp = context.get('LSCY1sp'); // Limestone for cycle, first charge - Setpoint [kg/cy]
let LSCY2sp = context.get('LSCY2sp'); // Limestone for cycle, second charge - Setpoint [kg/cy]
let LSCY3sp = context.get('LSCY3sp'); // Limestone for cycle, third charge - Setpoint [kg/cy]
let HCsp = context.get('HCsp'); // Heat consumption - Setpoint [kcal/kg]
let FCYsp = context.get('FCYsp'); // Fuel for Cycle - Setpoint [m3(n)/cy]
let EANsp = context.get('EANsp'); // Combustion air index (Excess of air) - Setpoint [#]
let ALCsp = context.get('ALCsp'); // Lime cooling air ratio - Setpoint [#]

// Define cycle times for different operations
let TCY = 0;
let TCO = 0;
let TFS = 0;
let TI = 0;

let TWaitPar = context.get('TWaitPar') // weight for probaility, min time, max time
let TWaitAll = TWaitPar.reduce((acc, item) => ({ ...acc, [item.name]: 0 }), {});

let TOffPar = context.get('TOffPar') // weight for probaility, min time, max time
let TOffAll = TOffPar.reduce((acc, item) => ({ ...acc, [item.name]: 0 }), {});

// Randomly generate maintenance or issue
let flag_maintenance = getRandomInt(0, 100) < context.get('maintenance_probability'); // % chance of maintenance
let flag_issue = getRandomInt(0, 100) < context.get('issue_probability'); // % chance of issue

// Cycles with issues
if (flag_issue) {
    let issue = getWeightedRandomItem(TOffPar);
    let time = getRandomFloat(issue.tRange[0], issue.tRange[1]);
    for (let item of TOffPar) {
        if (issue === item) { TOffAll[item.name] = time; }
    }

    flag_maintenance = getRandomInt(0, 100) < 50; // 50% chance of maintenance after issue

    TCY = getRandomFloat(TCYsp * 0.2, TCYsp * 0.8);
    TCO = getRandomFloat(Math.min(TCOsp * 0.1, TCY), Math.min(TCOsp * 0.8, TCY));
    TFS = getRandomFloat(Math.min(TFSsp * 0.1, TCO), Math.min(TFSsp * 0.8, TCO));
    TI = TCY - TCO;

    // Cycles without issues
} else {
    TCY = getGaussianRandom(TCYsp * 0.9, TCYsp * 1.1);
    TCO = getGaussianRandom(TCOsp * 0.9, Math.min(TCOsp * 1.1, TCY));
    TFS = getGaussianRandom(TFSsp * 0.9, Math.min(TFSsp * 1.1, TCO));
    TI = TCY - TCO;
}

// Cycles with maintenance
if (flag_maintenance) {
    for (let i = 0; i < getRandomInt(1, 3); i++) { // 1 to 3 maintenances types
        let maintenance = getWeightedRandomItem(TWaitPar);
        let time = getRandomFloat(maintenance.tRange[0], maintenance.tRange[1]);
        for (let item of TWaitPar) {
            if (maintenance === item) { TWaitAll[item.name] = time; }
        }
    }
}

let TWait = Math.max(...Object.values(TWaitAll)); // max of all TWait values
let TOff = Math.max(...Object.values(TOffAll)); // max of all TOff values
let TStop = TWait + TOff;

let LSCYsp = LSCY1sp + LSCY2sp + LSCY3sp; // Limestone for cycle - Setpoint [kg/cy]
let LSCYpv = getGaussianRandom(LSCYsp * 0.9, LSCYsp * 1.1); // Limestone for cycle - Process Value [kg/cy]
let LCY = getGaussianRandom(LSCYpv * 0.7, LSCYpv * 0.9); // Lime for cycle [kg/cy]
let NP = LCY / (TCY + TStop) * 86.4; // Nominal production [tpd]

let S1PS = getGaussianRandom(LCY / 15, LCY / 10, 0); // Shaft 1 - Prim Number of Strokes
let S1SS = getGaussianRandom(LCY / 15, LCY / 10, 0); // Shaft 1 - Sec Number of Strokes
let S2PS = getGaussianRandom(LCY / 15, LCY / 10, 0); // Shaft 2 - Prim- Number of Strokes
let S2SS = getGaussianRandom(LCY / 15, LCY / 10, 0); // Shaft 2 - Sec- Number of Strokes
let S1tot = S1PS + S1SS; // Shaft 1 - Number of Total Strokes [#]
let S2tot = S2PS + S2SS; // Shaft 2 - Number of Total Strokes [#]

let ATMP = getGaussianRandom(1000, 1020); // Barometric pressure [mbar]

// flow set: TCY, TOff, TWait
flow.set('TCY', TCY);
flow.set('TOff', TOff);
flow.set('TWait', TWait);

// Return the initial values for the simulation
const initialValues = {
    CY: CY, // Progressive Cycle Number (1 to 99999)[#]
    S: S, // Shaft in combustion [#]
    TCY: TCY, // Cycle time [s]
    TCO: TCO, // Combustion time [s]
    TI: TI, // Inversion time [s]
    TStop: TStop, // Time Cycle Disabled [s]
    TFS: TFS, // Time fuel supply [s]
    LSCYpv: LSCYpv, // Limestone for cycle - Process Value [kg/cy]
    LSCYsp: LSCYsp, // Limestone for cycle - Setpoint [kg/cy]
    LCY: LCY, // Lime for cycle [kg/cy]
    NP: NP, // Nominal production [tpd]
    HCpv: getGaussianRandom(5000 * 0.9, 5000 * 1.1), // Heat consumption - Process Value [kcal/kg]
    HCsp: 5000, // Heat consumption - Setpoint [kcal/kg]
    FCYpv: getGaussianRandom(60 * 0.9, 60 * 1.1), // Fuel for cycle Process Value [Nm3/cy]
    FCYsp: 60, // Fuel for Cycle - Setpoint [m3(n)/cy]
    FFpv: 100, // Fuel flow - Process Value [Nm3/h]
    FFsp: getGaussianRandom(100 * 0.9, 100 * 1.1), // Fuel Flow - Set Point
    LHV: 7000, // Low heat value [kacl/Nm3]
    SA: 25, // Stoichiometric air [#]
    CAF: getGaussianRandom(300 * 0.9, 300 * 1.1), // Combustion air flow [Nm3/h]
    EANpv: getGaussianRandom(30 * 0.9, 30 * 1.1), // Combustion air index - Process Value [#]
    EANsp: 30, // Combustion air index (Excess of air) - Setpoint [#]
    LCAF: getGaussianRandom(400 * 0.9, 400 * 1.1), // Lime cooling air flow [Nm3/h]
    ALCpv: getGaussianRandom(40 * 0.9, 40 * 1.1),  // Lime cooling air ratio - Process Value [#]
    ALCsp: 40, // Lime cooling air ratio - Setpoint [#]
    TC1: getGaussianRandom(90, 110), // Channel temperature 1 [�C]
    TC2: getGaussianRandom(90, 110), // Channel temperature 2 [�C]
    TWG: getGaussianRandom(120, 140), // Waste gases temperature-outlet kiln [�C]
    TFLT: getGaussianRandom(90, 110), // Waste gases temperature-inlet kiln filter [�C]
    LT1: getGaussianRandom(350, 400), // Skip side Shaft 1 - lime temperature (Inspection door ZS204101)
    LT2: getGaussianRandom(150, 250), // External side Shaft 1 - lime temperature (Inspection door ZS204102)
    LT3: getGaussianRandom(150, 250), // External side Shaft 1 - lime temperature (Inspection door ZS204103)
    LT4: getGaussianRandom(500, 700), // Pipe side Shaft 1 - lime temperature (Inspection door ZS204104)
    LT5: getGaussianRandom(500, 700), // Pipe side Shaft 1 - lime temperature (Inspection door ZS204105)
    LT6: getGaussianRandom(600, 800), // Internal side Shaft 1 - lime temperature (Inspection door ZS204106)
    LT7: getGaussianRandom(600, 800), // Internal side Shaft 1 - lime temperature (Inspection door ZS204107)
    LT8: getGaussianRandom(350, 400), // Skip side Shaft 1 - lime temperature (Inspection door ZS204109)
    LT9: getGaussianRandom(350, 400), // Skip side Shaft 2 - lime temperature (Inspection door ZS204201)
    LT10: getGaussianRandom(150, 250), // External side Shaft 2 - lime temperature (Inspection door ZS204202)
    LT11: getGaussianRandom(150, 250), // External side Shaft 2 - lime temperature (Inspection door ZS204203)
    LT12: getGaussianRandom(500, 700), // Pipe side Shaft 2 - lime temperature (Inspection door ZS204204)
    LT13: getGaussianRandom(500, 700), // Pipe side Shaft 2 - lime temperature (Inspection door ZS204205)
    LT14: getGaussianRandom(600, 800), // Internal side Shaft 2 - lime temperature (Inspection door ZS204206)
    LT15: getGaussianRandom(600, 800), // Internal side Shaft 2 - lime temperature (Inspection door ZS204207)
    LT16: getGaussianRandom(350, 400), // Skip side Shaft 2 - lime temperature (Inspection door ZS204209)
    CBAP: getGaussianRandom(50, 100), // Combustion air pressure [mbar]
    CLAP: getGaussianRandom(50, 100), // Lime cooling air pressure [mbar]
    CHAP: getGaussianRandom(50, 100), // Channel air pressure [mbar]
    CTAP: getGaussianRandom(50, 100), // Transport air pressure [mbar]
    ATMP: ATMP, // Barometric pressure [mbar]
    LCAPS1: getGaussianRandom(50, 100), // Shaft 1 - Lances cooling / Final injection air pressure [mbar]
    LCAPS2: getGaussianRandom(50, 100), // Shaft 2 - Lances cooling / Final injection air pressure [mbar]
    S1tot: S1tot, // Shaft 1 - Number of Total Strokes [#]
    S1PS: S1PS, // Shaft 1 - Prim Number of Strokes
    S1SS: S1SS, // Shaft 1 - Sec Number of Strokes
    S2tot: S2tot, // Shaft 2 - Number of Total Strokes [#]
    S2PS: S2PS, // Shaft 2 - Prim- Number of Strokes
    S2SS: S2SS, // Shaft 2 - Sec- Number of Strokes
    DBLINE1: getGaussianRandom(0, 5), // Delta pressure line 1 - Fuel coal [mbar]
    DBLINE2: getGaussianRandom(0, 5), // Delta pressure line 2 - Fuel coal [mbar]
    DBLINE3: getGaussianRandom(0, 5), // Delta pressure line 3 - Fuel coal [mbar]
    DBLINE4: getGaussianRandom(0, 5), // Delta pressure line 4 - Fuel coal [mbar]
    DBLINE5: getGaussianRandom(0, 5), // Delta pressure line 5 - Fuel coal [mbar]
    DBLINE6: getGaussianRandom(0, 5), // Delta pressure line 6 - Fuel coal [mbar]
    DBLINE7: getGaussianRandom(0, 5), // Delta pressure line 7 - Fuel coal [mbar]
    DBLINE8: getGaussianRandom(0, 5), // Delta pressure line 8 - Fuel coal [mbar]
    DBLINE9: getGaussianRandom(0, 5), // Delta pressure line 9 - Fuel coal [mbar]
    RATIOS1LN1: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 1 [%]
    RATIOS1LN2: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 2 [%]
    RATIOS1LN3: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 3 [%]
    RATIOS1LN4: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 4 [%]
    RATIOS1LN5: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 5 [%]
    RATIOS1LN6: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 6 [%]
    RATIOS1LN7: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 7 [%]
    RATIOS1LN8: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 8 [%]
    RATIOS1LN9: getGaussianRandom(90, 100), // Shaft 1 - Speed ratio line 9 [%]
    RATIOS2LN1: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 1 [%]
    RATIOS2LN2: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 2 [%]
    RATIOS2LN3: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 3 [%]
    RATIOS2LN4: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 4 [%]
    RATIOS2LN5: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 5 [%]
    RATIOS2LN6: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 6 [%]
    RATIOS2LN7: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 7 [%]
    RATIOS2LN8: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 8 [%]
    RATIOS2LN9: getGaussianRandom(90, 100), // Shaft 2 - Speed ratio line 9 [%]
    S1SPEEDL1: getGaussianRandom(10, 20), // Shaft 1 - Speed line 1 - Process value [rpm]
    S1SPEEDL2: getGaussianRandom(10, 20), // Shaft 1 - Speed line 2 - Process value [rpm]
    S1SPEEDL3: getGaussianRandom(10, 20), // Shaft 1 - Speed line 3 - Process value [rpm]
    S1SPEEDL4: getGaussianRandom(10, 20), // Shaft 1 - Speed line 4 - Process value [rpm]
    S1SPEEDL5: getGaussianRandom(10, 20), // Shaft 1 - Speed line 5 - Process value [rpm]
    S1SPEEDL6: getGaussianRandom(10, 20), // Shaft 1 - Speed line 6 - Process value [rpm]
    S1SPEEDL7: getGaussianRandom(10, 20), // Shaft 1 - Speed line 7 - Process value [rpm]
    S1SPEEDL8: getGaussianRandom(10, 20), // Shaft 1 - Speed line 8 - Process value [rpm]
    S1SPEEDL9: getGaussianRandom(10, 20), // Shaft 1 - Speed line 9 - Process value [rpm]
    S2SPEEDL1: getGaussianRandom(10, 20), // Shaft 2 - Speed line 1 - Process value [rpm]
    S2SPEEDL2: getGaussianRandom(10, 20), // Shaft 2 - Speed line 2 - Process value [rpm]
    S2SPEEDL3: getGaussianRandom(10, 20), // Shaft 2 - Speed line 3 - Process value [rpm]
    S2SPEEDL4: getGaussianRandom(10, 20), // Shaft 2 - Speed line 4 - Process value [rpm]
    S2SPEEDL5: getGaussianRandom(10, 20), // Shaft 2 - Speed line 5 - Process value [rpm]
    S2SPEEDL6: getGaussianRandom(10, 20), // Shaft 2 - Speed line 6 - Process value [rpm]
    S2SPEEDL7: getGaussianRandom(10, 20), // Shaft 2 - Speed line 7 - Process value [rpm]
    S2SPEEDL8: getGaussianRandom(10, 20), // Shaft 2 - Speed line 8 - Process value [rpm]
    S2SPEEDL9: getGaussianRandom(10, 20), // Shaft 2 - Speed line 9 - Process value [rpm]
    COALTANKP: getGaussianRandom(200, 250), // Fuel Coal - Pressure weighed tank T235301_1 [mbar]
    COALTANKT: getGaussianRandom(200, 250), // Fuel Coal - Temperature weighed tank T235301_1 [�C]
    HYT: getGaussianRandom(20, 30), // Hydraulic Oil - Temperature [�C]
    HYP: getGaussianRandom(150, 200), // Hydraulic Oil - Pressure [bar]
    TWait: TWait, // Waitnig Time [s]
    TOff: TOff, // Unavailability time [s]
    TWait1: TWaitAll.TWait1, // Drawer Sampling [s]
    TWait2: TWaitAll.TWait2, // Valves time maintenance [s]
    TWait3: TWaitAll.TWait3, // Hydraulic oil unit time maintenance [s]
    TWait4: TWaitAll.TWait4, // Hydraulic oil plant time maintenance [s]
    TWait5: TWaitAll.TWait5, // Blower time maintenance [s]
    TWait6: TWaitAll.TWait6, // Skip time maintenance [s]
    TWait7: TWaitAll.TWait7, // Weighed hopper calibration [s]
    TWait8: TWaitAll.TWait8, // Coal weighed tank calibration [s]
    TWait9: TWaitAll.TWait9, // Other maintenance [s]
    TOff1: TOffAll.TOff1, // Mechanical issue [s]
    TOff2: TOffAll.TOff2, // Electrical issue [s]
    TOff3: TOffAll.TOff3, // Process issue[s]
    TOff4: TOffAll.TOff4, // Other issue [s]
    SKIP_ULD1CHpv: getGaussianRandom(40, 60), // ULD skip side position at first charge - Process Value [%]
    PIPE_ULD1CHpv: getGaussianRandom(40, 60), // ULD pipe side position at first charge - Process Value [%]
    ULD1CHsp: 50, // ULD position at first charge - Setpoint [%]
    SKIP_ULD2CHpv: getGaussianRandom(40, 60), // ULD skip side position at second charge - Process Value [%]
    PIPE_ULD2CHpv: getGaussianRandom(40, 60), // ULD pipe side position at second charge - Process Value [%]
    ULD2CHsp: 50, // ULD position at second charge - Setpoint [%]
    SKIP_ULD3CHpv: getGaussianRandom(40, 60), // ULD skip side position at third charge - Process Value [%]
    PIPE_ULD3CHpv: getGaussianRandom(40, 60), // ULD pipe side position at third charge - Process Value [%]
    ULD3CHsp: 50, // ULD position at third charge - Setpoint [%]
    LSCY1pv: getGaussianRandom(LSCY1sp * 0.9, LSCY1sp * 1.1), // LSCY at first charge - Process Value [Kg]
    LSCY1sp: LSCY1sp, // LSCY at first charge - Setpoint [Kg]
    LSCY2pv: getGaussianRandom(LSCY1sp * 0.9, LSCY1sp * 1.1), // LSCY at second charge - Process Value [Kg]
    LSCY2sp: LSCY2sp, // LSCY at second charge - Setpoint [Kg]
    LSCY3pv: getGaussianRandom(LSCY1sp * 0.9, LSCY1sp * 1.1), // LSCY at third charge - Process Value [Kg]
    LSCY3sp: LSCY3sp, // LSCY at third charge - Setpoint [Kg]
    TCH1: getGaussianRandom(TCY * 0.1, TCY * 0.15), // Time first charge [s]
    TCH2: getGaussianRandom(TCY * 0.2, TCY * 0.25), // Time second charge [s]
    TCH3: getGaussianRandom(TCY * 0.3, TCY * 0.35), // Time third charge [s]
    LSTARCMB: getGaussianRandom(10, 25), // Level position in shaft in combustion at cycle start [%]
    LSTOPCMB: getGaussianRandom(90, 100), // Level position in shaft in combustion at cycle end [%]
    LSTARPRH: getGaussianRandom(10, 25), // Level position in shaft in preheating at cycle start [%]
    LSTOPPRH: getGaussianRandom(90, 100), // Level position in shaft in preheating at cycle end [%]
    LVLCMBsp: getGaussianRandom(40, 50), // Setpoint level in shaft in combustion [%]
    LVLPRHsp: getGaussianRandom(30, 40), // Setpoint level in shaft in preheating [%]
    EXTCMB: 0, // Extraction Mode in Combustion [0=By level; 1=By Strokes] [#]
    EXTPRH: 0, // Extraction Mode in Preheating [0=By level; 1=By Strokes] [#]
    S1EXTAUTO: 1, // Shaft 1 - Drawmatic in automatic mode [0=Manual Mode; 1=Automatic Mode] [#]
    S2EXTAUTO: 1, // Shaft 2 - Drawmatic in automatic mode [0=Manual Mode; 1=Automatic Mode] [#]
    S1MNRATIO: 100, // Shaft 1 - Ratio Setpoint of Strokes main drawer [#]
    S1SCRATIO: 99, // Shaft 1 - Ratio Setpoint of Strokes secondary drawer [#]
    S1FSTLVL: 5, // Shaft 1 - Delay start fast extraction in level mode [s]
    S1STROKsp: Math.round(S1tot / 10) * 10, // Shaft 1 - Setpoint of total strokes [#]
    S1SDELAYsp: 2, // Shaft 1 - Setpoint delay time between two strokes [s]
    S1FSTSTRT: 4, // Shaft 1 - Delay start fast extraction in strokes mode [s]
    S2MNRATIO: 98, // Shaft 2 - Ratio Setpoint of Strokes main drawer [#]
    S2SCRATIO: 97, // Shaft 2 - Ratio Setpoint of Strokes secondary drawer [#]
    S2FSTLVL: 6, // Shaft 2 - Delay start fast extraction in level mode [s]
    S2STROKsp: Math.round(S2tot / 10) * 10, // Shaft 2 - Setpoint of total strokes [#]
    S2SDELAYsp: 3, // Shaft 2 - Setpoint delay time between two strokes [s]
    S2FSTSTR: 7, // Shaft 2 - Delay start fast extraction in strokes mode [s]
    EANAUTO: 1, // EANMATIC in automatic mode [0=Manual Mode; 1=Automatic Mode] [#]
    ALCAUTO: 1, // COOLMATIC in automatic mode [0=Manual Mode; 1=Automatic Mode] [#]
    FUELAUTO: 1, // FUELMATIC in automatic mode [0=Manual Mode; 1=Automatic Mode] [#]
    FILTERAUTO: 1, // FILTERMATIC in automatic mode [0=Manual Mode; 1=Automatic Mode] [#]
    REDAUTO: 1, // FIREREDUCTION in automatic mode [0=Manual Mode; 1=Automatic Mode] [#]
    CUTAUTO: 1, // FIRECUT in automatic mode [0=Manual Mode; 1=Automatic Mode] [#]
    TSTRREDsp: 1000, // Temperature Setpoint for start fuel reduction [�C]
    TSTPREDsp: 900, // Temperature Setpoint for stop fuel reduction [�C]
    PERCREDsp: 20, // Percentage of fuel reduction [%]
    TSTRCUTsp: 1100, // Temperature Setpoint for start fuel cut [�C]
    TSTPCUTsp: 1000, // Temperature Setpoint for stop fuel cut [�C]
    REDENABL: 1, // Fuel reduction enabled during last cycle [#]
    REDTIMEpv: TCYsp * 0.2, // Working time of Fuel reduction during last cycle [s]
    CUTENABL: 1, // Fuel cut enabled during last cycle [#]
    CUTTIMEpv: TCYsp * 0.1, // Working time of Fuel cut during last cycle [s]
    PATM: ATMP, // Barometric Pressure [mbar]
    FCVS1pv: getGaussianRandom(75, 85), // FCV Lime cooling valve - Shaft 1 - Process value [%]
    FCVS1sp: 80, // FCV Lime cooling valve - Shaft 1 - Setpoint [%]
    FCVS1AUTO: 1, // Shaft 1 - Flow Control Valve in auto mode [0=Manual Mode; 1=Automatic Mode] [#]
    FCVS2pv: getGaussianRandom(75, 85), // FCV Lime cooling valve - Shaft 2 - Process value [%]
    FCVS2sp: 80, // FCV Lime cooling valve - Shaft 2 - Setpoint [%]
    FCVS2AUTO: 1, // Shaft 2 - Flow Control Valve in auto mode [0=Manual Mode; 1=Automatic Mode] [#]
    CMB1pv: getGaussianRandom(1800 * 0.9, 1800 * 1.1), // Combustion Air Blower 1 - Speed - Process Value [rpm]
    CMB1sp: 1800, // Combustion Air Blower 1 - Speed - Setpoint [rpm]
    CMB2pv: getGaussianRandom(2000 * 0.9, 2000 * 1.1), // Combustion Air Blower 2 - Speed - Process Value [rpm]
    CMB2SP: 2000, // Combustion Air Blower 2 - Speed - Set Point [rpm]
    CMB3pv: getGaussianRandom(2200 * 0.9, 2200 * 1.1), // Combustion Air Blower 3 - Speed - Process Value [rpm]
    CMB3sp: 2200, // Combustion Air Blower 3 - Speed - Set Point [rpm]
    LCB1pv: getGaussianRandom(2000 * 0.9, 2000 * 1.1), // Lime Cooling Air Blower 1 - Speed - Process Value [rpm]
    LCB1sp: 2000, // Lime Cooling Air Blower 1 - Speed - Setpoint [rpm]
    LCB2pv: getGaussianRandom(2400 * 0.9, 2400 * 1.1), // Lime Cooling Air Blower 2 - Speed - Process Value [rpm]
    LCB2sp: 2400, // Lime Cooling Air Blower 2 - Speed - Set Point [rpm]
    FANpv: getGaussianRandom(1200 * 0.9, 1200 * 1.1), // Filter Fan - Speed - Process Value [rpm]
    FANsp: 1200, // Filter Fan - Speed - Setpoint [rpm]
    S1CAPSPpv: getGaussianRandom(1800 * 0.9, 1800 * 1.1), // Shaft 1 - Lances cooling blower - Speed - Process value [rpm]
    S1CAPSPsp: 1800, // Shaft 1 - Lances cooling blower - Speed - Setpoint [rpm]
    S2CAPSPpv: getGaussianRandom(1800 * 0.9, 1800 * 1.1), // Shaft 2 - Lances cooling blower - Speed - Process value [rpm]
    S2CAPSPsp: 1800, // Shaft 2 - Lances cooling blower - Speed - Setpoint [rpm]
    CTBSPpv: getGaussianRandom(1400 * 0.9, 1400 * 1.1), // Transport air - Speed - Process value [rpm]
    CTBSPsp: 1400, // Transport air - Speed - Setpoint [rpm]
    CMB1CUR: getGaussianRandom(150, 200), // Combustion Air Blower 1 - Current - Process Value
    CMB2CUR: getGaussianRandom(150, 200), // Combustion Air Blower 2 - Current - Process Value
    CMB3CUR: getGaussianRandom(150, 200), // Combustion Air Blower 3 - Current - Process Value
    LCB1CUR: getGaussianRandom(150, 200), // Lime Cooling Air Blower 1 - Current - Process Value
    LCB2CUR: getGaussianRandom(150, 200), // Lime Cooling Air Blower 2 - Current - Process Value
    FANCUR: getGaussianRandom(100, 150), // Filter Fan - Current - Process Value
    S1CAPCUR: getGaussianRandom(150, 200), // Shaft 1 - Lance cooling blower - Current - Process value
    S2CAPCUR: getGaussianRandom(150, 200), // Shaft 2 - Lance cooling blower - Current - Process value
    CTBCURR: getGaussianRandom(200, 250), // Transport air - Current - Process value
    HYDP1CUR: getGaussianRandom(75, 100), // Hydraulic Unit - Pump 1 - Current
    HYDP2CUR: getGaussianRandom(75, 100), // Hydraulic Unit - Pump 2 - Current
};

/*
// Generate simulated data
let initialValues = {
    CY: CY,
    
    // Production Data
    S: shaft, // e.g., number of combustions
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

*/


// Assign the payload to msg.payload
msg.topic = "simulated_data";
msg.payload = initialValues;

// Return the message
return msg;
