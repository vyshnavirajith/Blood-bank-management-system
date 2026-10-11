// Blood Bank Management System - Main Application Logic & View Controller

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const App = {
    currentView: 'dashboard-view',
    isDarkMode: false,
    deleteCallback: null,

    init() {
    this.loadSavedSettings();
    this.bindEvents();
    this.renderAllViews();
    ChartManager.initAllCharts();
    this.updateStatsCounters();
    console.log('Blood Bank Admin System Initialized');
},

    // Bind Navigation & UI Events
    bindEvents() {
    // Navigation clicks
    document.querySelectorAll('[data-view-target]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view-target');
            this.switchView(targetView);
        });
    });

    // Dark mode toggle buttons
    document.querySelectorAll('.btn-dark-mode-toggle').forEach(btn => {
        btn.addEventListener('change', () => {
            const requestedMode = btn.checked;

            if (this.isDarkMode !== requestedMode) {
                this.toggleDarkMode();
            }
        });
    });

    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (event) => {
            this.saveProfile(event);
        });
    }

    // Save system preferences
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            this.savePreferences();
        });
    }

    // Change profile photo
    const changePhotoBtn = document.getElementById('change-profile-photo');
    const photoInput = document.getElementById('profile-photo-input');

    if (changePhotoBtn && photoInput) {
        changePhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (event) => {
            this.handleProfilePhoto(event);
        });
    }

    // Mobile sidebar toggle
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
            }
        });
    }

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    // Password visibility toggle
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('loginPassword');
            const icon = togglePasswordBtn.querySelector('i');

            if (passwordInput && icon) {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fa-solid fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fa-solid fa-eye';
                }
            }
        });
    }

    // Logout
    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
    });

    // Filter events for Donors
    const donorSearch = document.getElementById('donorSearchInput');
    const donorBgFilter = document.getElementById('donorBgFilter');
    const donorCityFilter = document.getElementById('donorCityFilter');
    const donorGenderFilter = document.getElementById('donorGenderFilter');

    [donorSearch, donorBgFilter, donorCityFilter, donorGenderFilter].forEach(el => {
        if (el) {
            el.addEventListener('input', () => this.renderDonorsTable());
            el.addEventListener('change', () => this.renderDonorsTable());
        }
    });

    // Filter events for Recipients
    const recipientSearch = document.getElementById('recipientSearchInput');
    const recipientBgFilter = document.getElementById('recipientBgFilter');

    if (recipientSearch) {
        recipientSearch.addEventListener('input', () => this.renderRecipientsTable());
    }

    if (recipientBgFilter) {
        recipientBgFilter.addEventListener('change', () => this.renderRecipientsTable());
    }

    // Filter events for Requests Tabs
    document.querySelectorAll('#requestStatusTabs button').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => {
            document.querySelectorAll('#requestStatusTabs button').forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-outline-secondary');
            });

            tabBtn.classList.remove('btn-outline-secondary');
            tabBtn.classList.add('active', 'btn-primary');

            const filter = tabBtn.getAttribute('data-filter');
            this.renderRequestsTable(filter);
        });
    });

    // Confirmation Modal Confirm Action
    const btnConfirmAction = document.getElementById('btnConfirmAction');
    if (btnConfirmAction) {
        btnConfirmAction.addEventListener('click', () => {
            if (typeof this.deleteCallback === 'function') {
                this.deleteCallback();
                this.deleteCallback = null;
            }

            const modalEl = document.getElementById('confirmModal');

            if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) {
                    modal.hide();
                }
            }
        });
    }
    const createRequestBtn = document.getElementById('btnShowCreateRequest');
const createRequestCard = document.getElementById('createRequestCard');
const cancelRequestBtn = document.getElementById('btnCancelCreateRequest');
const createRequestForm = document.getElementById('createRequestForm');

if (createRequestBtn && createRequestCard) {
    createRequestBtn.addEventListener('click', () => {
        createRequestCard.classList.remove('d-none');
        this.loadRequestFormOptions();
    });
}

if (cancelRequestBtn && createRequestCard) {
    cancelRequestBtn.addEventListener('click', () => {
        createRequestForm.reset();
        createRequestCard.classList.add('d-none');
    });
}

if (createRequestForm) {
    createRequestForm.addEventListener('submit', event => {
        this.createBloodRequest(event);
    });
}
const donorStatusInput = document.getElementById('donorStatusInput');

if (donorStatusInput) {
    const toggleDonationDetails = () => {
        const details = document.getElementById('donorDonationDetails');
        const campInput = document.getElementById('donorCampInput');
        const dateInput = document.getElementById('donorDonationDateInput');
        const unitsInput = document.getElementById('donorUnitsInput');

        const isDonated = donorStatusInput.value === 'Donated';

        if (details) {
            details.classList.toggle('d-none', !isDonated);
        }

        if (campInput) campInput.required = isDonated;
        if (dateInput) dateInput.required = isDonated;
        if (unitsInput) unitsInput.required = isDonated;
    };

    donorStatusInput.addEventListener('change', toggleDonationDetails);

    // Set the correct visibility when the form opens or initializes.
    toggleDonationDetails();
}
const addStockButton = document.getElementById('btnShowAddStock');
const addStockCard = document.getElementById('addStockCard');
const addStockForm = document.getElementById('addStockForm');
const cancelAddStockButton = document.getElementById('btnCancelAddStock');

if (addStockButton && addStockCard) {
    addStockButton.addEventListener('click', () => {
        addStockCard.classList.remove('d-none');
        this.loadAddStockHospitals();
    });
}

if (cancelAddStockButton && addStockCard && addStockForm) {
    cancelAddStockButton.addEventListener('click', () => {
        addStockForm.reset();
        addStockCard.classList.add('d-none');
    });
}

