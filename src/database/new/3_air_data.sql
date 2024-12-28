CREATE TABLE IF NOT EXISTS air_data (
    cycle_id INTEGER PRIMARY KEY,
    low_heat_val_air_calc NUMERIC,
    stoich_air_calc NUMERIC,
    combustion_air_flow_theo NUMERIC,
    combustion_air_flow NUMERIC,
    combustion_air_index NUMERIC,
    combustion_air_index_setpoint NUMERIC,
    combustion_air_blower_speed NUMERIC,
    combustion_air_blower_speed_setpoint NUMERIC,
    cool_air_flow_theo NUMERIC,
    cool_air_flow NUMERIC,
    cool_air_ratio NUMERIC,
    cool_air_ratio_setpoint NUMERIC,
    cool_air_blower_speed NUMERIC,
    cool_air_blower_speed_setpoint NUMERIC,
);

--  insert  --

INSERT INTO air_data (
    cycle_id,
    low_heat_val_air_calc,
    stoich_air_calc,
    combustion_air_flow_theo,
    combustion_air_flow,
    combustion_air_index,
    combustion_air_index_setpoint,
    combustion_air_blower_speed,
    combustion_air_blower_speed_setpoint,
    cool_air_flow_theo,
    cool_air_flow,
    cool_air_ratio,
    cool_air_ratio_setpoint,
    cool_air_blower_speed,
    cool_air_blower_speed_setpoint,
) VALUES (
    1,         -- Progressive Cycle Number (Cyclic from 1 to 9999) [#]
    250.75,    -- Low Heat Value air used for calculations [kcal/Nm³]
    14.7,      -- Stoichiometric air used for calculation [m³(n)/kg]
    5000.00,   -- Combustion Air Flow by Theoretical Calculation [m³(n)/h]
    4950.50,   -- Combustion Air Flow [m³(n)/h]
    1.02,      -- Combustion Air Index (Excess of Air) - Process Value [#]
    1.00,      -- Combustion Air Index (Excess of Air) - Setpoint [#]
    1500.00,   -- Combustion Air Blower used for regulation - Speed - Process Value
    1450.00,   -- Combustion Air Blower used for regulation - Speed - Setpoint
    3000.00,   -- Lime Cooling Air Flow by Theoretical Calculation [m³(n)/h]
    3050.75,   -- Lime Cooling Air Flow
    1.05,      -- Lime Cooling Air Ratio - Process Value [#]
    1.00,      -- Lime Cooling Air Ratio - Setpoint [#]
    1200.00,   -- Lime Cooling Air Blower used for regulation - Speed - Process Value
    1150.00    -- Lime Cooling Air Blower used for regulation - Speed - Setpoint
);