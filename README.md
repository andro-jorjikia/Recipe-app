# Recipe App - Full Stack

A full-stack recipe application with backend API and mobile frontend.

## Project Structure

```
Recipe-app-fullstack/
├── backend/          # Node.js/Express backend API
│   ├── package.json
│   └── package-lock.json
└── mobile/           # Mobile application (React Native/Flutter)
```

## Backend

The backend is built with:
- Node.js
- Express.js
- Drizzle ORM
- Neon Database (PostgreSQL)
- CORS support
- Cron jobs

### Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your environment variables:
   ```
   DATABASE_URL=your_neon_database_url
   PORT=3000
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Mobile

The mobile application is currently in development.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/andro-jorjikia/Recipe-app.git
   cd Recipe-app-fullstack
   ```

2. Follow the setup instructions for each component above.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License. 