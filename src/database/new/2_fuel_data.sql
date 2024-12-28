CREATE TABLE IF NOT EXISTS fuel_data (
    cycle_id INTEGER PRIMARY KEY,
    heat_consumption NUMERIC,
    heat_consumption_setpoint NUMERIC,
    fuel_cycle NUMERIC,
    fuel_cycle_setpoint NUMERIC,
    fuel_flow NUMERIC,
    fuel_flow_setpoint NUMERIC,
    natural_gas_output_regulator NUMERIC
);

--  insert  --

INSERT INTO fuel_data (
    cycle_id,
    heat_consumption,
    heat_consumption_setpoint,
    fuel_cycle,
    fuel_cycle_setpoint,
    fuel_flow,
    fuel_flow_setpoint,
    natural_gas_output_regulator
) VALUES (
    1,        -- Progressive Cycle Number (Cyclic from 1 to 9999) [#]
    450.5,    -- Heat Consumption [kcal/kg]
    500.0,    -- Heat Consumption - Setpoint [kcal/kg]
    15.75,    -- Fuel for Cycle - Process Value [Nm³/cycle]
    16.0,     -- Fuel for Cycle - Setpoint [Nm³/cycle]
    120.5,    -- Fuel Flow - Process Value [Nm³/h]
    130.0,    -- Fuel Flow - Setpoint [Nm³/h]
    85.0      -- Natural Gas - Output Regulator [%]
);