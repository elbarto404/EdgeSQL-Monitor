CREATE TABLE IF NOT EXISTS pressures (
    cycle_id INTEGER PRIMARY KEY,
    combustion_air_pressure NUMERIC,
    lime_cool_air_pressure NUMERIC,
    channel_air_pressure NUMERIC,
    shaft1_lances_cool_air_pressure NUMERIC,
    shaft2_lances_cool_air_pressure NUMERIC,
    natural_gas_pressure NUMERIC,
    hydraulic_oil_pressure NUMERIC
);

--  insert  --

INSERT INTO pressures (
    cycle_id,
    combustion_air_pressure,
    lime_cool_air_pressure,
    channel_air_pressure,
    shaft1_lances_cool_air_pressure,
    shaft2_lances_cool_air_pressure,
    natural_gas_pressure,
    hydraulic_oil_pressure
) VALUES (
    1,              -- Progressive Cycle Number (Cyclic from 1 to 9999) [#]
    3500,           -- Combustion Air Pressure [mbar]
    2750,           -- Lime Cooling Air Pressure [mbar]
    3000,           -- Channel Air Pressure [mbar]
    2900,           -- Shaft 1 Lances Cooling Air Pressure [mbar]
    2950,           -- Shaft 2 Lances Cooling Air Pressure [mbar]
    7.5,            -- Natural Gas - Pressure [barg]
    250             -- Hydraulic Oil - Pressure [bar]
);

