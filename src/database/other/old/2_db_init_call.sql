
-- 3. Execute the procedure to create the table
CALL create_process_values_table();

-- 4. Example: Insert data into the process_values table using the insert_process_value procedure
-- Replace the example values with actual data as needed
CALL insert_process_value(
    1, -- progressive_cycle_number
    2, -- shaft_in_combustion
    3600, -- cycle_time
    1800, -- combustion_time
    600, -- inversion_time
    300, -- time_fuel_supply
    50.5, -- limestone_for_cycle
    45.3, -- lime_for_cycle
    1000, -- nominal_production
    500, -- heat_consumption
    200, -- fuel_for_cycle
    50, -- fuel_flow
    100, -- low_heat_value_air
    1.2, -- stoichiometric_air
    300, -- combustion_air_flow_theoretical
    350, -- combustion_air_flow
    1.1, -- combustion_air_index_excess_air
    75, -- combustion_air_blower_speed
    250, -- lime_cooling_air_flow_theoretical
    270, -- lime_cooling_air_flow
    0.95, -- lime_cooling_air_ratio
    80, -- lime_cooling_air_blower_speed
    150, -- channel_temperature_1
    155, -- channel_temperature_2
    400, -- waste_gases_temp_outlet_kiln
    350, -- waste_gases_temp_inlet_kiln_filter
    120, -- shaft1_drawer_pipe_side_lime_temp
    125, -- shaft1_drawer_skip_side_lime_temp
    130, -- shaft2_drawer_pipe_side_lime_temp
    135, -- shaft2_drawer_skip_side_lime_temp
    1013, -- combustion_air_pressure
    1010, -- lime_cooling_air_pressure
    1005, -- channel_air_pressure
    1008, -- shaft1_lances_cooling_air_pressure
    1007, -- shaft2_lances_cooling_air_pressure
    10000, -- shaft1_total_strokes
    9500, -- shaft2_total_strokes
    25, -- natural_gas_temperature
    5, -- natural_gas_pressure
    75, -- natural_gas_output_regulator
    60, -- hydraulic_oil_temperature
    10, -- hydraulic_oil_pressure
    120, -- waiting_time
    30, -- unavailability_time
    45, -- drawer_sampling
    20, -- valves_time_maintenance
    15, -- hydraulic_oil_unit_time_maintenance
    25, -- hydraulic_oil_plant_time_maintenance
    10, -- blower_time_maintenance
    5, -- skip_time_maintenance
    50, -- limestone_weighed_hopper_calibration
    40, -- other_maintenance
    35, -- mechanical_issue
    25, -- electrical_issue
    15, -- process_issue
    10  -- other_issue
);