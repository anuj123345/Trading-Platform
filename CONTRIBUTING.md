# Contributing to AI Research & Data Analysis App

Thank you for your interest in contributing! This project aims to be a robust platform for AI-powered research, RAG, and autonomous data analysis.

## Getting Started

1. **Fork and Clone**: Fork the repository and clone it locally.
2. **Install Dependencies**: `npm install`.
3. **Environment Setup**: Copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY` and `DATABASE_URL`.
4. **Database Init**: Run the initialization endpoint `/api/init-db` to setup the PGVector tables.

## Development

- **AI Logic**: Logic for agents and vector stores resides in `lib/ai/`.
- **API Routes**: Orchestration logic is in `app/api/`.
- **UI Components**: UI integration should follow the design patterns provided by the custom UI code.

## Pull Requests

1. Create a descriptive branch name.
2. Ensure your code follows the existing style.
3. Include tests for new features.
4. Update documentation if necessary.

## License

This project is licensed under the MIT License.