if (addStockForm) {
    addStockForm.addEventListener('submit', event => {
        this.createBloodStock(event);
    });
}
},

    // Switch active view
    switchView(viewId) {
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.remove('active-view');
        });

        const targetEl = document.getElementById(viewId);
        if (targetEl) {
            targetEl.classList.add('active-view');
            this.currentView = viewId;
        }

        // Update sidebar nav active highlight
        document.querySelectorAll('.nav-link-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-view-target') === viewId) {
                item.classList.add('active');
            }
        });

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');

        // Refresh charts on view change
        setTimeout(() => {
            ChartManager.initAllCharts();
        }, 100);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Toggle Dark / Light Theme
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.querySelectorAll('.btn-dark-mode-toggle i').forEach(i => i.className = 'fa-solid fa-sun');
            this.showToast('Theme Updated', 'Switched to Healthcare Dark Mode', 'info');
        } else {
            document.body.classList.remove('dark-mode');
            document.querySelectorAll('.btn-dark-mode-toggle i').forEach(i => i.className = 'fa-solid fa-moon');
            this.showToast('Theme Updated', 'Switched to Clean Light Mode', 'info');
        }
        ChartManager.initAllCharts();
    },

    // Login Handler
    handleLogin() {
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');

        if (!usernameInput.value || !passwordInput.value) {
            this.showToast('Authentication Error', 'Please enter valid staff credentials', 'danger');
            return;
        }

        // Simulate successful login transition
        const loginBtn = document.getElementById('btnLoginSubmit');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Authenticating...';

        setTimeout(() => {
            document.getElementById('login-view').style.display = 'none';
            document.getElementById('app-wrapper').style.display = 'flex';
            this.switchView('dashboard-view');
            this.showToast('Welcome Back!', 'Logged in as Chief Blood Bank Manager', 'success');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i> Sign In to Dashboard';
        }, 800);
    },

    // Logout Handler
    handleLogout() {
        document.getElementById('app-wrapper').style.display = 'none';
        document.getElementById('login-view').style.display = 'flex';
        this.showToast('Logged Out', 'You have been safely logged out', 'info');
    },

    // Update Top Counters & Stats Cards
    async updateStatsCounters() {
    const elPending = document.getElementById('statPendingReqs');
    const elApproved = document.getElementById('statApprovedReqs');    
    const elTotalDonors = document.getElementById('statTotalDonors');
    const elTotalUnits = document.getElementById('statTotalUnits');
    const elTotalHospitals = document.getElementById('statTotalHospitals');

    try {
        const response = await fetch(
            'http://localhost:5000/api/dashboard-stats'
        );

        if (!response.ok) {
            throw new Error('Failed to load dashboard statistics');
        }

        const stats = await response.json();

        if (elTotalDonors) {
            elTotalDonors.textContent = stats.totalDonors;
        }

        if (elTotalUnits) {
            elTotalUnits.textContent = `${stats.totalUnits} Units`;
        }

        if (elTotalHospitals) {
            elTotalHospitals.textContent = stats.totalHospitals;
        }
        if (elPending) {
    elPending.textContent = stats.pendingRequests;
}

if (elApproved) {
    elApproved.textContent = stats.approvedRequests;
}

    } catch (error) {
        console.error('Dashboard statistics error:', error);
        this.showToast(
            'Dashboard Error',
            'Could not load live statistics from the database.',
            'danger'
        );
    }
},

    // Render All Views
    renderAllViews() {
        this.renderStockCards();
        this.renderDonorsTable();
        this.renderRecipientsTable();
        this.renderRequestsTable('All');
        this.renderDonationsTable();
        this.renderHospitalsGrid();
        this.renderRecentActivities();
        this.renderLatestDashboardRequests();
    },

    async renderStockCards() {
    const container = document.getElementById('stockCardsContainer');
    if (!container) return;

    try {
        const response = await fetch('http://localhost:5000/api/blood-stock');

        if (!response.ok) {
            throw new Error('Failed to fetch blood stock');
        }

        const stockData = await response.json();

        BloodBankData.stock = stockData.map(item => ({
            id:Number(item.stock_id),
            hospitalId: item.hospital_id,
            hospitalName: item.name,
            group: item.blood_group_code,
            units: Number(item.units_available),
            capacity: Number(item.target_capacity),
            lastUpdated: item.last_updated
        }));

        let html = '';

        BloodBankData.stock.forEach(item => {
            const isLow = item.units < 15;

            const percentage = item.capacity > 0
                ? Math.round((item.units / item.capacity) * 100)
                : 0;

            let statusBadge =
                `<span class="badge-soft badge-soft-success">Optimal</span>`;

            if (isLow) {
                statusBadge =
                    `<span class="badge-soft badge-soft-danger pulse-danger">
                        <i class="fa-solid fa-triangle-exclamation"></i> Low Stock
                    </span>`;
            } else if (item.units < 25) {
                statusBadge =
                    `<span class="badge-soft badge-soft-warning">Moderate</span>`;
            }

            let updatedTime = item.lastUpdated
                ? new Date(item.lastUpdated).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : '-';

            html += `
                <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                    <div class="stock-card ${isLow ? 'critical-stock' : ''}">

                        <div class="stock-header">
                            <span class="badge-blood-group fs-5">
                                ${item.group}
                            </span>
                            ${statusBadge}
                        </div>
                        <div class="text-muted small mt-2 mb-3">
                        <i class="fa-solid fa-hospital me-1"></i>
                        ${item.hospitalName || `Hospital ID: ${item.hospitalId}`}
                        </div>

                        <div class="d-flex align-items-baseline gap-2 mb-2">
                            <span class="stock-number">${item.units}</span>
                            <span class="stock-unit-label">
                                / ${item.capacity} Units Target
                            </span>
                        </div>

                        <div class="progress mb-3" style="height: 8px;">
                            <div
                                class="progress-bar ${isLow ? 'bg-danger' : 'bg-success'}"
                                role="progressbar"
                                style="width: ${Math.min(percentage, 100)}%"
                                aria-valuenow="${percentage}"
                                aria-valuemin="0"
                                aria-valuemax="100">
                            </div>
                        </div>

                        <div class="d-flex align-items-center justify-content-between text-muted fs-7 mb-3">
                            <span>
                                <i class="fa-regular fa-clock me-1"></i>
                                Updated: ${updatedTime}
                            </span>

                            <span>${percentage}% Capacity</span>
                        </div>

                        <div class="d-flex gap-2">

                            <button
                                class="btn btn-sm btn-outline-danger flex-fill"
                                onclick="App.adjustStock('${item.id}', 1)">
                                <i class="fa-solid fa-plus me-1"></i>
                                Add
                            </button>

                            <button
                                class="btn btn-sm btn-outline-secondary flex-fill"
                                onclick="App.adjustStock('${item.id}', -1)">
                                <i class="fa-solid fa-minus me-1"></i>
                                Deduct
                            </button>

                            <button
                                class="btn btn-sm btn-light"
                                onclick="App.openUpdateStockModal('${item.id}')"
                                title="Update Stock">
                                <i class="fa-solid fa-sliders"></i>
                            </button>

                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading blood stock:', error);

        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Failed to load blood stock from database.
                </div>
            </div>
        `;
    }
},



// Quick Adjust Stock
async adjustStock(stockId, delta) {
    stockId = Number(stockId);

    const item = BloodBankData.stock.find(
        s => Number(s.id) === stockId
    );

    if (!item) {
        console.log("Stock ID received:", stockId);
        console.log("Available stock records:", BloodBankData.stock);

        this.showToast(
            'Error',
            'Stock record not found.',
            'danger'
        );
        return;
    }

    const newUnits = Math.max(0, item.units + delta);

    try {
        const response = await fetch(
            `http://localhost:5000/api/blood-stock/${stockId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    units_available: newUnits,
                    target_capacity: item.capacity
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to update blood stock'
            );
        }

        await this.renderStockCards();

        this.updateStatsCounters();

        ChartManager.initDashboardBloodGroupChart();

        this.showToast(
            'Stock Updated',
            `Stock updated to ${newUnits} units.`,
            'success'
        );

    } catch (error) {
        console.error('Error updating blood stock:', error);

        this.showToast(
            'Update Failed',
            error.message,
            'danger'
        );
    }
},
openUpdateStockModal(stockId) {
    const item = BloodBankData.stock.find(
        s => Number(s.id) === Number(stockId)
    );

    if (!item) {
        this.showToast('Error', 'Stock record not found.', 'danger');
        return;
    }

    this.editingStockId = Number(item.id);

    document.getElementById('modalStockGroup').value = item.group;
    document.getElementById('modalStockUnits').value = item.units;
    document.getElementById('modalStockTarget').value = item.capacity;

    const modal = new bootstrap.Modal(
        document.getElementById('updateStockModal')
    );

    modal.show();
},
    
async saveStockModal() {
    const stockId = Number(this.editingStockId);
    const newUnits = Number(
        document.getElementById('modalStockUnits').value
    );
    const newTarget = Number(
        document.getElementById('modalStockTarget').value
    );

    if (
        !Number.isInteger(stockId) ||
        !Number.isInteger(newUnits) ||
        !Number.isInteger(newTarget) ||
        newUnits < 0 ||
        newTarget <= 0
    ) {
        this.showToast(
            'Invalid Values',
            'Enter valid non-negative units and a target greater than zero.',
            'danger'
        );
        return;
    }

    const item = BloodBankData.stock.find(
        s => Number(s.id) === stockId
    );

    if (!item) {
        this.showToast('Error', 'Stock record not found.', 'danger');
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/api/blood-stock/${stockId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    units_available: newUnits,
                    target_capacity: newTarget
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || 'Failed to update blood stock'
            );
        }

        const modalEl = document.getElementById('updateStockModal');
        const modal = bootstrap.Modal.getInstance(modalEl);

        if (modal) {
            modal.hide();
        }

        await this.renderStockCards();
        this.updateStatsCounters();
        ChartManager.initDashboardBloodGroupChart();

        this.showToast(
            'Stock Updated',
            `Inventory for ${item.group} saved successfully!`,
            'success'
        );

    } catch (error) {
        console.error('Error saving blood stock:', error);

        this.showToast(
            'Update Failed',
            error.message,
            'danger'
        );
    }
},
    


    // 2. Render Donors Table
async renderDonorsTable() {
    const tbody = document.getElementById('donorsTableBody');
    if (!tbody) return;

    const search = (document.getElementById('donorSearchInput')?.value || '').toLowerCase();
    const bgFilter = document.getElementById('donorBgFilter')?.value || '';
    const cityFilter = document.getElementById('donorCityFilter')?.value || '';
    const genderFilter = document.getElementById('donorGenderFilter')?.value || '';

    try {
        const response = await fetch('http://localhost:5000/api/donors');

        if (!response.ok) {
            throw new Error('Failed to fetch donors');
        }

        const donors = await response.json();

        BloodBankData.donors = donors.map(d => ({
            id: String(d.donor_id),
            name: d.name,
            age: d.age,
            gender: d.gender,
            bloodGroup: d.blood_group_code,
            phone: d.phone || '',
            email: d.email || '',
            address: d.address || '',
            city: d.address || '',
            lastDonationDate: d.last_donation_date || '',
            eligibility: d.eligibility_status || '',
            totalDonations: 0
        }));

        const filtered = BloodBankData.donors.filter(d => {
            const matchesSearch =
                d.name.toLowerCase().includes(search) ||
                d.id.toLowerCase().includes(search) ||
                d.phone.toLowerCase().includes(search);

            const matchesBg = !bgFilter || d.bloodGroup === bgFilter;
            const matchesCity = !cityFilter || d.city === cityFilter;
            const matchesGender = !genderFilter || d.gender === genderFilter;

            return matchesSearch && matchesBg && matchesCity && matchesGender;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No donors found matching criteria.</td></tr>`;
            return;
        }

        let html = '';

        filtered.forEach(d => {
            let statusBadge = '';

            if (d.eligibility === 'Eligible') {
                statusBadge = `<span class="badge-soft badge-soft-success"><i class="fa-solid fa-circle-check"></i> Eligible</span>`;
            } else if (d.eligibility === 'Resting') {
                statusBadge = `<span class="badge-soft badge-soft-warning"><i class="fa-solid fa-clock"></i> Resting</span>`;
            } else if (d.eligibility === 'Donated') {
                statusBadge = `<span class="badge-soft badge-soft-info"><i class="fa-solid fa-droplet"></i> Donated</span>`;
            } else {
                statusBadge = `<span class="badge-soft badge-soft-danger"><i class="fa-solid fa-ban"></i> Ineligible</span>`;
            }

            html += `
                <tr>
                    <td><strong class="text-dark">${d.id}</strong></td>

                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="entity-icon-avatar entity-icon-donor">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <div>
                                <div class="fw-bold">${d.name}</div>
                                <div class="fs-7 text-muted">${d.email}</div>
                            </div>
                        </div>
                    </td>

                    <td>${d.age} / ${d.gender}</td>

                    <td>
                        <span class="badge-blood-group">${d.bloodGroup}</span>
                    </td>

                    <td>${d.phone}</td>

                    <td>${d.city}</td>

                    <td>${d.lastDonationDate}</td>

                    <td>${statusBadge}</td>

                    <td>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-light"
                                onclick="App.viewDonorDetails('${d.id}')"
                                title="View Details">
                                <i class="fa-solid fa-eye text-primary"></i>
                            </button>

                            <button class="btn btn-sm btn-light"
                                onclick="App.openEditDonorModal('${d.id}')"
                                title="Edit">
                                <i class="fa-solid fa-pen-to-square text-secondary"></i>
                            </button>

                            <button class="btn btn-sm btn-light"
                                onclick="App.confirmDeleteDonor('${d.id}')"
                                title="Delete">
                                <i class="fa-solid fa-trash text-danger"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

    } catch (error) {
        console.error('Error loading donors:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-danger">
                    Failed to load donors from database.
                </td>
            </tr>
        `;
    }
},

openAddDonorModal() {
    document.getElementById('donorForm').reset();

    document.getElementById('donorModalTitle').textContent = 'Register New Donor';

    document.getElementById('donorEditId').value = '';

    const modal = new bootstrap.Modal(
        document.getElementById('donorModal')
    );

    modal.show();
},

async openEditDonorModal(id) {
    try {
        const response = await fetch(
            `http://localhost:5000/api/donors/${id}`
        );

        if (!response.ok) {
            throw new Error('Donor not found');
        }

        const d = await response.json();

        document.getElementById('donorModalTitle').textContent =
            'Edit Donor Information';

        document.getElementById('donorEditId').value = d.donor_id;

        document.getElementById('donorNameInput').value =
            d.name || '';

        document.getElementById('donorAgeInput').value =
            d.age || '';

        document.getElementById('donorGenderInput').value =
            d.gender || '';

        document.getElementById('donorBgInput').value =
            d.blood_group_code || '';

        document.getElementById('donorPhoneInput').value =
            d.phone || '';

        document.getElementById('donorEmailInput').value =
            d.email || '';

        document.getElementById('donorCityInput').value =
            d.address || '';

        document.getElementById('donorStatusInput').value =
            d.eligibility_status || '';

        const modal = new bootstrap.Modal(
            document.getElementById('donorModal')
        );

        modal.show();

    } catch (error) {
        console.error(error);

        this.showToast(
            'Error',
            'Unable to load donor details',
            'danger'
        );
    }
},

async saveDonorForm() {
    const editId = document.getElementById('donorEditId').value;

    const name = document.getElementById('donorNameInput').value.trim();
    const age = parseInt(document.getElementById('donorAgeInput').value) || 25;
    const gender = document.getElementById('donorGenderInput').value;
    const bloodGroup = document.getElementById('donorBgInput').value;
    const phone = document.getElementById('donorPhoneInput').value.trim();
    const email = document.getElementById('donorEmailInput').value.trim();
    const city = document.getElementById('donorCityInput').value.trim();
    const status = document.getElementById('donorStatusInput').value;
console.log("Selected donor status:", status);
console.log("Selected donation camp:", document.getElementById('donorCampInput')?.value);
    const isDonated = status === 'Donated';

    const campInput = document.getElementById('donorCampInput');
    const dateInput = document.getElementById('donorDonationDateInput');
    const unitsInput = document.getElementById('donorUnitsInput');

    const campId = campInput ? campInput.value : '';
    const donationDate = dateInput ? dateInput.value : '';
    const units = unitsInput ? Number(unitsInput.value) : NaN;

    if (!name || !phone) {
        this.showToast(
            'Validation Error',
            'Please complete all required fields.',
            'warning'
        );
        return;
    }

    if (isDonated && (
        !campId ||
        !donationDate ||
        !Number.isInteger(units) ||
        units < 1
    )) {
        this.showToast(
            'Validation Error',
            'Please select a donation camp and date, and enter valid units.',
            'warning'
        );
        return;
    }

    if (isDonated && donationDate > new Date().toISOString().split('T')[0]) {
        this.showToast(
            'Validation Error',
            'Donation date cannot be in the future.',
            'warning'
        );
        return;
    }

    const donorData = {
        name,
        age,
        gender,
        blood_group_code: bloodGroup,
        phone,
        email,
        address: city,
        last_donation_date: isDonated
            ? donationDate
            : null,
        eligibility_status: status
    };

    if (isDonated) {
        donorData.camp_id = Number(campId);
        donorData.donation_date = donationDate;
        donorData.units_donated = units;
    }

    try {
        let response;

        if (editId) {
            response = await fetch(
                `http://localhost:5000/api/donors/${editId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(donorData)
                }
            );
        } else {
            const donorId = Math.floor(1000 + Math.random() * 9000);
            donorData.donor_id = donorId;

            response = await fetch(
                'http://localhost:5000/api/donors',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(donorData)
                }
            );
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || result.message || 'Database operation failed.'
            );
        }

        await this.renderDonorsTable();
        await this.updateStatsCounters();

        if (isDonated && !editId) {
            // Refresh donation history after the backend saves the record.
            const historyResponse = await fetch(
                'http://localhost:5000/api/donations'
            );

            if (!historyResponse.ok) {
                throw new Error(
                    'Donor saved, but donation history could not be refreshed.'
                );
            }

            // Replace this with your actual history-rendering method
            // if it has a different name.
            if (typeof this.renderDonationHistory === 'function') {
                await this.renderDonationHistory();
            }

            this.showToast(
                'Donation Recorded',
                `${name} was registered and added to donation history.`,
                'success'
            );
        } else {
            this.showToast(
                editId ? 'Donor Updated' : 'Donor Registered',
                editId
                    ? `Details for ${name} updated successfully.`
                    : `New donor ${name} added successfully.`,
                'success'
            );
        }

        const modalEl = document.getElementById('donorModal');
        const modal = bootstrap.Modal.getInstance(modalEl);

        if (modal) {
            modal.hide();
        }

    } catch (error) {
        console.error('Save donor error:', error);

        this.showToast(
            'Database Error',
            error.message,
            'danger'
        );
    }
},

async viewDonorDetails(id) {

    try {

        const response = await fetch(
            `http://localhost:5000/api/donors/${id}`
        );

        if (!response.ok) {
            throw new Error('Donor not found');
        }

        const d = await response.json();

        const content = `
            <div class="text-center mb-4">

                <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                    class="rounded-circle mb-2 border border-3 border-danger"
                    width="90"
                    height="90"
                    alt="${d.name}"
                >

                <h5 class="fw-bold mb-1">
                    ${d.name}
                </h5>

                <span class="badge-blood-group me-2">
                    ${d.blood_group_code}
                </span>

                <span class="badge-soft badge-soft-success">
                    ${d.eligibility_status}
                </span>

            </div>

            <div class="row g-3 fs-7">

                <div class="col-6">
                    <strong>Donor ID:</strong>
                    ${d.donor_id}
                </div>

                <div class="col-6">
                    <strong>Age/Gender:</strong>
                    ${d.age} yrs / ${d.gender}
                </div>

                <div class="col-6">
                    <strong>Phone:</strong>
                    ${d.phone || '-'}
                </div>

                <div class="col-6">
                    <strong>Email:</strong>
                    ${d.email || '-'}
                </div>

                <div class="col-6">
                    <strong>City:</strong>
                    ${d.address || '-'}
                </div>

                <div class="col-6">
                    <strong>Total Donations:</strong>
                    Available through Donation History
                </div>

                <div class="col-12">
                    <strong>Address:</strong>
                    ${d.address || '-'}
                </div>

                <div class="col-12">
                    <strong>Last Donation Date:</strong>
                    ${d.last_donation_date || '-'}
                </div>

            </div>
        `;

        document.getElementById(
            'donorDetailsModalContent'
        ).innerHTML = content;

        const modal = new bootstrap.Modal(
            document.getElementById('donorDetailsModal')
        );

        modal.show();

    } catch (error) {

        console.error(error);

        this.showToast(
            'Error',
            'Unable to load donor details',
            'danger'
        );
    }
},
    confirmDeleteDonor(id) {
    this.showConfirmModal(
        "Delete Donor",
        "Are you sure you want to delete this donor?",
        async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/api/donors/${id}`,
                    {
                        method: "DELETE"
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Failed to delete donor"
                    );
                }

                this.showToast(
                    "Donor Deleted",
                    "Donor deleted successfully",
                    "success"
                );

                await this.renderDonorsTable();
                this.updateStatsCounters();

            } catch (error) {
                console.error("Delete donor error:", error);

                this.showToast(
                    "Delete Failed",
                    error.message,
                    "danger"
                );
            }
        }
    );

},



    // 3. Render Recipients Table
async renderRecipientsTable() {
    const tbody = document.getElementById('recipientsTableBody');
    if (!tbody) return;

    try {
        const response = await fetch('http://localhost:5000/api/recipients');

        if (!response.ok) {
            throw new Error('Failed to fetch recipients');
        }

        const data = await response.json();
        console.log("Recipient API data:", data);
console.log("Mapped recipients:", data.map(r => ({
    id: r.recipient_id,
    name: r.name,
    units: r.units_needed
})));
        BloodBankData.recipients = data.map(r => ({
            id: String(r.recipient_id),
            name: r.name,
            age: r.age,
            gender: r.gender,
            bloodGroupNeeded: r.blood_group_needed,
            hospital: `Hospital ID: ${r.hospital_id}`,
            doctor: `Doctor ID: ${r.attending_doctor_id}`,
            dateRegistered: r.date_registered,
            unitsNeeded: r.units_needed 
        }));

        const search = (
            document.getElementById('recipientSearchInput')?.value || ''
        ).toLowerCase();

        const bgFilter =
            document.getElementById('recipientBgFilter')?.value || '';

        const filtered = BloodBankData.recipients.filter(r => {
            const matchesSearch =
                r.name.toLowerCase().includes(search) ||
                r.id.toLowerCase().includes(search) ||
                r.hospital.toLowerCase().includes(search);

            const matchesBg =
                !bgFilter || r.bloodGroupNeeded === bgFilter;

            return matchesSearch && matchesBg;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-4 text-muted">
                        No recipients found.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';

        filtered.forEach(r => {
            html += `
                <tr>
                    <td><strong>${r.id}</strong></td>
                    <td class="fw-bold">${r.name}</td>
                    <td>${r.age} / ${r.gender}</td>
                    <td>
                        <span class="badge-blood-group">
                            ${r.bloodGroupNeeded}
                        </span>
                    </td>
                    <td>${r.hospital}</td>
                    <td>${r.doctor}</td>
                    <td>${r.unitsNeeded??'-'}</td>
<td><span class="text-muted">Not recorded</span></td>
<td><span class="text-muted">Not recorded</span></td>
                    <td>
                        <div class="d-flex gap-1">
                            <button
                                class="btn btn-sm btn-light"
                                onclick="App.confirmDeleteRecipient('${r.id}')"
                                title="Delete">
                                <i class="fa-solid fa-trash text-danger"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

    } catch (error) {
        console.error('Error loading recipients:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-danger">
                    Failed to load recipients from database.
                </td>
            </tr>
        `;
    }
},

async openAddRecipientModal() {
    try {
        const response = await fetch(
            'http://localhost:5000/api/recipient-form-options'
        );

        if (!response.ok) {
            throw new Error('Failed to load hospitals and doctors');
        }

        const data = await response.json();

        const hospitalSelect = document.getElementById('rcpHospitalInput');
        const doctorSelect = document.getElementById('rcpDoctorInput');

        hospitalSelect.innerHTML =
            '<option value="">Select Hospital</option>';

        doctorSelect.innerHTML =
            '<option value="">Select Doctor</option>';

        data.hospitals.forEach(hospital => {
            hospitalSelect.add(new Option(
                hospital.name,
                hospital.hospital_id
            ));
        });

        data.doctors.forEach(doctor => {
            doctorSelect.add(new Option(
                doctor.name,
                doctor.staff_id
            ));
        });

        const modal = new bootstrap.Modal(
            document.getElementById('recipientModal')
        );

        modal.show();

    } catch (error) {
        console.error(error);

        this.showToast(
            'Error',
            'Could not load hospitals and doctors.',
            'danger'
        );
    }
}, 

    
async saveRecipientForm() {
    const name = document.getElementById('rcpNameInput').value.trim();
    const age = parseInt(document.getElementById('rcpAgeInput').value);
    const gender = document.getElementById('rcpGenderInput').value;
    const bloodGroup = document.getElementById('rcpBgInput').value;
    const hospital = document.getElementById('rcpHospitalInput').value;
    const doctor = document.getElementById('rcpDoctorInput').value;

    const units = parseInt(document.getElementById('rcpUnitsInput').value) || 1;
    const priority = document.getElementById('rcpPriorityInput').value;

    if (!name || !age || !gender || !bloodGroup || !hospital || !doctor) {
        this.showToast(
            'Validation Error',
            'Please fill in all required recipient details.',
            'warning'
        );
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/recipients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                age: age,
                gender: gender,
                blood_group_needed: bloodGroup,
                hospital_id: Number(hospital),
                attending_doctor_id: Number(doctor),
                date_registered: new Date().toISOString().split('T')[0]
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to register recipient');
        }

        await this.renderRecipientsTable();
        await this.updateStatsCounters();


        const modalEl = document.getElementById('recipientModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        this.showToast(
            'Recipient Registered',
            `${name} has been saved to the database.`,
            'success'
        );

    } catch (error) {
        console.error('Error registering recipient:', error);

        this.showToast(
            'Registration Failed',
            error.message || 'Could not save recipient to database.',
            'danger'
        );
    }
},


    confirmDeleteRecipient(id) {
    this.showConfirmModal(
        'Delete Recipient Record',
        `Are you sure you want to delete recipient ${id}?`,
        async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/api/recipients/${id}`,
                    {
                        method: 'DELETE'
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || 'Failed to delete recipient'
                    );
                }

                await this.renderRecipientsTable();

                this.showToast(
                    'Deleted',
                    'Recipient record removed from database',
                    'danger'
                );

            } catch (error) {
                console.error('Error deleting recipient:', error);

                this.showToast(
                    'Error',
                    error.message || 'Could not delete recipient',
                    'danger'
                );
            }
        }
    );
},

    // 4. Render Blood Requests Table
    async renderRequestsTable(filterCategory) {
        const tbody = document.getElementById('requestsTableBody');
        if (!tbody) return;

        try {
            const response = await fetch(
                'http://localhost:5000/api/requests'
            );

            if (!response.ok) {
                throw new Error('Failed to load blood requests');
            }

            const requests = await response.json();

            // Update local data so other existing features can use it.
            BloodBankData.requests = requests.map(r => ({
                id: String(r.request_id),
                recipient: r.recipient_name,
                hospital: r.hospital_name,
                bloodGroup: r.blood_group_code,
                units: Number(r.units_needed),
                priority: r.priority,
                date: r.request_date,
                status: r.status
            }));

            let filtered = BloodBankData.requests;

            if (filterCategory && filterCategory !== 'All') {
                if (['Pending', 'Approved', 'Rejected'].includes(filterCategory)) {
                    filtered = filtered.filter(
                        r => r.status === filterCategory
                    );
                } else if (
                    filterCategory === 'Emergency' ||
                    filterCategory === 'High Priority'
                ) {
                    const priorityKey =
                        filterCategory === 'Emergency' ? 'Emergency' : 'High';

                    filtered = filtered.filter(
                        r => r.priority === priorityKey
                    );
                }
            }

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center py-4 text-muted">
                            No blood requests match filter.
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';

            filtered.forEach(r => {
                let priorityBadge =
                    `<span class="badge-soft badge-soft-info">${r.priority}</span>`;

                if (r.priority === 'Emergency') {
                    priorityBadge =
                        `<span class="badge-soft badge-soft-danger pulse-danger">
                            <i class="fa-solid fa-bolt"></i> Emergency
                        </span>`;
                } else if (r.priority === 'High') {
                    priorityBadge =
                        `<span class="badge-soft badge-soft-warning">High</span>`;
                }

                let statusBadge =
                    `<span class="badge-soft badge-soft-warning">Pending</span>`;

                if (r.status === 'Approved') {
                    statusBadge =
                        `<span class="badge-soft badge-soft-success">
                            <i class="fa-solid fa-check"></i> Approved
                        </span>`;
                } else if (r.status === 'Rejected') {
                    statusBadge =
                        `<span class="badge-soft badge-soft-danger">
                            <i class="fa-solid fa-xmark"></i> Rejected
                        </span>`;
                }

                let actionBtns = '';

                if (r.status === 'Pending') {
                    actionBtns = `
                        <button
                            class="btn btn-sm btn-success text-white"
                            onclick="App.approveRequest('${r.id}')"
                            title="Approve request">
                            <i class="fa-solid fa-check"></i> Approve
                        </button>
                        <button
                            class="btn btn-sm btn-outline-danger"
                            onclick="App.rejectRequest('${r.id}')"
                            title="Reject request">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    `;
                } else {
                    actionBtns =
                        `<span class="text-muted fs-7">Processed</span>`;
                }

                html += `
                    <tr>
                        <td><strong>${r.id}</strong></td>
                        <td class="fw-bold">${r.recipient ?? ''}</td>
                        <td>${r.hospital ?? ''}</td>
                        <td>
                            <span class="badge-blood-group">${r.bloodGroup}</span>
                        </td>
                        <td>
                            <strong class="text-danger">${r.units} Units</strong>
                        </td>
                        <td>${priorityBadge}</td>
                        <td class="fs-7 text-muted">${r.date ?? ''}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="d-flex gap-1 align-items-center">
                                ${actionBtns}
                            </div>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

        } catch (error) {
            console.error('Blood requests error:', error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-danger">
                        Could not load blood requests. Check the backend server.
                    </td>
                </tr>
            `;
        }
    },

    // Approve a blood request in PostgreSQL
    async approveRequest(reqId) {
        try {
            const response = await fetch(
                `http://localhost:5000/api/requests/${encodeURIComponent(reqId)}/status`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'Approved'
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to approve request'
                );
            }

            await this.renderRequestsTable('All');
            await this.updateStatsCounters();

            if (typeof this.renderLatestDashboardRequests === 'function') {
                await this.renderLatestDashboardRequests();
            }

            this.showToast(
                'Request Approved',
                `Blood request ${reqId} was approved and saved to the database.`,
                'success'
            );

        } catch (error) {
            console.error('Approve request error:', error);

            this.showToast(
                'Approval Failed',
                error.message || 'Could not approve the request.',
                'danger'
            );
        }
    },

    // Reject a blood request in PostgreSQL
    async rejectRequest(reqId) {
        try {
            const response = await fetch(
                `http://localhost:5000/api/requests/${encodeURIComponent(reqId)}/status`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'Rejected'
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to reject request'
                );
            }

            await this.renderRequestsTable('All');
            await this.updateStatsCounters();

            if (typeof this.renderLatestDashboardRequests === 'function') {
                await this.renderLatestDashboardRequests();
            }

            this.showToast(
                'Request Rejected',
                `Blood request ${reqId} was rejected and saved to the database.`,
                'warning'
            );

        } catch (error) {
            console.error('Reject request error:', error);

            this.showToast(
                'Rejection Failed',
                error.message || 'Could not reject the request.',
                'danger'
            );
        }
    },

    // 5. Render Donation History View
    async renderDonationsTable() {
    const tbody = document.getElementById('donationsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center">Loading donation history...</td>
        </tr>
    `;

    try {
        const response = await fetch('http://localhost:5000/api/donations');

        if (!response.ok) {
            throw new Error('Failed to fetch donation history');
        }

        const donations = await response.json();

        if (donations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        No donation records found.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';

        donations.forEach(d => {
            const donationDate = d.donation_date
                ? new Date(d.donation_date).toLocaleDateString('en-GB')
                : '—';

            const status = d.status || 'Unknown';

            html += `
                <tr>
                    <td><strong>${d.donation_id}</strong></td>
                    <td class="fw-bold">${d.donor_name}</td>
                    <td>
                        <span class="badge-blood-group">
                            ${d.blood_group_code}
                        </span>
                    </td>
                    <td>${d.units_donated} Unit</td>
                    <td>${donationDate}</td>
                    <td>${d.camp_name}</td>
                    <td>—</td>
                    <td>
                        <span class="badge-soft badge-soft-success">
                            <i class="fa-solid fa-circle-check"></i>
                            ${status}
                        </span>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

    } catch (error) {
        console.error('Donation history error:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    Unable to load donation history. Check whether the backend is running.
                </td>
            </tr>
        `;
    }
},

    // 6. Render Hospital Cards Grid
    async renderHospitalsGrid() {
    const container = document.getElementById('hospitalsContainer');
    if (!container) return;

    try {
        const response = await fetch('http://localhost:5000/api/hospitals');

        if (!response.ok) {
            throw new Error('Failed to fetch hospitals');
        }

        const hospitals = await response.json();

        let html = '';

        hospitals.forEach(h => {
            const hospitalId = h.hospital_id;
            const name = h.name || 'N/A';
            const address = h.address || 'N/A';
            const phone = h.phone || 'N/A';
            const status = h.status || 'Active';
            const availableBeds = h.available_beds ?? 0;
            const totalBeds = h.total_beds ?? 0;
            const emergencySupport = h.emergency_support
                ? 'Available'
                : 'Not Available';

            html += `
                <div class="col-xl-4 col-md-6 mb-4">
                    <div class="card-custom h-100 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <span class="badge-soft badge-soft-primary">
                                    <i class="fa-solid fa-hospital me-1"></i>
                                    ${status}
                                </span>
                                <span class="fs-7 text-muted">
                                    Beds: ${availableBeds}/${totalBeds}
                                </span>
                            </div>

                            <h5 class="fw-bold mb-2">${name}</h5>

                            <p class="fs-7 text-muted mb-3">
                                <i class="fa-solid fa-location-dot me-1 text-danger"></i>
                                ${address}
                            </p>

                            <div class="p-3 bg-light rounded-3 mb-3 fs-7">
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Phone:</span>
                                    <strong>${phone}</strong>
                                </div>

                                <div class="d-flex justify-content-between">
                                    <span>Emergency Support:</span>
                                    <strong class="text-danger">${emergencySupport}</strong>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex gap-2">
                            <button
                                class="btn btn-sm btn-outline-danger flex-fill"
                                onclick="App.showToast('Hospital Contact', 'Phone: ${phone}', 'info')">
                                <i class="fa-solid fa-phone me-1"></i> Call
                            </button>

                            <button
                                class="btn btn-sm btn-light"
                                onclick="App.confirmDeleteHospital('${hospitalId}')"
                                title="Delete">
                                <i class="fa-solid fa-trash text-danger"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || `
            <div class="col-12 text-center text-muted">
                No hospitals found in the database.
            </div>
        `;
    } catch (error) {
        console.error('Error loading hospitals:', error);

        container.innerHTML = `
            <div class="col-12 text-center text-danger">
                Failed to load hospitals. Please check whether the backend is running.
            </div>
        `;
    }
},

    openAddHospitalModal() {
        const modal = new bootstrap.Modal(document.getElementById('hospitalModal'));
        modal.show();
    },

    async saveHospitalForm() {
    const name = document.getElementById('hspNameInput').value.trim();
    const address = document.getElementById('hspAddressInput').value.trim();
    const phone = document.getElementById('hspPhoneInput').value.trim();
    const bedsInput = document.getElementById('hspBedsInput').value.trim();
    const beds = bedsInput === '' ? 100 : Number(bedsInput);

    if (!name || !phone) {
        this.showToast(
            'Validation Error',
            'Hospital name and phone are required.',
            'warning'
        );
        return;
    }

    if (!Number.isInteger(beds) || beds < 0) {
        this.showToast(
            'Validation Error',
            'Enter a valid number of beds.',
            'warning'
        );
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/hospitals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                address,
                phone,
                total_beds: beds
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to add hospital.');
        }

        const modalEl = document.getElementById('hospitalModal');
        const modal = bootstrap.Modal.getInstance(modalEl);

        if (modal) {
            modal.hide();
        }

        document.getElementById('hspNameInput').value = '';
        document.getElementById('hspAddressInput').value = '';
        document.getElementById('hspPhoneInput').value = '';
        document.getElementById('hspBedsInput').value = '';

        await this.renderHospitalsGrid();
        await this.updateStatsCounters();

        this.showToast(
            'Hospital Added',
            `${name} was saved to the database.`,
            'success'
        );
    } catch (error) {
        console.error('Add hospital error:', error);

        this.showToast(
            'Add Failed',
            error.message,
            'danger'
        );
    }
},
confirmDeleteHospital(id) {
    this.showConfirmModal(
        'Delete Hospital',
        `Are you sure you want to remove hospital ${id}?`,
        async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/api/hospitals/${id}`,
                    {
                        method: 'DELETE'
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || 'Failed to delete hospital.'
                    );
                }

                await this.renderHospitalsGrid();
                await this.updateStatsCounters();

                this.showToast(
                    'Hospital Removed',
                    'Hospital deleted from the database.',
                    'success'
                );
            } catch (error) {
                console.error('Delete hospital error:', error);

                this.showToast(
                    'Delete Failed',
                    error.message,
                    'danger'
                );
            }
        }
    );
},

    // 7. Render Recent Activities List on Dashboard
    renderRecentActivities() {
        const container = document.getElementById('recentActivitiesContainer');
        if (!container) return;

        let html = '';
        BloodBankData.activities.forEach(act => {
            html += `
                <div class="timeline-item">
                    <div class="timeline-dot ${act.color}">
                        <i class="${act.icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">${act.title}</div>
                        <div class="text-muted fs-7 mb-1">${act.desc}</div>
                        <div class="timeline-time">${act.time}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

   
    // 8. Render Latest Dashboard Requests Table
    async renderLatestDashboardRequests() {
        const tbody = document.getElementById('dashboardRequestsTableBody');
        if (!tbody) return;

        try {
            const response = await fetch(
                'http://localhost:5000/api/latest-blood-requests'
            );

            if (!response.ok) {
                throw new Error('Failed to load latest blood requests');
            }

            const requests = await response.json();

            if (requests.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">No blood requests found.</td>
                    </tr>
                `;
                return;
            }

            let html = '';

            requests.forEach(r => {
                let badge = '';

                if (r.status === 'Pending') {
                    badge = `<span class="badge-soft badge-soft-warning">Pending</span>`;
                } else if (r.status === 'Approved') {
                    badge = `<span class="badge-soft badge-soft-success">Approved</span>`;
                } else if (r.status === 'Rejected') {
                    badge = `<span class="badge-soft badge-soft-danger">Rejected</span>`;
                } else {
                    badge = `<span class="badge-soft">${r.status}</span>`;
                }

                html += `
                    <tr>
                        <td><strong>${r.request_id}</strong></td>
                        <td>${r.recipient_name}</td>
                        <td>
                            <span class="badge-blood-group">
                                ${r.blood_group_code}
                            </span>
                        </td>
                        <td>${r.units_needed} Units</td>
                        <td>${r.hospital_name}</td>
                        <td>${badge}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;

        } catch (error) {
            console.error('Latest blood requests error:', error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Could not load blood requests. Please check the backend.
                    </td>
                </tr>
            `;
        }
    },

    // Reports Export Simulation Triggers
    async triggerExport(format) {
    try {
        const response = await fetch(
            'http://localhost:5000/api/dashboard-stats'
        );

        if (!response.ok) {
            throw new Error('Could not fetch report data.');
        }

        const stats = await response.json();

        const rows = [
            ['Total Donors', stats.totalDonors],
            ['Total Recipients', stats.totalRecipients],
            ['Available Blood Units', stats.totalUnits],
            ['Total Hospitals', stats.totalHospitals],
            ['Pending Requests', stats.pendingRequests],
            ['Approved Requests', stats.approvedRequests]
        ];

        const date = new Date().toLocaleString();

        if (format.toLowerCase() === 'csv') {
            const data = [
                ['Blood Bank Management System - Summary Report'],
                ['Generated At', date],
                [],
                ['Metric', 'Value'],
                ...rows
            ];

            const csv = data.map(row =>
                row.map(value =>
                    `"${String(value ?? '').replace(/"/g, '""')}"`
                ).join(',')
            ).join('\r\n');

            const blob = new Blob(
                ['\uFEFF' + csv],
                { type: 'text/csv;charset=utf-8;' }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = 'blood-bank-report.csv';
            link.click();

            URL.revokeObjectURL(url);
        } else if (format.toLowerCase() === 'pdf') {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error(
                    'PDF library not loaded. Check your internet connection and index.html.'
                );
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();

            pdf.setFontSize(18);
            pdf.text('Blood Bank Management System', 15, 20);

            pdf.setFontSize(14);
            pdf.text('Summary Report', 15, 32);

            pdf.setFontSize(10);
            pdf.text(`Generated: ${date}`, 15, 42);

            let y = 58;

            rows.forEach(([label, value]) => {
                pdf.text(String(label), 15, y);
                pdf.text(String(value), 150, y);
                y += 10;
            });

            pdf.save('blood-bank-report.pdf');
        } else {
            throw new Error('Unsupported export format.');
        }

        this.showToast(
            'Export Complete',
            `${format.toUpperCase()} report downloaded successfully.`,
            'success'
        );
    } catch (error) {
        console.error('Export error:', error);

        this.showToast(
            'Export Failed',
            error.message || 'Could not generate the report.',
            'danger'
        );
    }
},

    // Confirm Modal Utility
    showConfirmModal(title, text, onConfirm) {
        document.getElementById('confirmModalTitle').textContent = title;
        document.getElementById('confirmModalText').textContent = text;
        this.deleteCallback = onConfirm;
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();
    },

    // Toast Notification System
    showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        let borderClass = 'border-info';
        let iconClass = 'fa-solid fa-circle-info text-info';

        if (type === 'success') {
            borderClass = 'border-success';
            iconClass = 'fa-solid fa-circle-check text-success';
        } else if (type === 'danger') {
            borderClass = 'border-danger';
            iconClass = 'fa-solid fa-circle-exclamation text-danger';
        } else if (type === 'warning') {
            borderClass = 'border-warning';
            iconClass = 'fa-solid fa-triangle-exclamation text-warning';
        }

        const toastEl = document.createElement('div');
        toastEl.className = `toast-custom ${borderClass}`;
        toastEl.id = toastId;
        toastEl.innerHTML = `
            <i class="${iconClass} fs-4"></i>
            <div class="flex-fill">
                <div class="fw-bold fs-7">${title}</div>
                <div class="fs-7 text-muted">${message}</div>
            </div>
            <button type="button" class="btn-close ms-2" onclick="document.getElementById('${toastId}').remove()"></button>
        `;

        toastContainer.appendChild(toastEl);

        setTimeout(() => {
            if (document.getElementById(toastId)) {
                document.getElementById(toastId).remove();
            }
        }, 4000);
    },
    loadSavedSettings() {
    const defaultProfile = {
        name: 'Dr. Alexander Wright',
        email: 'alexander.wright@lifepulse.org',
        phone: '+1 (555) 234-8901'
    };

    let profile = defaultProfile;

    try {
        profile = {
            ...defaultProfile,
            ...JSON.parse(localStorage.getItem('bloodBankProfile') || '{}')
        };
    } catch (error) {
        console.error('Could not load profile:', error);
    }

    document.getElementById('profile-name').value = profile.name;
    document.getElementById('profile-email').value = profile.email;
    document.getElementById('profile-phone').value = profile.phone;
    document.getElementById('profile-display-name').textContent = profile.name;

    const darkMode = localStorage.getItem('bloodBankDarkMode') === 'true';
    this.isDarkMode = darkMode;
    document.body.classList.toggle('dark-mode', darkMode);

    document.querySelectorAll('.btn-dark-mode-toggle').forEach(input => {
        input.checked = darkMode;
    });

    const alertsEnabled =
        localStorage.getItem('bloodBankLowStockAlerts') !== 'false';

    document.getElementById('low-stock-alert-setting').checked = alertsEnabled;

    const savedPhoto = localStorage.getItem('bloodBankProfilePhoto');
    if (savedPhoto) {
        document.getElementById('profile-avatar').src = savedPhoto;
    }

    document.querySelectorAll('.btn-dark-mode-toggle i').forEach(icon => {
        icon.className = darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
},

saveProfile(event) {
    event.preventDefault();

    const profile = {
        name: document.getElementById('profile-name').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        phone: document.getElementById('profile-phone').value.trim()
    };

    if (!profile.name || !profile.email || !profile.phone) {
        this.showToast(
            'Error',
            'Please fill in all profile fields.',
            'error'
        );
        return;
    }

    try {
        localStorage.setItem('bloodBankProfile', JSON.stringify(profile));

        // Update the profile page name
        const profileDisplayName = document.getElementById('profile-display-name');
        if (profileDisplayName) {
            profileDisplayName.textContent = profile.name;
        }

        // Update the sidebar name
        const topbarName = document.getElementById('topbar-profile-name');
        if (topbarName) {
            topbarName.textContent = profile.name;
        }

        // Update the top-right header name
        const shortName = document.getElementById('topbar-short-name');
        if (shortName) {
            shortName.textContent = profile.name;
        }

        this.showToast(
            'Saved',
            'Profile updated successfully!',
            'success'
        );

    } catch (error) {
        console.error('Error saving profile:', error);

        this.showToast(
            'Error',
            'Could not save the profile.',
            'error'
        );
    }
},

savePreferences() {
    const darkMode = document.getElementById('dark-mode-setting').checked;
    const alertsEnabled = document.getElementById('low-stock-alert-setting').checked;

    try {
        localStorage.setItem('bloodBankDarkMode', String(darkMode));
        localStorage.setItem('bloodBankLowStockAlerts', String(alertsEnabled));

        this.showToast('Saved', 'System preferences saved successfully!', 'success');
    } catch (error) {
        this.showToast('Error', 'Could not save preferences.', 'error');
    }
},

handleProfilePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        this.showToast('Error', 'Please select an image file.', 'error');
        return;
    }

    if (file.size > 1024 * 1024) {
        this.showToast('Error', 'Please choose an image smaller than 1 MB.', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        try {
            localStorage.setItem('bloodBankProfilePhoto', reader.result);
            document.getElementById('profile-avatar').src = reader.result;
            this.showToast('Updated', 'Profile photo updated!', 'success');
        } catch (error) {
            this.showToast('Error', 'Could not save the photo.', 'error');
        }
    };

    reader.readAsDataURL(file);
},
loadSavedSettings() {
    const defaultProfile = {
        name: 'Dr. Alexander Wright',
        email: 'alexander.wright@lifepulse.org',
        phone: '+1 (555) 234-8901'
    };

    let profile = defaultProfile;

    try {
        const savedProfile = localStorage.getItem('bloodBankProfile');

        if (savedProfile) {
            profile = {
                ...defaultProfile,
                ...JSON.parse(savedProfile)
            };
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const displayName = document.getElementById('profile-display-name');

    if (nameInput) nameInput.value = profile.name;
    if (emailInput) emailInput.value = profile.email;
    if (phoneInput) phoneInput.value = profile.phone;
    if (displayName) displayName.textContent = profile.name;
    const topbarName = document.getElementById('topbar-profile-name');
if (topbarName) {
    topbarName.textContent = profile.name;
}

const shortName = document.getElementById('topbar-short-name');
if (shortName) {
    shortName.textContent = profile.name;
}

    const darkMode = localStorage.getItem('bloodBankDarkMode') === 'true';

    this.isDarkMode = darkMode;
    document.body.classList.toggle('dark-mode', darkMode);

    document.querySelectorAll('.btn-dark-mode-toggle').forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = darkMode;
        }

        const icon = input.querySelector('i');
        if (icon) {
            icon.className = darkMode
                ? 'fa-solid fa-sun'
                : 'fa-solid fa-moon';
        }
    });

    const alertSetting = document.getElementById('low-stock-alert-setting');

    if (alertSetting) {
        alertSetting.checked =
            localStorage.getItem('bloodBankLowStockAlerts') !== 'false';
    }

    const savedPhoto = localStorage.getItem('bloodBankProfilePhoto');
    const avatar = document.getElementById('profile-avatar');

    if (savedPhoto && avatar) {
        avatar.src = savedPhoto;
    }
},

saveProfile(event) {
    event.preventDefault();

    const profile = {
        name: document.getElementById('profile-name').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        phone: document.getElementById('profile-phone').value.trim()
    };

    if (!profile.name || !profile.email || !profile.phone) {
        this.showToast('Error', 'Please fill in all profile fields.', 'error');
        return;
    }

    try {
        localStorage.setItem('bloodBankProfile', JSON.stringify(profile));

        document.getElementById('profile-display-name').textContent =
            profile.name;

        this.showToast(
            'Saved',
            'Profile updated successfully!',
            'success'
        );
    } catch (error) {
        console.error('Error saving profile:', error);
        this.showToast('Error', 'Could not save profile details.', 'error');
    }
},

savePreferences() {
    const darkMode = document.getElementById('dark-mode-setting');
    const alertSetting = document.getElementById('low-stock-alert-setting');

    try {
        if (darkMode) {
            localStorage.setItem(
                'bloodBankDarkMode',
                String(darkMode.checked)
            );

            this.isDarkMode = darkMode.checked;
            document.body.classList.toggle(
                'dark-mode',
                this.isDarkMode
            );
        }

        if (alertSetting) {
            localStorage.setItem(
                'bloodBankLowStockAlerts',
                String(alertSetting.checked)
            );
        }

        this.showToast(
            'Saved',
            'System preferences saved successfully!',
            'success'
        );
    } catch (error) {
        console.error('Error saving preferences:', error);
        this.showToast(
            'Error',
            'Could not save system preferences.',
            'error'
        );
    }
},

handleProfilePhoto(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
        this.showToast('Error', 'Please select an image file.', 'error');
        event.target.value = '';
        return;
    }

    if (file.size > 1024 * 1024) {
        this.showToast(
            'Error',
            'Please select an image smaller than 1 MB.',
            'error'
        );
        event.target.value = '';
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        try {
            localStorage.setItem('bloodBankProfilePhoto', reader.result);

            document.getElementById('profile-avatar').src = reader.result;

            this.showToast(
                'Updated',
                'Profile photo updated successfully!',
                'success'
            );
        } catch (error) {
            console.error('Error saving profile photo:', error);
            this.showToast(
                'Error',
                'Could not save the photo. Try a smaller image.',
                'error'
            );
        }
    };

    reader.readAsDataURL(file);
},
async loadRequestFormOptions() {
    try {
        const [recipientResponse, hospitalResponse] = await Promise.all([
            fetch('http://localhost:5000/api/recipients'),
            fetch('http://localhost:5000/api/hospitals')
        ]);

        if (!recipientResponse.ok || !hospitalResponse.ok) {
            throw new Error('Failed to load recipients or hospitals.');
        }

        const recipients = await recipientResponse.json();
        const hospitals = await hospitalResponse.json();

        const recipientSelect = document.getElementById('requestRecipient');
        const hospitalSelect = document.getElementById('requestHospital');

        if (recipientSelect) {
            recipientSelect.innerHTML = '<option value="">Select recipient</option>';

            recipients.forEach(recipient => {
                const option = document.createElement('option');
                option.value = recipient.recipient_id;
                option.textContent =
                    `${recipient.name} (ID: ${recipient.recipient_id})`;
                recipientSelect.appendChild(option);
            });
        }

        if (hospitalSelect) {
            hospitalSelect.innerHTML = '<option value="">Select hospital</option>';

            hospitals.forEach(hospital => {
                const option = document.createElement('option');
                option.value = hospital.hospital_id;
                option.textContent =
                    `${hospital.name} (ID: ${hospital.hospital_id})`;
                hospitalSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading request form options:', error);
        this.showToast(
            'Error',
            'Could not load recipients and hospitals. Check that the backend is running.',
            'error'
        );
    }
},

async createBloodRequest(event) {
    event.preventDefault();

    const recipientId = document.getElementById('requestRecipient').value;
    const hospitalId = document.getElementById('requestHospital').value;
    const bloodGroup = document.getElementById('requestBloodGroup').value;
    const units = Number(document.getElementById('requestUnits').value);
    const priority = document.getElementById('requestPriority').value;

    if (!recipientId || !hospitalId || !bloodGroup ||
        !Number.isInteger(units) || units < 1 || !priority) {
        this.showToast(
            'Error',
            'Please fill in all fields with valid values.',
            'error'
        );
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient_id: Number(recipientId),
                hospital_id: Number(hospitalId),
                blood_group_code: bloodGroup,
                units_needed: units,
                priority: priority
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create request.');
        }

        this.showToast(
            'Success',
            'Blood request created successfully!',
            'success'
        );

        document.getElementById('createRequestForm').reset();
        document.getElementById('createRequestCard').classList.add('d-none');

        // Reload requests from PostgreSQL
        await this.renderRequestsTable('All');

        // Refresh dashboard totals and latest requests
        this.updateStatsCounters();
        await this.renderRecipientsTable();

        if (typeof this.renderLatestDashboardRequests === 'function') {
            this.renderLatestDashboardRequests();
        }
    } catch (error) {
        console.error('Create blood request error:', error);
        this.showToast('Error', error.message, 'error');
    }
},
async loadAddStockHospitals() {
    try {
        const response = await fetch('http://localhost:5000/api/hospitals');

        if (!response.ok) {
            throw new Error('Failed to load hospitals.');
        }

        const hospitals = await response.json();
        const select = document.getElementById('stockHospital');

        select.innerHTML = '<option value="">Select hospital</option>';

        hospitals.forEach(hospital => {
            const option = document.createElement('option');
            option.value = hospital.hospital_id;
            option.textContent = `${hospital.name} (ID: ${hospital.hospital_id})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading hospitals:', error);
        this.showToast(
            'Error',
            'Could not load hospitals. Check that the backend is running.',
            'error'
        );
    }
},

async createBloodStock(event) {
    event.preventDefault();

    const hospitalId = document.getElementById('stockHospital').value;
    const bloodGroup = document.getElementById('stockBloodGroup').value;
    const units = Number(document.getElementById('stockUnits').value);
    const capacity = Number(document.getElementById('stockCapacity').value);

    if (
        !hospitalId ||
        !bloodGroup ||
        !Number.isInteger(units) ||
        units < 0 ||
        !Number.isInteger(capacity) ||
        capacity <= 0
    ) {
        this.showToast('Error', 'Please enter valid stock details.', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/blood-stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hospital_id: Number(hospitalId),
                blood_group_code: bloodGroup,
                units_available: units,
                target_capacity: capacity
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to add blood stock.');
        }

        this.showToast('Success', 'New blood stock added successfully!', 'success');

        document.getElementById('addStockForm').reset();
        document.getElementById('addStockCard').classList.add('d-none');

        await this.renderStockCards();
        this.updateStatsCounters();
    } catch (error) {
        console.error('Error adding blood stock:', error);
        this.showToast('Error', error.message, 'error');
    }
},

};
