-- ================================================================
-- Script: setup_lime_klin_report.sql
-- Description: Creates the lime_klin_report database if it doesn't
--              exist, sets up the process_values table, stored
--              procedures, and inserts initial data.
-- ================================================================

-- =========================== Configuration ==========================
-- Replace these placeholders with your actual PostgreSQL credentials.

-- Source Database Connection (e.g., 'postgres')
\c postgres

-- PostgreSQL Credentials for dblink connection
-- Ensure the role has sufficient privileges.
-- Replace 'your_username' and 'your_password' with actual credentials.
-- Note: For security reasons, consider using environment variables or
-- the .pgpass file instead of hardcoding passwords.
DO
$$
BEGIN
    -- 1. Install the dblink extension if not already installed
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_extension 
        WHERE extname = 'dblink'
    ) THEN
        CREATE EXTENSION dblink;
        RAISE NOTICE 'dblink extension created.';
    ELSE
        RAISE NOTICE 'dblink extension already exists.';
    END IF;
END;
$$;

-- 2. Check if the lime_klin_report database exists
DO
$$
DECLARE
    db_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO db_count
    FROM pg_database
    WHERE datname = 'lime_klin_report';
    
    IF db_count = 0 THEN
        -- Create the database using dblink
        PERFORM dblink_exec(
            'dbname=postgres user=edge password=edgeadmin host=localhost port=5432',
            'CREATE DATABASE lime_klin_report'
        );
        RAISE NOTICE 'Database "lime_klin_report" has been created.';
    ELSE
        RAISE NOTICE 'Database "lime_klin_report" already exists.';
    END IF;
END;
$$;

-- 3. Set up the process_values table and stored procedures in lime_klin_report
-- We'll use dblink to execute SQL commands in the lime_klin_report database.

