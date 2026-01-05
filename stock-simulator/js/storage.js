export const DB_KEYS = {
    USER_DATA: 'stock_sim_user',
    STOCKS: 'stock_sim_stocks',
    HISTORY: 'stock_sim_history'
};

const INITIAL_BALANCE = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000;

export const Storage = {
    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    load(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    initUser() {
        let user = this.load(DB_KEYS.USER_DATA);
        if (!user) {
            user = {
                balance: INITIAL_BALANCE,
                portfolio: {}, // { symbol: { qty: 0, avgPrice: 0 } }
                virtualDays: 0,
                stats: {
                    totalInvested: 0,
                    realizedPL: 0
                }
            };
            this.save(DB_KEYS.USER_DATA, user);
        }
        return user;
    },

    initStocks(initialStocks) {
        let stocks = this.load(DB_KEYS.STOCKS);
        let history = this.load(DB_KEYS.HISTORY);

        if (!stocks) {
            stocks = initialStocks.map(s => ({
                ...s,
                currentPrice: s.ipoPrice,
                history: [s.ipoPrice]
            }));
            this.save(DB_KEYS.STOCKS, stocks);

            // History format: { SYMBOL: [{ t: date, o, h, l, c, v }] }
            history = {};
            stocks.forEach(s => {
                const stockHistory = [];
                // Generate a random seed-based starting point for historical diversity
                const priceBias = 0.5 + Math.random();
                let lastPrice = s.ipoPrice * priceBias;
                const now = Date.now();

                // Track historical trend for charting
                const histVolatility = s.volatility * (0.8 + Math.random() * 0.4);

                for (let i = 30; i >= 0; i--) {
                    const time = now - (i * 86400000);
                    const open = lastPrice;
                    const change = (Math.random() - 0.5) * 2 * s.volatility * (lastPrice * 0.05);
                    const close = Math.max(1, lastPrice + change);
                    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
                    const low = Math.min(open, close) * (1 - Math.random() * 0.02);

                    stockHistory.push({
                        t: time,
                        o: parseFloat(open.toFixed(2)),
                        h: parseFloat(high.toFixed(2)),
                        l: parseFloat(low.toFixed(2)),
                        c: parseFloat(close.toFixed(2)),
                        v: Math.floor(Math.random() * 5000) + 1000
                    });
                    lastPrice = close;
                }
                history[s.symbol] = stockHistory;
                s.currentPrice = parseFloat(lastPrice.toFixed(2));
            });
            this.save(DB_KEYS.STOCKS, stocks);
            this.save(DB_KEYS.HISTORY, history);
        }
        return { stocks, history };
    },

    updateUser(updates) {
        const user = this.load(DB_KEYS.USER_DATA);
        const updatedUser = { ...user, ...updates };
        this.save(DB_KEYS.USER_DATA, updatedUser);
        return updatedUser;
    },

    updateStocks(stocks) {
        this.save(DB_KEYS.STOCKS, stocks);
    },

    updateHistory(history) {
        this.save(DB_KEYS.HISTORY, history);
    },

    getFullState() {
        return {
            user: this.load(DB_KEYS.USER_DATA),
            stocks: this.load(DB_KEYS.STOCKS),
            history: this.load(DB_KEYS.HISTORY),
            v: 1.0 // versioning
        };
    },

    restoreFullState(state) {
        if (!state.user || !state.stocks || !state.history) return false;
        this.save(DB_KEYS.USER_DATA, state.user);
        this.save(DB_KEYS.STOCKS, state.stocks);
        this.save(DB_KEYS.HISTORY, state.history);
        return true;
    }
};
