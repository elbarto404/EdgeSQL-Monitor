CREATE TABLE IF NOT EXISTS production_data (
    cycle_id INTEGER PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    shaft_combustion INTEGER,
    limestone_cycle NUMERIC,
    limestone_cycle_setpoint NUMERIC,
    lime_cycle NUMERIC,
    nominal_prod NUMERIC,
    shaft1_strokes INTEGER,
    shaft2_strokes INTEGER
);

--  insert  --

INSERT INTO production_data (
    cycle_id,
    shaft_combustion,
    limestone_cycle,
    limestone_cycle_setpoint,
    lime_cycle,
    nominal_prod,
    shaft1_strokes,
    shaft2_strokes
) VALUES (
    1,                      -- Progressive Cycle Number (Cyclic from 1 to 9999) [#]
    5,                      -- Shaft in Combustion [#]
    100.0,                  -- Limestone for Cycle - Process Value [kg/cycle]
    120.0,                  -- Limestone for Cycle - Setpoint [kg/cycle]
    80.0,                   -- Lime for Cycle [kg/cycle]
    500.0,                  -- Nominal Production [tpd]
    1000,                   -- Shaft 1 - Number of Total Strokes [#]
    950                     -- Shaft 2 - Number of Total Strokes [#]
);