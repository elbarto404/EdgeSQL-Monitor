CREATE TABLE IF NOT EXISTS fuel_data (
    cycle_id INTEGER PRIMARY KEY,
    channel_temp1 NUMERIC,
    channel_temp2 NUMERIC,
    waste_gases_temp_outlet_kiln NUMERIC,
    waste_gases_temp_inlet_kiln_filter NUMERIC,
    shaft1_drawer_pipe_temp NUMERIC,
    shaft1_drawer_skip_temp NUMERIC,
    shaft2_drawer_pipe_temp NUMERIC,
    shaft2_drawer_skip_temp NUMERIC,
    natural_gas_temp NUMERIC,
    hydraulic_oil_temp NUMERIC
);

--  insert  --

INSERT INTO fuel_data (
    cycle_id,
    channel_temp1,
    channel_temp2,
    waste_gases_temp_outlet_kiln,
    waste_gases_temp_inlet_kiln_filter,
    shaft1_drawer_pipe_temp,
    shaft1_drawer_skip_temp,
    shaft2_drawer_pipe_temp,
    shaft2_drawer_skip_temp,
    natural_gas_temp,
    hydraulic_oil_temp
) VALUES (
    1,           -- Progressive Cycle Number (Cyclic from 1 to 9999) [#]
    145.5,       -- Channel Temperature 1 [°C]
    148.2,       -- Channel Temperature 2 [°C]
    320.7,       -- Waste Gases Temperature - Outlet Kiln [°C]
    295.3,       -- Waste Gases Temperature - Inlet Kiln Filter [°C]
    85.6,        -- Shaft 1 Drawer Pipe Side - Lime Temperature [°C]
    90.4,        -- Shaft 1 Drawer Skip Side - Lime Temperature [°C]
    88.9,        -- Shaft 2 Drawer Pipe Side - Lime Temperature [°C]
    92.1,        -- Shaft 2 Drawer Skip Side - Lime Temperature [°C]
    22.5,        -- Natural Gas - Temperature [°C]
    75.3         -- Hydraulic Oil - Temperature [°C]
);