-- 3.1. Create the process_values table if it doesn't exist
DO
$$
BEGIN
    -- Check if the table exists in lime_klin_report
    IF NOT EXISTS (
        SELECT 1 
        FROM dblink(
            'dbname=lime_klin_report user=your_username password=your_password host=localhost port=5432',
            'SELECT to_regclass(''public.process_values'')'
        ) AS t(regclass text)
        WHERE regclass IS NOT NULL
    ) THEN
        -- Create the table
        PERFORM dblink_exec(
            'dbname=lime_klin_report user=your_username password=your_password host=localhost port=5432',
            '
            CREATE TABLE public.process_values (
                id SERIAL PRIMARY KEY,
                progressive_cycle_number INTEGER CHECK (progressive_cycle_number BETWEEN 1 AND 9999),
                shaft_in_combustion INTEGER,
                cycle_time NUMERIC,
                combustion_time NUMERIC,
                inversion_time NUMERIC,
                time_fuel_supply NUMERIC,
                limestone_for_cycle NUMERIC,
                lime_for_cycle NUMERIC,
                nominal_production NUMERIC,
                heat_consumption NUMERIC,
                fuel_for_cycle NUMERIC,
                fuel_flow NUMERIC,
                low_heat_value_air NUMERIC,
                stoichiometric_air NUMERIC,
                combustion_air_flow_theoretical NUMERIC,
                combustion_air_flow NUMERIC,
                combustion_air_index_excess_air NUMERIC,
                combustion_air_blower_speed NUMERIC,
                lime_cooling_air_flow_theoretical NUMERIC,
                lime_cooling_air_flow NUMERIC,
                lime_cooling_air_ratio NUMERIC,
                lime_cooling_air_blower_speed NUMERIC,
                channel_temperature_1 NUMERIC,
                channel_temperature_2 NUMERIC,
                waste_gases_temp_outlet_kiln NUMERIC,
                waste_gases_temp_inlet_kiln_filter NUMERIC,
                shaft1_drawer_pipe_side_lime_temp NUMERIC,
                shaft1_drawer_skip_side_lime_temp NUMERIC,
                shaft2_drawer_pipe_side_lime_temp NUMERIC,
                shaft2_drawer_skip_side_lime_temp NUMERIC,
                combustion_air_pressure NUMERIC,
                lime_cooling_air_pressure NUMERIC,
                channel_air_pressure NUMERIC,
                shaft1_lances_cooling_air_pressure NUMERIC,
                shaft2_lances_cooling_air_pressure NUMERIC,
                shaft1_total_strokes INTEGER,
                shaft2_total_strokes INTEGER,
                natural_gas_temperature NUMERIC,
                natural_gas_pressure NUMERIC,
                natural_gas_output_regulator NUMERIC,
                hydraulic_oil_temperature NUMERIC,
                hydraulic_oil_pressure NUMERIC,
                waiting_time NUMERIC,
                unavailability_time NUMERIC,
                drawer_sampling NUMERIC,
                valves_time_maintenance NUMERIC,
                hydraulic_oil_unit_time_maintenance NUMERIC,
                hydraulic_oil_plant_time_maintenance NUMERIC,
                blower_time_maintenance NUMERIC,
                skip_time_maintenance NUMERIC,
                limestone_weighed_hopper_calibration NUMERIC,
                other_maintenance NUMERIC,
                mechanical_issue NUMERIC,
                electrical_issue NUMERIC,
                process_issue NUMERIC,
                other_issue NUMERIC,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            '
        );
        RAISE NOTICE 'Table "process_values" created successfully in "lime_klin_report".';
    ELSE
        RAISE NOTICE 'Table "process_values" already exists in "lime_klin_report".';
    END IF;
END;
$$;

-- 3.2. Create the insert_process_value stored procedure if it doesn't exist
DO
$$
BEGIN
    -- Check if the procedure exists
    IF NOT EXISTS (
        SELECT 1 
        FROM dblink(
            'dbname=lime_klin_report user=your_username password=your_password host=localhost port=5432',
            'SELECT proname FROM pg_proc WHERE proname = ''insert_process_value'' AND pg_function_is_visible(oid)'
        ) AS t(proname text)
    ) THEN
        -- Create the stored procedure
        PERFORM dblink_exec(
            'dbname=lime_klin_report user=your_username password=your_password host=localhost port=5432',
            '
            CREATE OR REPLACE PROCEDURE insert_process_value(
                progressive_cycle_number INTEGER,
                shaft_in_combustion INTEGER,
                cycle_time NUMERIC,
                combustion_time NUMERIC,
                inversion_time NUMERIC,
                time_fuel_supply NUMERIC,
                limestone_for_cycle NUMERIC,
                lime_for_cycle NUMERIC,
                nominal_production NUMERIC,
                heat_consumption NUMERIC,
                fuel_for_cycle NUMERIC,
                fuel_flow NUMERIC,
                low_heat_value_air NUMERIC,
                stoichiometric_air NUMERIC,
                combustion_air_flow_theoretical NUMERIC,
                combustion_air_flow NUMERIC,
                combustion_air_index_excess_air NUMERIC,
                combustion_air_blower_speed NUMERIC,
                lime_cooling_air_flow_theoretical NUMERIC,
                lime_cooling_air_flow NUMERIC,
                lime_cooling_air_ratio NUMERIC,
                lime_cooling_air_blower_speed NUMERIC,
                channel_temperature_1 NUMERIC,
                channel_temperature_2 NUMERIC,
                waste_gases_temp_outlet_kiln NUMERIC,
                waste_gases_temp_inlet_kiln_filter NUMERIC,
                shaft1_drawer_pipe_side_lime_temp NUMERIC,
                shaft1_drawer_skip_side_lime_temp NUMERIC,
                shaft2_drawer_pipe_side_lime_temp NUMERIC,
                shaft2_drawer_skip_side_lime_temp NUMERIC,
                combustion_air_pressure NUMERIC,
                lime_cooling_air_pressure NUMERIC,
                channel_air_pressure NUMERIC,
                shaft1_lances_cooling_air_pressure NUMERIC,
                shaft2_lances_cooling_air_pressure NUMERIC,
                shaft1_total_strokes INTEGER,
                shaft2_total_strokes INTEGER,
                natural_gas_temperature NUMERIC,
                natural_gas_pressure NUMERIC,
                natural_gas_output_regulator NUMERIC,
                hydraulic_oil_temperature NUMERIC,
                hydraulic_oil_pressure NUMERIC,
                waiting_time NUMERIC,
                unavailability_time NUMERIC,
                drawer_sampling NUMERIC,
                valves_time_maintenance NUMERIC,
                hydraulic_oil_unit_time_maintenance NUMERIC,
                hydraulic_oil_plant_time_maintenance NUMERIC,
                blower_time_maintenance NUMERIC,
                skip_time_maintenance NUMERIC,
                limestone_weighed_hopper_calibration NUMERIC,
                other_maintenance NUMERIC,
                mechanical_issue NUMERIC,
                electrical_issue NUMERIC,
                process_issue NUMERIC,
                other_issue NUMERIC
            )
            LANGUAGE plpgsql
            AS \$\$
            BEGIN
                INSERT INTO public.process_values (
                    progressive_cycle_number,
                    shaft_in_combustion,
                    cycle_time,
                    combustion_time,
                    inversion_time,
                    time_fuel_supply,
                    limestone_for_cycle,
                    lime_for_cycle,
                    nominal_production,
                    heat_consumption,
                    fuel_for_cycle,
                    fuel_flow,
                    low_heat_value_air,
                    stoichiometric_air,
                    combustion_air_flow_theoretical,
                    combustion_air_flow,
                    combustion_air_index_excess_air,
                    combustion_air_blower_speed,
                    lime_cooling_air_flow_theoretical,
                    lime_cooling_air_flow,
                    lime_cooling_air_ratio,
                    lime_cooling_air_blower_speed,
                    channel_temperature_1,
                    channel_temperature_2,
                    waste_gases_temp_outlet_kiln,
                    waste_gases_temp_inlet_kiln_filter,
                    shaft1_drawer_pipe_side_lime_temp,
                    shaft1_drawer_skip_side_lime_temp,
                    shaft2_drawer_pipe_side_lime_temp,
                    shaft2_drawer_skip_side_lime_temp,
                    combustion_air_pressure,
                    lime_cooling_air_pressure,
                    channel_air_pressure,
                    shaft1_lances_cooling_air_pressure,
                    shaft2_lances_cooling_air_pressure,
                    shaft1_total_strokes,
                    shaft2_total_strokes,
                    natural_gas_temperature,
                    natural_gas_pressure,
                    natural_gas_output_regulator,
                    hydraulic_oil_temperature,
                    hydraulic_oil_pressure,
                    waiting_time,
                    unavailability_time,
                    drawer_sampling,
                    valves_time_maintenance,
                    hydraulic_oil_unit_time_maintenance,
                    hydraulic_oil_plant_time_maintenance,
                    blower_time_maintenance,
                    skip_time_maintenance,
                    limestone_weighed_hopper_calibration,
                    other_maintenance,
                    mechanical_issue,
                    electrical_issue,
                    process_issue,
                    other_issue
                ) VALUES (
                    progressive_cycle_number,
                    shaft_in_combustion,
                    cycle_time,
                    combustion_time,
                    inversion_time,
                    time_fuel_supply,
                    limestone_for_cycle,
                    lime_for_cycle,
                    nominal_production,
                    heat_consumption,
                    fuel_for_cycle,
                    fuel_flow,
                    low_heat_value_air,
                    stoichiometric_air,
                    combustion_air_flow_theoretical,
                    combustion_air_flow,
                    combustion_air_index_excess_air,
                    combustion_air_blower_speed,
                    lime_cooling_air_flow_theoretical,
                    lime_cooling_air_flow,
                    lime_cooling_air_ratio,
                    lime_cooling_air_blower_speed,
                    channel_temperature_1,
                    channel_temperature_2,
                    waste_gases_temp_outlet_kiln,
                    waste_gases_temp_inlet_kiln_filter,
                    shaft1_drawer_pipe_side_lime_temp,
                    shaft1_drawer_skip_side_lime_temp,
                    shaft2_drawer_pipe_side_lime_temp,
                    shaft2_drawer_skip_side_lime_temp,
                    combustion_air_pressure,
                    lime_cooling_air_pressure,
                    channel_air_pressure,
                    shaft1_lances_cooling_air_pressure,
                    shaft2_lances_cooling_air_pressure,
                    shaft1_total_strokes,
                    shaft2_total_strokes,
                    natural_gas_temperature,
                    natural_gas_pressure,
                    natural_gas_output_regulator,
                    hydraulic_oil_temperature,
                    hydraulic_oil_pressure,
                    waiting_time,
                    unavailability_time,
                    drawer_sampling,
                    valves_time_maintenance,
                    hydraulic_oil_unit_time_maintenance,
                    hydraulic_oil_plant_time_maintenance,
                    blower_time_maintenance,
                    skip_time_maintenance,
                    limestone_weighed_hopper_calibration,
                    other_maintenance,
                    mechanical_issue,
                    electrical_issue,
                    process_issue,
                    other_issue
                );
            END;
            \$\$;
            '
        );
        RAISE NOTICE 'Stored procedure "insert_process_value" created successfully in "lime_klin_report".';
    ELSE
        RAISE NOTICE 'Stored procedure "insert_process_value" already exists in "lime_klin_report".';
    END IF;
END;
$$;

-- 4. Insert an example record into the process_values table
-- This step assumes that the table and procedure have been created successfully.

DO
$$
BEGIN
    -- Check if there's at least one record to avoid duplicate inserts
    IF NOT EXISTS (SELECT 1 FROM dblink(
        'dbname=lime_klin_report user=your_username password=your_password host=localhost port=5432',
        'SELECT 1 FROM public.process_values LIMIT 1'
    ) AS t(dummy INTEGER)) THEN
        -- Insert example data using the stored procedure
        PERFORM dblink_exec(
            'dbname=lime_klin_report user=your_username password=your_password host=localhost port=5432',
            '
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
            '
        );
        RAISE NOTICE 'Example record inserted into "process_values".';
    ELSE
        RAISE NOTICE 'Table "process_values" already contains data. No insertion performed.';
    END IF;
END;
$$;
