// Blood Bank Management System - Chart.js Initializations & Managers

const ChartManager = {
    instances: {},

    // Initialize all charts
    initAllCharts() {
        this.initDashboardBloodGroupChart();
        this.initReportsMonthlyChart();
        this.initReportsDistributionChart();
        this.initReportsUrgencyChart();
        this.initReportsHospitalChart();
        this.initDonationsTrendChart();
    },

    // 1. Main Dashboard Blood Group Inventory Bar Chart
    initDashboardBloodGroupChart() {
        const ctx = document.getElementById('dashboardBloodGroupChart');
        if (!ctx) return;

        if (this.instances.dashboardBloodGroup) {
            this.instances.dashboardBloodGroup.destroy();
        }

        const labels = BloodBankData.stock.map(s => s.group);
        const dataValues = BloodBankData.stock.map(s => s.units);
        const backgroundColors = BloodBankData.stock.map(s => s.units < 15 ? '#EF4444' : (s.units < 25 ? '#F59E0B' : '#C62828'));

        this.instances.dashboardBloodGroup = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Available Units',
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 28
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Units Available: ${context.parsed.y} Units`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    },

    // 2. Reports: Monthly Donations vs Requests Line Chart
    async initReportsMonthlyChart() {
    const ctx = document.getElementById('reportsMonthlyChart');
    if (!ctx) return;

    if (this.instances.reportsMonthly) {
        this.instances.reportsMonthly.destroy();
    }

    this.instances.reportsMonthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Blood Donations',
                    data: [],
                    borderColor: '#C62828',
                    backgroundColor: 'rgba(198, 40, 40, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#C62828',
                    pointRadius: 5
                },
                {
                    label: 'Blood Requests',
                    data: [],
                    borderColor: '#06B6D4',
                    backgroundColor: 'rgba(6, 182, 212, 0.05)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#06B6D4',
                    pointRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    try {
        const response = await fetch(
            'http://localhost:5000/api/reports/monthly'
        );

        if (!response.ok) {
            throw new Error('Failed to load monthly report data.');
        }

        const monthlyData = await response.json();
        const chart = this.instances.reportsMonthly;

        chart.data.labels = monthlyData.map(item => item.month);
        chart.data.datasets[0].data =
            monthlyData.map(item => Number(item.donations));
        chart.data.datasets[1].data =
            monthlyData.map(item => Number(item.requests));

        chart.update();
    } catch (error) {
        console.error('Monthly chart error:', error);
    }
},

    // 3. Reports: Blood Group Distribution Doughnut Chart
    initReportsDistributionChart() {
        const ctx = document.getElementById('reportsDistributionChart');
        if (!ctx) return;

        if (this.instances.reportsDistribution) {
            this.instances.reportsDistribution.destroy();
        }

        const labels = BloodBankData.stock.map(s => s.group);
        const dataValues = BloodBankData.stock.map(s => s.units);

        this.instances.reportsDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: [
                        '#C62828', '#E53935', '#EF5350', '#E57373',
                        '#06B6D4', '#0284C7', '#10B981', '#F59E0B'
                    ],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                },
                cutout: '68%'
            }
        });
    },

    // 4. Reports: Request Urgency Breakdown Bar Chart
    async initReportsUrgencyChart() {
    const ctx = document.getElementById('reportsUrgencyChart');
    if (!ctx) return;

    if (this.instances.reportsUrgency) {
        this.instances.reportsUrgency.destroy();
    }

    this.instances.reportsUrgency = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Emergency', 'High Priority', 'Normal / Elective'],
            datasets: [{
                label: 'Number of Requests',
                data: [0, 0, 0],
                backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
                borderRadius: 8,
                barThickness: 36
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
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    try {
        const response = await fetch('http://localhost:5000/api/reports/urgency');

        if (!response.ok) {
            throw new Error('Failed to fetch urgency report data');
        }

        const rows = await response.json();

        const counts = {
            'Emergency': 0,
            'High Priority': 0,
            'Normal / Elective': 0
        };

        rows.forEach(row => {
            counts[row.urgency] = Number(row.total);
        });

        this.instances.reportsUrgency.data.datasets[0].data = [
            counts['Emergency'],
            counts['High Priority'],
            counts['Normal / Elective']
        ];

        this.instances.reportsUrgency.update();
    } catch (error) {
        console.error('Error loading urgency chart:', error);
    }
},

    // 5. Reports: Hospital Requests Horizontal Bar Chart
    async initReportsHospitalChart() {
    const ctx = document.getElementById('reportsHospitalChart');
    if (!ctx) return;

    if (this.instances.reportsHospital) {
        this.instances.reportsHospital.destroy();
    }

    this.instances.reportsHospital = new Chart(ctx, {
        type: 'bar',
        indexAxis: 'y',
        data: {
            labels: [],
            datasets: [{
                label: 'Approved Request Units',
                data: [],
                backgroundColor: '#C62828',
                borderRadius: 6,
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                y: {
                    grid: { display: false }
                }
            }
        }
    });

    try {
        const response = await fetch(
            'http://localhost:5000/api/reports/hospital-dispatch'
        );

        if (!response.ok) {
            throw new Error('Failed to fetch hospital report data');
        }

        const rows = await response.json();

        this.instances.reportsHospital.data.labels = rows.map(
            row => row.hospital_name.replace(/ Hospital$/i, '')
        );

        this.instances.reportsHospital.data.datasets[0].data = rows.map(
            row => Number(row.units)
        );

        this.instances.reportsHospital.update();
    } catch (error) {
        console.error('Error loading hospital report chart:', error);
    }
},

    // 6. Donation History View Monthly Chart
    async initDonationsTrendChart() {
    const ctx = document.getElementById('donationsTrendChart');
    if (!ctx) return;

    if (this.instances.donationsTrend) {
        this.instances.donationsTrend.destroy();
    }

    this.instances.donationsTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Units Collected',
                data: [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 6,
                pointBackgroundColor: '#10B981'
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
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    try {
        const response = await fetch(
            'http://localhost:5000/api/reports/donations-trend'
        );

        if (!response.ok) {
            throw new Error('Failed to fetch donations trend data');
        }

        const rows = await response.json();

        this.instances.donationsTrend.data.labels =
            rows.map(row => row.week);

        this.instances.donationsTrend.data.datasets[0].data =
            rows.map(row => Number(row.units));

        this.instances.donationsTrend.update();
    } catch (error) {
        console.error('Error loading donations trend chart:', error);
    }
},
    }
;
