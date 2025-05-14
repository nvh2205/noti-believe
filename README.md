<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
# startkit-nest

## Application Architecture

This project is a NestJS application with API and worker components using Redis for caching and message queuing.

### Quick Start with Docker Compose

The easiest way to run the full stack is using Docker Compose:

```bash
# Start all services
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f
```

This will start:
- PostgreSQL database
- Redis cache
- API server (port 3000)
- Worker service - Background processing

### Running Locally

To run the server locally with Docker:

1. Make sure Redis is running:
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

2. Set the environment variables in .env file:
   ```
   IS_API=1  # Enable API mode
   IS_WORKER=0
   REDIS_URL=redis://localhost:6379
   ```

3. Run the application:
   ```bash
   npm run start:dev
   ```

### Required Dependencies

Ensure you have these packages installed:
```bash
npm install ioredis @nestjs/bull bull
```

# Believe Signal Token Tracker

## Telegram Bot Setup

To enable Telegram notifications for new tokens:

1. Create a new Telegram bot using BotFather:
   - Start a chat with [@BotFather](https://t.me/BotFather)
   - Send `/newbot` command
   - Follow the prompts to name your bot
   - Save the API token provided by BotFather

2. Get your chat ID:
   - Option 1: If sending to your personal account, start a chat with [@userinfobot](https://t.me/userinfobot)
   - Option 2: If sending to a channel, add the bot to the channel as admin, send a message, and visit https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates

3. Add to your .env file:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

4. The bot will automatically:
   - Fetch tokens from the Believe Signal API every 2 seconds
   - Send formatted messages about new tokens
   - Include details about token name, ticker, Twitter account, and more

## Running the Worker

To start the token tracking worker:

```bash
# Development mode
npm run start:worker
```

This will:
1. Connect to the Telegram API using your bot
2. Fetch tokens from the Believe Signal API every 2 seconds
3. Add new tokens to a processing queue
4. Send notifications to your Telegram channel/group

# Signal Belive Project

## Docker Setup

This project includes Docker and Docker Compose configurations for easy development and deployment.

### Prerequisites

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose: [Install Docker Compose](https://docs.docker.com/compose/install/)

### Services

The Docker Compose setup includes the following services:

1. **PostgreSQL**: Database service
2. **Redis**: Cache and message broker
3. **API**: NestJS REST API service
4. **Worker**: Background worker service

### Environment Variables

Each service has its own set of environment variables defined in the `docker-compose.yml` file. You can customize these variables according to your needs.

### Running the Application

To start all services:

```bash
docker-compose up -d
```

To stop all services:

```bash
docker-compose down
```

To view logs from all services:

```bash
docker-compose logs -f
```

To view logs from a specific service:

```bash
docker-compose logs -f <service-name>
```

Example:
```bash
docker-compose logs -f api
```

### Building the Docker Images

To rebuild the Docker images:

```bash
docker-compose build
```

### Accessing Services

- **API**: http://localhost:3000
- **API Documentation (Swagger)**: http://localhost:3000/docs

### Database Access

You can connect to the PostgreSQL database using the following credentials:

- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres
- **Database**: signal_belive

### Development with Docker

For development purposes, you can mount your local source code into the containers to reflect changes immediately. Modify the docker-compose.yml file to add volumes:

```yaml
services:
  api:
    # ... other configurations
    volumes:
      - ./src:/app/src
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Application configuration
# Set one of these to 1 based on the service you want to run
IS_API=1        # Set to 1 to run as API server
IS_WORKER=0     # Set to 1 to run as Worker (background tasks)

APP_ENV=development
PORT=3000
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=signal_belive
DB_DEBUG=1
DB_SYNC=1

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DATABASE=0
REDIS_PASSWORD=redis_password
REDIS_URL=redis://:redis_password@localhost:6379
REDIS_FAMILY=0

# JWT configuration
JWT_SECRET=super_secret_key

# Optional: Telegram Bot configuration (for worker)
# TELEGRAM_BOT_TOKEN=your_telegram_bot_token
# TELEGRAM_CHAT_ID=your_chat_id
```
