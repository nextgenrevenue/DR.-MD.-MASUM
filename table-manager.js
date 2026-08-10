// table-manager.js - Clean & Optimized Table Management Component
console.log("📊 TableManager loading...");

class TableManager {
    constructor(config) {
        this.config = config || {};
        this.db = config.db;
        this.tableId = config.tableId || 'appointmentsTable';
        this.tbodyId = config.tbodyId || 'appointmentsBody';
        this.loadingMessageId = config.loadingMessageId || 'loadingMessage';
        
        this.onStatusUpdate = config.onStatusUpdate;
        this.onTokenAction = config.onTokenAction;
        this.onFilterChange = config.onFilterChange;
        this.onDataLoaded = config.onDataLoaded;
        this.onEdit = config.onEdit;
        this.onDelete = config.onDelete;

        this.appointments = [];
        this.filteredAppointments = [];
        this.currentFilters = {
            date: '',
            service: 'all',
            type: 'all',
            callStatus: 'all',
            tokenStatus: 'all',
            search: ''
        };

        this.serviceNames = {
            'general': 'সাধারণ',
            'microneedling': 'মাইক্রোনিডলিং',
            'prp': 'পি আর পি',
            'electrocautery': 'ইলেক্ট্রোক্যাটারি',
            'cryosurgery': 'ক্রায়োসার্জারি'
        };

        if (typeof window !== 'undefined') {
            window.tableManager = this;
        }

        this.injectStyles();
    }

    injectStyles() {
        if (typeof document === 'undefined' || document.getElementById('table-manager-styles')) return;
        const style = document.createElement('style');
        style.id = 'table-manager-styles';
        style.textContent = `
            .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
            .status-called { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
            .status-not-called { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
            .status-token-given { background-color: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
            .status-token-not-given { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
            .service-badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap; color: #ffffff; }
            .service-general { background-color: #3b82f6; }
            .service-microneedling { background-color: #8b5cf6; }
            .service-prp { background-color: #10b981; }
            .service-cryosurgery { background-color: #0ea5e9; }
            .service-electrocautery { background-color: #f59e0b; }
            .action-btn { padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
            .btn-call { background-color: #2563eb; color: white; }
            .btn-call:hover { background-color: #1d4ed8; }
            .btn-call-undo { background-color: #dc2626; color: white; }
            .btn-call-undo:hover { background-color: #b91c1c; }
            .btn-token { background-color: #f59e0b; color: white; }
            .btn-token:hover { background-color: #d97706; }
            .btn-token-details { background-color: #10b981; color: white; }
            .btn-token-details:hover { background-color: #059669; }
            .btn-edit { background-color: #3b82f6; color: white; }
            .btn-edit:hover { background-color: #2563eb; }
            .btn-delete { background-color: #dc2626; color: white; }
            .btn-delete:hover { background-color: #b91c1c; }
        `;
        document.head.appendChild(style);
    }

