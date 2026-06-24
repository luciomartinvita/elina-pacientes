window.Dashboard = {
    charts: {},
    palette: [
        '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
        '#EC4899', '#06B6D4', '#84CC16', '#EF4444',
        '#F97316', '#A78BFA', '#34D399', '#60A5FA'
    ],

    update(pacientes) {
        if (!pacientes) return;
        this.updateStats(pacientes);
        this.renderMonthsChart(pacientes);
        this.renderOSChart(pacientes);
        this.renderCirugiasChart(pacientes);
    },

    updateStats(pacientes) {
        const total = pacientes.length;
        const el = document.getElementById('stat-total');
        if (el) el.textContent = total;

        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const thisMonthCount = pacientes.filter(p => p.fecha && p.fecha.startsWith(currentMonth)).length;
        const elM = document.getElementById('stat-month');
        if (elM) elM.textContent = thisMonthCount;
    },

    _getCtx(id) {
        const canvas = document.getElementById(id);
        if (!canvas) return null;
        return canvas.getContext('2d');
    },

    _textColor() {
        return '#94A3B8';
    },

    renderMonthsChart(pacientes) {
        const ctx = this._getCtx('chart-months');
        if (!ctx) return;

        const counts = {};
        pacientes.forEach(p => {
            if (!p.fecha) return;
            const month = p.fecha.substring(0, 7);
            counts[month] = (counts[month] || 0) + 1;
        });

        const sortedMonths = Object.keys(counts).sort().slice(-12);
        const labels = sortedMonths.map(m => {
            const [y, mm] = m.split('-');
            const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return `${monthNames[parseInt(mm)-1]} ${y.slice(2)}`;
        });
        const data = sortedMonths.map(m => counts[m]);

        if (this.charts.months) this.charts.months.destroy();

        this.charts.months = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Cirugías',
                    data,
                    backgroundColor: this.palette[0],
                    borderRadius: 5,
                    maxBarThickness: 28
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: this._textColor(), precision: 0 },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    },
                    x: {
                        ticks: { color: this._textColor(), maxRotation: 45, font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });
    },

    renderOSChart(pacientes) {
        const ctx = this._getCtx('chart-os');
        if (!ctx) return;

        const counts = {};
        pacientes.forEach(p => {
            const os = (p.obra_social || 'SIN DATOS').toUpperCase().trim();
            counts[os] = (counts[os] || 0) + 1;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const labels = sorted.map(([k]) => k);
        const data = sorted.map(([, v]) => v);

        if (this.charts.os) this.charts.os.destroy();

        const isMobile = window.innerWidth < 600;

        this.charts.os = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: this.palette,
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: isMobile ? 'bottom' : 'right',
                        labels: {
                            color: this._textColor(),
                            font: { size: isMobile ? 9 : 11 },
                            boxWidth: 12,
                            padding: isMobile ? 8 : 12
                        }
                    }
                }
            }
        });
    },

    renderCirugiasChart(pacientes) {
        const ctx = this._getCtx('chart-cirugias');
        if (!ctx) return;

        const counts = {};
        pacientes.forEach(p => {
            if (!p.cirugia) return;
            const c = p.cirugia.toUpperCase().replace(/\s*\(A\)\s*/g, '').trim();
            counts[c] = (counts[c] || 0) + 1;
        });

        // Top 10 en móvil, top 15 en desktop
        const isMobile = window.innerWidth < 600;
        const limit = isMobile ? 8 : 12;
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);

        const labels = sorted.map(([k]) => k);
        const data = sorted.map(([, v]) => v);
        const colors = sorted.map((_, i) => this.palette[i % this.palette.length]);

        if (this.charts.cirugias) this.charts.cirugias.destroy();

        this.charts.cirugias = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Cantidad',
                    data,
                    backgroundColor: colors,
                    borderRadius: 4,
                    maxBarThickness: 22
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: this._textColor(), precision: 0 },
                        grid: { color: 'rgba(255,255,255,0.06)' }
                    },
                    y: {
                        ticks: {
                            color: this._textColor(),
                            font: { size: isMobile ? 9 : 11 }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
};
