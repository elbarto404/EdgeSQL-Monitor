CREATE TABLE IF NOT EXISTS cycle_times (
    cycle_id INTEGER PRIMARY KEY,
    cycle_time INTEGER,
    combustion_time INTEGER,
    inversion_time INTEGER,
    cycle_disabled_time INTEGER,
    fuel_supply_time INTEGER,
    waiting_time INTEGER,
    unavailability_time INTEGER,
    drawer_sampling_time INTEGER,
    valves_maint_time INTEGER,
    hyd_oil_unit_maint_time INTEGER,
    hyd_oil_plant_maint_time INTEGER,
    blower_maint_time INTEGER,
    skip_maint_time INTEGER,
    limestone_hopper_time INTEGER,
    other_maint_time INTEGER,
    mechanical_issue_time INTEGER,
    electrical_issue_time INTEGER,
    process_issue_time INTEGER,
    other_issue_time INTEGER
);

--  insert  --

INSERT INTO cycle_times (
    cycle_id,
    cycle_time,
    combustion_time,
    inversion_time,
    cycle_disabled_time,
    fuel_supply_time,
    waiting_time,
    unavailability_time,
    drawer_sampling_time,
    valves_maint_time,
    hyd_oil_unit_maint_time,
    hyd_oil_plant_maint_time,
    blower_maint_time,
    skip_maint_time,
    limestone_hopper_time,
    other_maint_time,
    mechanical_issue_time,
    electrical_issue_time,
    process_issue_time,
    other_issue_time
) VALUES (
    1,      -- Progressive Cycle Number (Cyclic from 1 to 9999) [#]
    600,       -- Cycle Time [s]
    150,       -- Combustion Time [s]
    80,        -- Inversion Time [s]
    30,        -- Time Cycle Disabled [s]
    40,        -- Time Fuel Supply [s]
    20,        -- Waiting Time [s]
    10,        -- Unavailability Time [s]
    5,         -- Drawer Sampling [s]
    10,        -- Valves Time Maintenance [s]
    5,         -- Hydraulic Oil Unit Time Maintenance [s]
    5,         -- Hydraulic Oil Plant Time Maintenance [s]
    5,         -- Blower Time Maintenance [s]
    5,         -- Skip Time Maintenance [s]
    5,         -- Limestone Weighed Hopper Calibration [s]
    5,         -- Other Maintenance [s]
    5,         -- Mechanical Issue [s]
    5,         -- Electrical Issue [s]
    5,         -- Process Issue [s]
    5          -- Other Issue [s]
);


