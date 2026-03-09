# Professional AI Trading Platform

A high-performance algorithmic trading platform with real-time analytics, automated strategies, and deep market research.

## Key Modules

- **Professional Trading Terminal**: A full-featured NSE trading interface with live quotes, order management, and portfolio tracking. Located at `/terminal`.
- **Algo Trading Engine**: Execute Python-based trading strategies (Nifty, Bank Nifty, etc.) with real-time monitoring.
- **AI Market Analysis**: Gemini-powered code analysis and market sentiment research.
- **Autonomous Research Engine**: Automate deep-dive research into market trends and stock performance.

## Secondary Tools

- **AI Data Analyst (Streamlit)**: Specialized Python interface for DuckDB & Pandas analysis of CSV/Excel files. Run with `streamlit run ai_data_analyst.py`.
- **RAG Document Chat**: Context-aware Q&A with vector search (PGVector).
- **Autonomous Crawler**: Web navigation and content extraction agent.

## Getting Started

1. **Installation**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   - Set `DATABASE_URL` in `.env.local`.
   - Run `/api/init-db` to initialize tables.

3. **Running the Platform**:
   ```bash
   npm run dev
   ```

## API Reference
- `POST /api/algo/deploy`: Deploy trading strategies.
- `POST /api/shoonya/order`: Execute live trades.
- `POST /api/research`: Trigger market research.
