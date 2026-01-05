import { Storage, DB_KEYS } from './storage.js';

export const Engine = {
    // Basic Geometric Brownian Motion flavored simulation
    calculatePriceChange(currentPrice, volatility, trendBias) {
        const drift = trendBias === 'bullish' ? 0.001 : (trendBias === 'bearish' ? -0.001 : 0);
        const randomShock = (Math.random() - 0.5) * 2 * volatility;

        // Add a small chance for a "crash" or "surge"
        const eventChance = Math.random();
        let multiplier = 1 + drift + randomShock;

        if (eventChance > 0.98) multiplier *= 1.1; // Surge
        if (eventChance < 0.02) multiplier *= 0.9; // Crash

        return currentPrice * multiplier;
    },

    advanceTime(days, stocks, history) {
        const updatedStocks = stocks.map(stock => {
            let lastPrice = stock.currentPrice;
            const stockHistory = history[stock.symbol] || [];

            for (let i = 0; i < days; i++) {
                const open = lastPrice;
                const newPrice = this.calculatePriceChange(lastPrice, stock.volatility, stock.trendBias);
                const close = newPrice;
                const high = Math.max(open, close) * (1 + Math.random() * 0.02);
                const low = Math.min(open, close) * (1 - Math.random() * 0.02);
                const volume = Math.floor(Math.random() * 5000) + 1000;

                stockHistory.push({
                    t: Date.now() + (stockHistory.length * 86400000), // simplistic time step
                    o: parseFloat(open.toFixed(2)),
                    h: parseFloat(high.toFixed(2)),
                    l: parseFloat(low.toFixed(2)),
                    c: parseFloat(close.toFixed(2)),
                    v: volume
                });

                lastPrice = newPrice;
            }

            // Keep only last 365 days for performance if needed, but for now we keep all
            return {
                ...stock,
                currentPrice: parseFloat(lastPrice.toFixed(2))
            };
        });

        Storage.updateStocks(updatedStocks);
        Storage.updateHistory(history);

        const user = Storage.load(DB_KEYS.USER_DATA);
        user.virtualDays += days;
        Storage.updateUser(user);

        return updatedStocks;
    },

    generateNews(stocks) {
        const stock = stocks[Math.floor(Math.random() * stocks.length)];
        const effects = [
            { text: `reported record earnings for the quarter.`, bias: 'bullish' },
            { text: `is facing a regulatory probe.`, bias: 'bearish' },
            { text: `announced a major partnership with a tech giant.`, bias: 'bullish' },
            { text: `struggles with supply chain issues.`, bias: 'bearish' },
            { text: `CEO resigns unexpectedly.`, bias: 'bearish' }
        ];
        const effect = effects[Math.floor(Math.random() * effects.length)];

        // Temporarily change trend bias
        stock.trendBias = effect.bias;

        return {
            title: `${stock.name} (${stock.symbol}) ${effect.text}`,
            impact: effect.bias,
            symbol: stock.symbol
        };
    }
};
