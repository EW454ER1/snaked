from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3

app = FastAPI()

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "./backend/database.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        is_blocked INTEGER DEFAULT 0,
        is_first_login INTEGER DEFAULT 1,
        balance REAL DEFAULT 10000
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        code TEXT,
        referred_by INTEGER,
        bonus REAL DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount REAL,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    conn.commit()
    conn.close()

init_db()

class User(BaseModel):
    id: Optional[int]
    username: str
    email: str
    password: str
    is_blocked: Optional[bool] = False
    is_first_login: Optional[bool] = True
    balance: Optional[float] = 10000

class Referral(BaseModel):
    id: Optional[int]
    user_id: int
    code: str
    referred_by: Optional[int]
    bonus: Optional[float] = 0

class Transaction(BaseModel):
    id: Optional[int]
    user_id: int
    type: str  # deposit/withdrawal
    amount: float
    status: str
    created_at: Optional[str]

# --- User Endpoints ---
@app.get("/users", response_model=List[User])
def list_users():
    conn = get_db()
    users = conn.execute("SELECT * FROM users").fetchall()
    return [dict(u) for u in users]

@app.post("/users", response_model=User)
def create_user(user: User):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute("INSERT INTO users (username, email, password, is_first_login, balance) VALUES (?, ?, ?, ?, ?)",
                  (user.username, user.email, user.password, int(user.is_first_login), 10000))
        conn.commit()
        user.id = c.lastrowid
        return user
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username or email already exists")

@app.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user: User):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE users SET username=?, email=?, password=?, is_blocked=?, is_first_login=?, balance=? WHERE id=?",
              (user.username, user.email, user.password, int(user.is_blocked), int(user.is_first_login), user.balance, user_id))
# --- Top Players Leaderboard ---
@app.get("/top-players")
def top_players():
    conn = get_db()
    players = conn.execute("SELECT username, balance FROM users ORDER BY balance DESC LIMIT 10").fetchall()
    return [dict(p) for p in players]

# --- Top Referrers Leaderboard ---
@app.get("/top-referrers")
def top_referrers():
    conn = get_db()
    referrers = conn.execute('''
        SELECT u.username, SUM(r.bonus) as total_bonus
        FROM users u
        LEFT JOIN referrals r ON u.id = r.referred_by
        GROUP BY u.id
        ORDER BY total_bonus DESC
        LIMIT 10
    ''').fetchall()
    return [dict(r) for r in referrers]
    conn.commit()
    user.id = user_id
    return user

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=?", (user_id,))
    conn.commit()
    return {"ok": True}

# --- Referral Endpoints ---
@app.get("/referrals", response_model=List[Referral])
def list_referrals():
    conn = get_db()
    refs = conn.execute("SELECT * FROM referrals").fetchall()
    return [dict(r) for r in refs]

@app.post("/referrals", response_model=Referral)
def create_referral(ref: Referral):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO referrals (user_id, code, referred_by, bonus) VALUES (?, ?, ?, ?)",
              (ref.user_id, ref.code, ref.referred_by, ref.bonus))
    conn.commit()
    ref.id = c.lastrowid
    return ref

# --- Transaction Endpoints ---
@app.get("/transactions", response_model=List[Transaction])
def list_transactions():
    conn = get_db()
    txs = conn.execute("SELECT * FROM transactions").fetchall()
    return [dict(t) for t in txs]

@app.post("/transactions", response_model=Transaction)
def create_transaction(tx: Transaction):
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, ?)",
              (tx.user_id, tx.type, tx.amount, tx.status))
    conn.commit()
    tx.id = c.lastrowid
    return tx

@app.put("/transactions/{tx_id}", response_model=Transaction)
def update_transaction(tx_id: int, tx: Transaction):
    conn = get_db()
    c = conn.cursor()
    c.execute("UPDATE transactions SET status=? WHERE id=?", (tx.status, tx_id))
    conn.commit()
    tx.id = tx_id
    return tx

@app.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: int):
    conn = get_db()
    conn.execute("DELETE FROM transactions WHERE id=?", (tx_id,))
    conn.commit()
    return {"ok": True}

# --- Health Check ---
@app.get("/")
def root():
    return {"status": "ok"}
