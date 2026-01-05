import sqlite3
import random
import datetime
import math

# Configuration
DB_NAME = "stock_market_data.db"
START_DATE = datetime.date(2024, 1, 1)
DAYS_TO_GENERATE = 365
STOCKS = [
    {"symbol": "XEN", "name": "Xenon Pharma", "base_price": 210.00, "volatility": 0.02},
    {"symbol": "HYD", "name": "Hydro Power", "base_price": 30.00, "volatility": 0.015},
    {"symbol": "ECO", "name": "EcoSystems", "base_price": 110.00, "volatility": 0.025},
    {"symbol": "PUL", "name": "Pulse Tech", "base_price": 155.00, "volatility": 0.03},
    {"symbol": "KIN", "name": "Kinetics AI", "base_price": 380.00, "volatility": 0.04},
]

def create_database():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Create Stocks Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT UNIQUE,
        name TEXT,
        sector TEXT
    )
    ''')
    
    # Create Price History Table (OHLCV)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stock_symbol TEXT,
        date TEXT,
        open REAL,
        high REAL,
        low REAL,
        close REAL,
        volume INTEGER,
        FOREIGN KEY(stock_symbol) REFERENCES stocks(symbol)
    )
    ''')
    
    conn.commit()
    return conn

def generate_data(conn):
    cursor = conn.cursor()
    
    print(f"Generating data for {len(STOCKS)} stocks over {DAYS_TO_GENERATE} days...")
    
    for stock in STOCKS:
        # Insert Stock info
        try:
            cursor.execute("INSERT INTO stocks (symbol, name, sector) VALUES (?, ?, ?)", 
                          (stock["symbol"], stock["name"], "Technology"))
        except sqlite3.IntegrityError:
            pass # Already exists

        current_price = stock["base_price"]
        
        for day in range(DAYS_TO_GENERATE):
            date_str = (START_DATE + datetime.timedelta(days=day)).isoformat()
            
            # Simple Random Walk Simulation
            change_pct = (random.random() - 0.5) * 2 * stock["volatility"]
            
            # Open is roughly yesterday's close (or today's start)
            open_price = current_price
            
            # Close is driven by the random change
            close_price = open_price * (1 + change_pct)
            
            # High and Low derived from Open/Close with some noise
            high_price = max(open_price, close_price) * (1 + random.random() * 0.01)
            low_price = min(open_price, close_price) * (1 - random.random() * 0.01)
            
            # Volume
            volume = int(10000 + random.random() * 50000)
            
            cursor.execute('''
            INSERT INTO price_history (stock_symbol, date, open, high, low, close, volume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (stock["symbol"], date_str, round(open_price, 2), round(high_price, 2), 
                  round(low_price, 2), round(close_price, 2), volume))
            
            current_price = close_price
            
    conn.commit()
    print(f"Success! Data saved to {DB_NAME}")

if __name__ == "__main__":
    connection = create_database()
    generate_data(connection)
    connection.close()
