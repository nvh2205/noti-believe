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

## NestJS Microservice with RabbitMQ

This project includes an integrated microservice architecture using RabbitMQ for message transport. The API module connects to RabbitMQ to send and receive messages. See the detailed instructions in [MICROSERVICE_SETUP.md](./MICROSERVICE_SETUP.md).

### Queue Configuration

All queue names are defined as constants in the API module:
- Main queue: `main_queue` (handles user and auth operations)
- Prediction service queue: `prediction_queue`

### Service Configuration

The application uses two primary service clients:
- `MAIN_SERVICE`: Handles all user and authentication operations via the main queue
- `PREDICTION_SERVICE`: Handles all prediction-related operations via the prediction queue

### Quick Start with Docker Compose

The easiest way to run the full stack including RabbitMQ is using Docker Compose:

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
- RabbitMQ message broker
- API server (port 3000) - HTTP API + microservices
- Worker service - Background processing

### Running Locally

To run the server locally with Docker:

1. Make sure RabbitMQ is running:
   ```bash
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
   ```

2. Set the environment variables in .env file:
   ```
   IS_API=1  # Enable API mode
   IS_WORKER=0
   RABBITMQ_URL=amqp://guest:guest@localhost:5672
   ```

3. Run the application:
   ```bash
   npm run start:dev
   ```

### Microservice Architecture

This application implements a microservice architecture with the following services:

1. **Main Service**: Handles user operations and authentication (via `main_queue`)
   - User operations: create, get, update
   - Auth operations: login, validate token, refresh token

2. **Prediction Service**: Manages user predictions (via `prediction_queue`)
   - Prediction operations: create, get, update

All services are integrated directly into the API module with RabbitMQ transport.

### Required Dependencies

Ensure you have these packages installed:
```bash
npm install amqp-connection-manager amqplib @nestjs/microservices
```

### Testing the Microservice Setup

1. Create a user via API:
   ```bash
   curl -X POST http://localhost:3000/user -H "Content-Type: application/json" -d '{"address":"0x123abc"}'
   ```

2. Get user by ID (ID from previous response):
   ```bash
   curl -X GET http://localhost:3000/user/{USER_ID}
   ```

3. Check RabbitMQ management UI at http://localhost:15672 to see message queues and exchanges.

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
