import INITIAL_STOCKS from './stocks.js';
import { Storage, DB_KEYS } from './storage.js';
import { Engine } from './engine.js';
import { Charting } from './charts.js';

class App {
    constructor() {
        this.user = Storage.initUser();
        const data = Storage.initStocks(INITIAL_STOCKS);
        this.stocks = data.stocks;
        this.history = data.history;
        this.currentPage = 'home';

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupTimeControls();
        this.setupProfileControls();
        this.setupTheme();
        this.renderTicker();
        this.updateSidebarBalance();
        this.router(this.currentPage);
    }

    setupTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        const savedTheme = localStorage.getItem('theme') || 'dark';

        document.documentElement.setAttribute('data-theme', savedTheme);
        toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

        toggleBtn.onclick = () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        };
    }

    setupProfileControls() {
        document.getElementById('download-profile').onclick = () => this.downloadProfile();
        const uploadTrigger = document.getElementById('upload-trigger');
        const fileInput = document.getElementById('import-profile');

        uploadTrigger.onclick = () => fileInput.click();
        fileInput.onchange = (e) => this.uploadProfile(e);
    }

    downloadProfile() {
        const state = Storage.getFullState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-simulator-profile-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    uploadProfile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const state = JSON.parse(event.target.result);
                if (Storage.restoreFullState(state)) {
                    alert('Profile imported successfully! Reloading...');
                    window.location.reload();
                } else {
                    alert('Invalid profile format.');
                }
            } catch (err) {
                alert('Error parsing profile JSON.');
            }
        };
        reader.readAsText(file);
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-links li');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentPage = item.dataset.page;
                this.router(this.currentPage);
            });
        });
    }

    setupTimeControls() {
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const days = parseInt(btn.dataset.days);
                this.stocks = Engine.advanceTime(days, this.stocks, this.history);
                this.updateSidebarBalance();
                this.renderTicker();
                this.router(this.currentPage); // Rerender current page
            });
        });
    }

    updateSidebarBalance() {
        const balanceEl = document.getElementById('sidebar-balance');
        if (balanceEl) {
            balanceEl.textContent = `₹${this.user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    renderTicker() {
        const tickerWrap = document.getElementById('ticker-wrap');
        tickerWrap.innerHTML = '';

        // Randomly pick 15 stocks for the ticker
        const sampled = [...this.stocks].sort(() => 0.5 - Math.random()).slice(0, 15);

        const createItems = () => {
            sampled.forEach(stock => {
                const hist = this.history[stock.symbol];
                const last = hist[hist.length - 1];
                const prev = hist[hist.length - 2] || last;
                const change = last.c - prev.c;
                const changePercent = ((change / prev.c) * 100).toFixed(2);

                const item = document.createElement('div');
                item.className = 'ticker-item';
                item.innerHTML = `
                    ${stock.symbol} ₹${stock.currentPrice.toFixed(2)} 
                    <span class="${change >= 0 ? 'ticker-up' : 'ticker-down'}">
                        ${change >= 0 ? '▲' : '▼'} ${Math.abs(changePercent)}%
                    </span>
                `;
                tickerWrap.appendChild(item);
            });
        };

        createItems();
        createItems(); // For seamless loop
    }

    router(page) {
        const container = document.getElementById('page-content');
        container.innerHTML = '';

        switch (page) {
            case 'home':
                this.renderHome(container);
                break;
            case 'market':
                this.renderMarket(container);
                break;
            case 'portfolio':
                this.renderPortfolio(container);
                break;
            case 'news':
                this.renderNews(container);
                break;
        }
    }

    renderHome(container) {
        const startDate = new Date(2025, 0, 1); // Simulation starts Jan 1, 2025
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + this.user.virtualDays);
        const dateStr = currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

        container.innerHTML = `
            <div class="home-container">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h1 class="section-title">Practice IPO investing. <br><span style="color:var(--accent)">No risk. Real logic.</span></h1>
                    <div class="card" style="padding: 0.75rem 1.5rem; text-align:right;">
                        <span class="text-secondary" style="font-size:0.8rem">VIRTUAL DATE</span>
                        <div style="font-weight:700; color:var(--accent)">${dateStr}</div>
                    </div>
                </div>
                <div class="grid-dashboard">
                    <div class="card">
                        <h3>Portfolio Value</h3>
                        <p class="balance-value" id="dashboard-total-val">₹0.00</p>
                        <p class="text-secondary">Across all holdings</p>
                    </div>
                    <div class="card">
                        <h3>Available Cash</h3>
                        <p class="balance-value">₹${this.user.balance.toLocaleString()}</p>
                        <p class="text-secondary">Ready to invest</p>
                    </div>
                    <div class="card">
                        <h3>Active IPOs</h3>
                        <p class="balance-value">${this.stocks.length}</p>
                        <p class="text-secondary">Participate in markets</p>
                    </div>
                </div>
                <div class="hero-actions" style="margin-top: 3rem;">
                    <button class="btn-primary" onclick="window.app.navigateTo('market')">Start Trading Now</button>
                    <p class="text-secondary" style="margin-top: 1rem;">Experience the thrill of the market with zero financial risk.</p>
                </div>
            </div>
        `;
    }

    renderMarket(container) {
        container.innerHTML = `
            <div class="market-container">
                <h1 class="section-title">Market Listings</h1>
                <div class="market-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${this.stocks.map(stock => {
            const hist = this.history[stock.symbol];
            const last = hist[hist.length - 1];
            const prev = hist[hist.length - 2] || last;
            const changePercent = ((last.c - prev.c) / prev.c * 100).toFixed(2);
            return `
                            <div class="card stock-card" style="cursor:pointer" onclick="window.app.renderStockDetail('${stock.symbol}')">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-weight:700; color:var(--accent)">${stock.symbol}</span>
                                    <span class="${changePercent >= 0 ? 'ticker-up' : 'ticker-down'}" style="font-size:0.85rem">
                                        ${changePercent >= 0 ? '▲' : '▼'} ${Math.abs(changePercent)}%
                                    </span>
                                </div>
                                <h3 style="margin: 0.5rem 0">${stock.name}</h3>
                                <p class="text-secondary" style="font-size:0.9rem">${stock.sector}</p>
                                <div style="margin-top: 1rem; font-size: 1.25rem; font-weight: 700;">₹${stock.currentPrice.toFixed(2)}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    renderPortfolio(container) {
        let totalHoldingsValue = 0;
        const holdings = Object.entries(this.user.portfolio).map(([symbol, data]) => {
            const stock = this.stocks.find(s => s.symbol === symbol);
            const currentVal = stock.currentPrice * data.qty;
            totalHoldingsValue += currentVal;
            const pl = currentVal - (data.avgPrice * data.qty);
            const plPercent = ((stock.currentPrice - data.avgPrice) / data.avgPrice * 100).toFixed(2);

            return `
                <tr>
                    <td>${symbol}</td>
                    <td>${data.qty}</td>
                    <td>₹${data.avgPrice.toFixed(2)}</td>
                    <td>₹${stock.currentPrice.toFixed(2)}</td>
                    <td class="${pl >= 0 ? 'ticker-up' : 'ticker-down'}">₹${pl.toFixed(2)} (${plPercent}%)</td>
                    <td><button class="time-btn" onclick="window.app.sellStock('${symbol}')">Sell</button></td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div class="portfolio-container">
                <h1 class="section-title">My Portfolio</h1>
                <div class="grid-dashboard" style="margin-bottom: 2rem;">
                    <div class="card">
                        <h3>Net Worth</h3>
                        <p class="balance-value">₹${(this.user.balance + totalHoldingsValue).toLocaleString()}</p>
                    </div>
                    <div class="card">
                        <h3>Total P/L</h3>
                        <p class="balance-value ${this.user.stats.realizedPL >= 0 ? 'ticker-up' : 'ticker-down'}">₹${this.user.stats.realizedPL.toLocaleString()}</p>
                    </div>
                </div>
                <div class="card">
                    <table style="width:100%; text-align:left; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border); color: var(--text-secondary)">
                                <th style="padding:1rem 0">Symbol</th>
                                <th>Qty</th>
                                <th>Avg. Buy</th>
                                <th>Current</th>
                                <th>Unrealized P/L</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${holdings || '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No holdings yet. Go to Market to buy stocks.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderNews(container) {
        const newsItem = Engine.generateNews(this.stocks);
        container.innerHTML = `
            <div class="news-container">
                <h1 class="section-title">Market News</h1>
                <div class="card">
                    <h2 style="color:var(--accent)">Breaking: ${newsItem.title}</h2>
                    <p style="margin-top: 1rem; color: var(--text-secondary)">Impact: <span class="${newsItem.impact === 'bullish' ? 'ticker-up' : 'ticker-down'}">${newsItem.impact.toUpperCase()}</span></p>
                    <button class="btn-primary" style="margin-top: 2rem;" onclick="window.app.router('news')">Refresh News</button>
                </div>
            </div>
        `;
    }

    renderStockDetail(symbol) {
        const stock = this.stocks.find(s => s.symbol === symbol);
        const container = document.getElementById('page-content');
        container.innerHTML = `
            <div class="stock-detail">
                <button class="time-btn" onclick="window.app.router('market')" style="margin-bottom: 1rem;">← Back to Market</button>
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 2rem;">
                    <div>
                        <h1 class="section-title" style="margin-bottom:0.25rem">${stock.name} (${stock.symbol})</h1>
                        <p class="text-secondary">${stock.sector} | Volatility: ${(stock.volatility * 100).toFixed(0)}%</p>
                    </div>
                    <div style="text-align:right">
                        <div class="balance-value" style="font-size:2.5rem">₹${stock.currentPrice.toFixed(2)}</div>
                        <p class="text-secondary">Current Price</p>
                    </div>
                </div>

                <div class="detail-grid" style="display:grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                    <div class="card chart-card">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 1.5rem; align-items:center; flex-wrap: wrap; gap: 1rem;">
                             <h3 style="margin-bottom: 0;">Market Performance</h3>
                             <div class="chart-controls" style="display:flex; gap: 1rem;">
                                 <div class="timeframe-selector" style="display:flex; gap: 0.25rem; background: var(--bg-hover); padding: 0.25rem; border-radius: 8px;">
                                    <button class="tf-btn active" data-period="1M">1M</button>
                                    <button class="tf-btn" data-period="1D">1D</button>
                                    <button class="tf-btn" data-period="5D">5D</button>
                                    <button class="tf-btn" data-period="6M">6M</button>
                                    <button class="tf-btn" data-period="1Y">1Y</button>
                                    <button class="tf-btn" data-period="MAX">MAX</button>
                                 </div>
                                 <div class="chart-toggles">
                                    <button class="time-btn" id="toggle-line" style="padding: 0.4rem 0.8rem;">Line</button>
                                    <button class="time-btn" id="toggle-candle" style="padding: 0.4rem 0.8rem;">Candle</button>
                                 </div>
                             </div>
                        </div>
                        <div id="chart-svg-container" style="height: 350px; width:100%; min-height: 250px;"></div>
                        
                        <div class="study-analysis" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                            <h3 style="color:var(--accent); margin-bottom: 1rem;">🔍 Strategic Analysis</h3>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div class="card" style="background: var(--bg-hover); padding: 1rem;">
                                    <h4 style="font-size: 0.9rem; color: var(--text-secondary);">Market Trend</h4>
                                    <p style="font-weight: 600; font-size: 1.1rem; margin-top: 0.5rem; color: ${stock.trendBias === 'bullish' ? 'var(--success)' : (stock.trendBias === 'bearish' ? 'var(--danger)' : 'var(--text-primary)')}">
                                        ${stock.trendBias.toUpperCase()}
                                    </p>
                                </div>
                                <div class="card" style="background: var(--bg-hover); padding: 1rem;">
                                    <h4 style="font-size: 0.9rem; color: var(--text-secondary);">Risk Level</h4>
                                    <p style="font-weight: 600; font-size: 1.1rem; margin-top: 0.5rem; color: ${stock.volatility > 0.3 ? 'var(--danger)' : 'var(--success)'}">
                                        ${stock.volatility > 0.3 ? 'HIGH VOLATILITY' : 'STABLE GROWTH'}
                                    </p>
                                </div>
                            </div>
                            <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                                <strong>Technical Note:</strong> Candlestick patterns showing recent 30-day movement. Observe the ${stock.trendBias} bias before entering large positions.
                            </p>
                        </div>
                    </div>
                    <div class="card">
                        <h3>Trade ${stock.symbol}</h3>
                        <div style="margin-top: 1.5rem;">
                            <label class="text-secondary">Quantity</label>
                            <input type="number" id="trade-qty" value="1" min="1" style="width:100%; padding:0.75rem; background:var(--bg-hover); border:1px solid var(--border); color:white; border-radius:8px; margin-top:0.5rem">
                        </div>
                        <button class="btn-primary" style="width:100%; margin-top: 1.5rem;" onclick="window.app.buyStock('${stock.symbol}')">Buy Shares</button>
                        <p class="text-secondary" style="font-size:0.8rem; margin-top: 1rem; text-align:center;">
                            Estimated Cost: <span id="est-cost">₹${stock.currentPrice.toFixed(2)}</span>
                        </p>
                    </div>
                </div>
            </div>
        `;

        const chartEl = document.getElementById('chart-svg-container');
        let currentType = 'line';
        let currentPeriod = '1M';

        const drawChart = () => {
            const w = chartEl.clientWidth || 600;
            const h = chartEl.clientHeight || 300;

            let data = this.history[symbol];
            switch (currentPeriod) {
                case '1D': data = data.slice(-1); break;
                case '5D': data = data.slice(-5); break;
                case '1M': data = data.slice(-30); break;
                case '6M': data = data.slice(-180); break;
                case '1Y': data = data.slice(-365); break;
                case 'MAX': data = data; break;
            }

            if (currentType === 'line') Charting.renderLineChart(chartEl, data, w, h);
            else Charting.renderCandlestickChart(chartEl, data, w, h);
        };

        // UI Event Listeners
        document.getElementById('toggle-line').onclick = () => { currentType = 'line'; drawChart(); };
        document.getElementById('toggle-candle').onclick = () => { currentType = 'candle'; drawChart(); };

        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPeriod = btn.dataset.period;
                drawChart();
            };
        });

        // Trigger first draw
        requestAnimationFrame(() => drawChart());

        const qtyInput = document.getElementById('trade-qty');
        qtyInput.addEventListener('input', () => {
            const cost = (parseFloat(qtyInput.value) || 0) * stock.currentPrice;
            document.getElementById('est-cost').textContent = `₹${cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        });
    }

    buyStock(symbol) {
        const qtyInput = document.getElementById('trade-qty');
        const qty = parseInt(qtyInput.value);
        const stock = this.stocks.find(s => s.symbol === symbol);
        const totalCost = qty * stock.currentPrice;

        if (this.user.balance >= totalCost) {
            this.user.balance -= totalCost;
            if (!this.user.portfolio[symbol]) {
                this.user.portfolio[symbol] = { qty: 0, avgPrice: 0 };
            }
            const p = this.user.portfolio[symbol];
            const newTotalQty = p.qty + qty;
            p.avgPrice = ((p.avgPrice * p.qty) + (stock.currentPrice * qty)) / newTotalQty;
            p.qty = newTotalQty;

            this.user = Storage.updateUser(this.user);
            this.updateSidebarBalance();

            // Success Message with Time Travel Button
            const container = document.getElementById('page-content');
            const successOverlay = document.createElement('div');
            successOverlay.className = 'card';
            successOverlay.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:2000; text-align:center; padding:3rem; border:2px solid var(--accent);';
            successOverlay.innerHTML = `
                <h2 style="color:var(--success)">Transaction Successful!</h2>
                <p style="margin: 1rem 0">You now own ${qty} shares of ${symbol}.</p>
                <div style="display:flex; flex-direction:column; gap:1rem; margin-top:2rem;">
                    <button class="btn-primary" id="time-travel-btn" style="background:var(--accent); color:black;">⏩ Fast Forward 1 Week</button>
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.remove(); window.app.renderPortfolio(document.getElementById('page-content'))">Go to Portfolio</button>
                </div>
            `;
            document.body.appendChild(successOverlay);

            document.getElementById('time-travel-btn').onclick = () => {
                this.stocks = Engine.advanceTime(7, this.stocks, this.history);
                this.updateSidebarBalance();
                this.renderTicker();
                successOverlay.remove();
                alert('Time Traveled 7 Days! Check your portfolio for P/L changes.');
                this.navigateTo('portfolio');
            };
        } else {
            alert('Insufficient balance!');
        }
    }

    sellStock(symbol) {
        const stock = this.stocks.find(s => s.symbol === symbol);
        const p = this.user.portfolio[symbol];
        if (!p) return;

        const sellVal = p.qty * stock.currentPrice;
        const profit = sellVal - (p.avgPrice * p.qty);

        this.user.balance += sellVal;
        this.user.stats.realizedPL += profit;
        delete this.user.portfolio[symbol];

        Storage.updateUser(this.user);
        this.updateSidebarBalance();
        this.renderPortfolio(document.getElementById('page-content'));
    }

    navigateTo(page) {
        this.currentPage = page;
        this.router(page);
        // update active nav link
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.page === page) li.classList.add('active');
        });
    }
}

window.app = new App();
