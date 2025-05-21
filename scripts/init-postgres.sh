#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE signal_belive;
    GRANT ALL PRIVILEGES ON DATABASE signal_belive TO postgres;
EOSQL

# Connect to signal_belive database and create extension
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "signal_belive" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL 