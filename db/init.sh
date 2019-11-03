#!/bin/sh -e

psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<-EOSQL
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE (pg_stat_activity.datname = 'styx_db')
    AND pid <> pg_backend_pid();

    DROP DATABASE IF EXISTS styx_db;
    DROP SCHEMA IF EXISTS styx_db;
    DROP USER IF EXISTS styx_admin;
    DROP USER IF EXISTS styx_user;

    CREATE USER styx_admin WITH LOGIN SUPERUSER PASSWORD 'styx1';
    CREATE USER styx_user WITH LOGIN PASSWORD 'styx';
    CREATE DATABASE "styx_db" WITH OWNER=styx_admin TEMPLATE template0;
EOSQL

psql -U styx_admin -d styx_db -a -f /opt/db/schema.sql