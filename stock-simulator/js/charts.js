export const Charting = {
    renderLineChart(element, data, width, height) {
        if (!data || data.length === 0) return;

        const padding = 40;
        const svgWidth = width || element.clientWidth || 600;
        const svgHeight = height || element.clientHeight || 300;

        const innerWidth = svgWidth - padding * 2;
        const innerHeight = svgHeight - padding * 2;

        const maxPrice = Math.max(...data.map(d => d.c)) * 1.05;
        const minPrice = Math.min(...data.map(d => d.c)) * 0.95;
        const priceRange = maxPrice - minPrice;

        const points = data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * innerWidth;
            const y = svgHeight - padding - ((d.c - minPrice) / priceRange) * innerHeight;
            return `${x},${y}`;
        }).join(' ');

        element.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none" style="display:block; min-height: 200px;">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:var(--accent);stop-opacity:0.4" />
                        <stop offset="100%" style="stop-color:var(--accent);stop-opacity:0" />
                    </linearGradient>
                </defs>
                <!-- Axes -->
                <line x1="${padding}" y1="${svgHeight - padding}" x2="${svgWidth - padding}" y2="${svgHeight - padding}" stroke="var(--border)" stroke-width="1" />
                <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${svgHeight - padding}" stroke="var(--border)" stroke-width="1" />

                <!-- Data Path -->
                <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" />
                
                <!-- Fill Area -->
                <polyline points="${padding},${svgHeight - padding} ${points} ${svgWidth - padding},${svgHeight - padding}" 
                          fill="url(#gradient)" stroke="none" />
                
                <!-- Labels -->
                <text x="${padding - 5}" y="${padding}" fill="var(--text-secondary)" font-size="10" text-anchor="end">₹${maxPrice.toFixed(0)}</text>
                <text x="${padding - 5}" y="${svgHeight - padding}" fill="var(--text-secondary)" font-size="10" text-anchor="end">₹${minPrice.toFixed(0)}</text>
            </svg>
        `;
    },

    renderCandlestickChart(element, data, width, height) {
        if (!data || data.length === 0) return;

        const padding = 40;
        const svgWidth = width || element.clientWidth || 600;
        const svgHeight = height || element.clientHeight || 300;
        const innerWidth = svgWidth - padding * 2;
        const innerHeight = svgHeight - padding * 2;

        const maxPrice = Math.max(...data.map(d => d.h)) * 1.02;
        const minPrice = Math.min(...data.map(d => d.l)) * 0.98;
        const priceRange = maxPrice - minPrice;

        const candleWidth = Math.max(2, (innerWidth / data.length) * 0.7);

        let candlesHtml = '';
        data.forEach((d, i) => {
            const x = padding + (i / data.length) * innerWidth;
            const openY = svgHeight - padding - ((d.o - minPrice) / priceRange) * innerHeight;
            const closeY = svgHeight - padding - ((d.c - minPrice) / priceRange) * innerHeight;
            const highY = svgHeight - padding - ((d.h - minPrice) / priceRange) * innerHeight;
            const lowY = svgHeight - padding - ((d.l - minPrice) / priceRange) * innerHeight;

            const isUp = d.c >= d.o;
            const color = isUp ? '#22c55e' : '#ef4444';

            candlesHtml += `
                <line x1="${x + candleWidth / 2}" y1="${highY}" x2="${x + candleWidth / 2}" y2="${lowY}" stroke="${color}" stroke-width="1.5" />
                <rect x="${x}" y="${Math.min(openY, closeY)}" width="${candleWidth}" height="${Math.max(1, Math.abs(openY - closeY))}" fill="${color}" rx="1" />
            `;
        });

        element.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none" style="display:block; min-height: 200px;">
                <!-- Axes -->
                <line x1="${padding}" y1="${svgHeight - padding}" x2="${svgWidth - padding}" y2="${svgHeight - padding}" stroke="var(--border)" stroke-width="1" />
                <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${svgHeight - padding}" stroke="var(--border)" stroke-width="1" />
                
                ${candlesHtml}
                
                <!-- Labels -->
                <text x="${padding - 5}" y="${padding}" fill="var(--text-secondary)" font-size="10" text-anchor="end">₹${maxPrice.toFixed(0)}</text>
                <text x="${padding - 5}" y="${svgHeight - padding}" fill="var(--text-secondary)" font-size="10" text-anchor="end">₹${minPrice.toFixed(0)}</text>
            </svg>
        `;
    }
};