    getYYMMDD(dateString) {
        if (!dateString) return '';
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const parts = dateString.split('T')[0].split('-');
            if (parts.length === 3) {
                return `${parts[0].slice(-2)}${parts[1].padStart(2, '0')}${parts[2].padStart(2, '0')}`;
            }
        }
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '';
        return `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '-';
        try {
            let date;
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                date = timestamp.toDate();
            } else if (timestamp.seconds) {
                date = new Date(timestamp.seconds * 1000);
            } else {
                date = new Date(timestamp);
            }
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleString('bn-BD', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return '-';
        }
    }

    getAgeDisplay(data) {
        if (data.ageDisplay) return data.ageDisplay;
        if (data.ageString) return data.ageString;
        const years = parseInt(data.ageYears) || 0;
        const months = parseInt(data.ageMonths) || 0;
        const days = parseInt(data.ageDays) || 0;
        let parts = [];
        if (years > 0) parts.push(`${years} বছর`);
        if (months > 0) parts.push(`${months} মাস`);
        if (days > 0) parts.push(`${days} দিন`);
        if (parts.length > 0) return parts.join(' ');
        if (data.age && typeof data.age === 'number') return `${data.age} বছর`;
        return '-';
    }

    findAppointment(docId, patientType) {
        const pType = (patientType || '').toLowerCase();
        
        // Search in filtered or main list using both docId and patientType
        let found = (this.filteredAppointments || []).find(a => {
            const aType = (a.data?.patientType || a.data?.type || 'new').toLowerCase();
            return a.id === docId && (!pType || aType === pType);
        });

        if (!found) {
            found = (this.appointments || []).find(a => {
                const aType = (a.data?.patientType || a.data?.type || 'new').toLowerCase();
                return a.id === docId && (!pType || aType === pType);
            });
        }

        return found;
    }

    setAppointments(data) {
        this.appointments = data || [];
        this.applyFilters();
        if (this.onDataLoaded) this.onDataLoaded(this.appointments);
    }

    setFilters(newFilters) {
        this.currentFilters = { ...this.currentFilters, ...newFilters };
        this.applyFilters();
    }

    search(term) {
        this.currentFilters.search = (term || '').trim().toLowerCase();
        this.applyFilters();
    }

    applyFilters() {
        let result = [...this.appointments];
        const f = this.currentFilters;

        if (f.date) {
            result = result.filter(item => {
                const d = item.data.date || item.data.appointmentDate || '';
                return d === f.date;
            });
        }

        if (f.service && f.service !== 'all') {
            result = result.filter(item => {
                const s = item.data.serviceType || item.data.service || 'general';
                return s === f.service;
            });
        }

        if (f.type && f.type !== 'all') {
            result = result.filter(item => {
                const t = (item.data.patientType || item.data.type || 'new').toLowerCase();
                return t === f.type;
            });
        }

        if (f.callStatus && f.callStatus !== 'all') {
            result = result.filter(item => {
                const called = item.data.called === true;
                return f.callStatus === 'called' ? called : !called;
            });
        }

        if (f.tokenStatus && f.tokenStatus !== 'all') {
            result = result.filter(item => {
                const token = item.data.tokenGiven === true;
                return f.tokenStatus === 'given' ? token : !token;
            });
        }

        if (f.search) {
            const query = f.search;
            result = result.filter(item => {
                const name = (item.data.name || '').toLowerCase();
                const phone = (item.data.phone || '').toLowerCase();
                const serial = String(item.data.serial || '');
                return name.includes(query) || phone.includes(query) || serial.includes(query);
            });
        }

        result.sort((a, b) => parseInt(a.data.serial || 0) - parseInt(b.data.serial || 0));

        this.filteredAppointments = result;
        this.renderTable();
        if (this.onFilterChange) this.onFilterChange(f, result.length);
    }

    renderTable() {
        const tbody = document.getElementById(this.tbodyId);
        const loading = document.getElementById(this.loadingMessageId);
        if (!tbody) return;

        if (loading) loading.style.display = 'none';
        tbody.innerHTML = '';

        if (this.filteredAppointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; padding: 30px; color: #6b7280;">
                        কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredAppointments.forEach(item => {
            const data = item.data;
            const docId = item.id;
            const pType = (data.patientType || data.type || 'new').toLowerCase();
            const tr = document.createElement('tr');

            const serviceText = this.serviceNames[data.serviceType || data.service] || data.serviceType || 'সাধারণ';
            const typeText = pType === 'new' ? 'নতুন' : 'পুরাতন';
            const called = data.called === true;
            const tokenGiven = data.tokenGiven === true;

            const ageText = this.getAgeDisplay(data);
            const appointmentDateStr = data.date || data.appointmentDate || '-';
            const appointmentTimeStr = data.time || '-';
            const bookingTimeStr = this.formatTimestamp(data.timestamp);

            tr.innerHTML = `
                <td><strong>${data.serial || '-'}</strong></td>
                <td><span class="status-badge ${called ? 'status-called' : 'status-not-called'}">${called ? 'কল করা হয়েছে' : 'কল করা হয়নি'}</span></td>
                <td><span class="status-badge ${tokenGiven ? 'status-token-given' : 'status-token-not-given'}">${tokenGiven ? 'টোকেন দেওয়া হয়েছে' : 'টোকেন দেওয়া হয়নি'}</span></td>
                <td><strong>${data.name || '-'}</strong></td>
                <td>${ageText}</td>
                <td>${data.phone || '-'}</td>
                <td><span class="service-badge service-${data.serviceType || data.service || 'general'}">${serviceText}</span></td>
                <td>${appointmentDateStr}<br><small>${appointmentTimeStr}</small></td>
                <td>${typeText}</td>
                <td><small>${bookingTimeStr}</small></td>
                <td>
                    <button class="action-btn ${called ? 'btn-call-undo' : 'btn-call'}" onclick="window.tableManager.toggleStatus('${docId}', '${pType}', 'called', ${!called}, this)">
                        ${called ? 'আন-কল' : 'কল করুন'}
                    </button>
                </td>
                <td>
                    <button class="action-btn ${tokenGiven ? 'btn-token-details' : 'btn-token'}" onclick="window.tableManager.openTokenModal('${docId}', '${pType}', this)">
                        ${tokenGiven ? '<i class="fas fa-ticket-alt"></i> বিস্তারিত' : '<i class="fas fa-ticket-alt"></i> টোকেন দিন'}
                    </button>
                </td>
                <td>
                    <div style="display: flex; gap: 4px; flex-direction: column;">
                        <button class="action-btn btn-edit" onclick="window.tableManager.editEntry('${docId}', '${pType}')">এডিট</button>
                        <button class="action-btn btn-delete" onclick="window.tableManager.deleteEntry('${docId}', '${pType}')">ডিলিট</button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }

    openTokenModal(docId, patientType, button) {
        if (typeof patientType === 'object' && patientType !== null && !button) {
            button = patientType;
            patientType = null;
        }

        const item = this.findAppointment(docId, patientType);
        const data = item ? item.data : {};
        const pType = (patientType || data.patientType || data.type || 'new').toLowerCase();
        const dateVal = data.date || data.appointmentDate || (this.currentFilters && this.currentFilters.date);
        const yymmdd = this.getYYMMDD(dateVal);

        const docPath = item?.path || (yymmdd ? `appointments/${yymmdd}/${pType}/${docId}` : null);

        if (this.onTokenAction) {
            this.onTokenAction(docId, data, docPath, button);
        } else if (window.tokenModal && typeof window.tokenModal.openModal === 'function') {
            window.tokenModal.openModal(docId, data, docPath);
        } else if (typeof window.showTokenDetailsModal === 'function') {
            window.showTokenDetailsModal(docId, docPath);
        }
    }

    toggleStatus(docId, patientType, field, newStatus, button) {
        if (typeof field === 'boolean') {
            // Shifted parameters fallback
            button = newStatus;
            newStatus = field;
            field = patientType;
            patientType = null;
        }
        if (this.onStatusUpdate) this.onStatusUpdate(docId, patientType, field, newStatus, button);
    }

    editEntry(docId, patientType) {
        if (this.onEdit) this.onEdit(docId, patientType);
    }

    deleteEntry(docId, patientType) {
        if (this.onDelete) this.onDelete(docId, patientType);
    }

    exportToCSV() {
        if (this.filteredAppointments.length === 0) return alert('ডাউনলোড করার মত কোনো ডেটা নেই');
        let csv = 'Serial,Name,Phone,Service,Type,Date,Time,Called,Token\n';
        this.filteredAppointments.forEach(item => {
            const d = item.data;
            csv += `"${d.serial}","${d.name}","${d.phone}","${d.serviceType || d.service || 'general'}","${d.patientType || d.type || 'new'}","${d.date || d.appointmentDate || ''}","${d.time || ''}","${d.called ? 'Yes' : 'No'}","${d.tokenGiven ? 'Yes' : 'No'}"\n`;
        });
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `appointments-${this.currentFilters.date || 'all'}.csv`;
        link.click();
    }
}

if (typeof window !== 'undefined') {
    window.TableManager = TableManager;
}
