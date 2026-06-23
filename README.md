# Event Ticketing Management System

A small web application for managing users, venues, events, tickets, ticket types, orders, order details, and payments in an Oracle database.

## Requirements

- Node.js 18 or newer
- Oracle Database with the application's tables already created
- Oracle credentials with access to those tables

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set your Oracle connection values.
3. Start the application with `npm start`.
4. Open `http://localhost:3003`.

For PowerShell, environment variables can be set for the current session like this:

```powershell
$env:DB_USER = "your_oracle_username"
$env:DB_PASSWORD = "your_oracle_password"
$env:DB_CONNECT_STRING = "localhost:1521/orcl"
npm start
```

Run the automated checks with `npm test`.

Never commit `.env` or real database credentials. The file is ignored by Git.
