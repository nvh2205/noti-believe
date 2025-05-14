# Signal-Belive Setup Scripts

This directory contains scripts to help with the setup and management of the Signal-Belive project.

## Available Scripts

### 1. `setup.sh`

An interactive script that guides you through the process of:
- Cloning the repository
- Setting up environment variables
- Starting Docker containers

#### Usage:

```bash
./setup.sh
```

The script will prompt you for:
- Git repository URL
- Branch name
- Directory to clone to

### 2. `auto-setup.sh`

A non-interactive version of the setup script, designed for automated deployments or CI/CD pipelines.

#### Usage:

```bash
./auto-setup.sh [REPO_URL] [BRANCH] [DIRECTORY]
```

**Parameters:**
- `REPO_URL` (optional): Git repository URL (default: https://github.com/yourusername/signal-belive.git)
- `BRANCH` (optional): Branch name (default: main)
- `DIRECTORY` (optional): Directory to clone to (default: signal-belive)

**Example:**
```bash
./auto-setup.sh https://github.com/myusername/signal-belive.git develop my-project
```

### 3. `docker-helper.sh`

A utility script for managing Docker containers for the project.

#### Usage:

```bash
./docker-helper.sh [COMMAND]
```

**Available commands:**
- `up`: Start all services in detached mode
- `down`: Stop all services and remove containers
- `restart`: Restart all services
- `logs`: Show logs from all services
- `build`: Rebuild all services
- `ps`: Show status of services
- `clean`: Remove all unused Docker resources
- `help`: Show help message

## Services

The scripts will set up the following services:
- PostgreSQL (database)
- Redis (cache)
- Worker (background processing)

## Environment Configuration

The setup scripts create a `.env` file with default configurations. You may need to modify this file for your specific requirements, especially for production environments.

## Notes

- The setup scripts require `git`, `docker`, and `docker-compose` to be installed on your system.
- The `.env` file created by the scripts is configured for the worker service by default.
- For security reasons, you should change the default passwords in the `.env` file before deploying to production. 