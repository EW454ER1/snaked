# FastAPI Backend for Admin Panel

## Features
- User management (list, create, update, delete, block)
- Referral management
- Transaction management (deposit, withdrawal, approve/reject)
- SQLite database (default, easy to run anywhere)

## How to Run
1. Install Python 3.9+
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at http://localhost:8000

## Endpoints
- `/users` (GET, POST)
- `/users/{user_id}` (PUT, DELETE)
- `/referrals` (GET, POST)
- `/transactions` (GET, POST)
- `/transactions/{tx_id}` (PUT, DELETE)

You can use these endpoints from your Next.js admin panel.
