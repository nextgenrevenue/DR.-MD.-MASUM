// table-manager.js
// টেবিল ম্যানেজমেন্ট জাভাস্ক্রিপ্ট ফাইল

class TableManager {
    constructor(config) {
        // কনফিগারেশন
        this.db = config.db;
        this.tableId = config.tableId || 'appointmentsTable';
        this.tbodyId = config.tbodyId || 'appointmentsBody';
        this.loadingMessageId = config.loadingMessageId || 'loadingMessage';
        
        // DOM এলিমেন্টস
        this.table = document.getElementById(this.tableId);
        this.tbody = document.getElementById(this.tbodyId);
        this.loadingMessage = document.getElementById(this.loadingMessageId);
        
        // ডেটা স্টোরেজ
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
        
        // পেজিনেশন
        this.currentPage = 1;
        this.itemsPerPage = 50;
        this.totalPages = 1;
        
        // কলব্যাক ফাংশনস
        this.onStatusUpdate = config.onStatusUpdate || null;
        this.onFilterChange = config.onFilterChange || null;
        this.onEdit = config.onEdit || null;
        this.onDelete = config.onDelete || null;
        
        // ইভেন্ট লিসেনার সেটআপ
        this.setupEventListeners();
        
        // ইনিশিয়ালাইজেশন
        this.initialize();
    }
    
    // =======================================================
    // ১. ইনিশিয়ালাইজেশন মেথডস
    // =======================================================
    
    initialize() {
        console.log('Table Manager initialized');
        
        // টেবিল স্ট্রাকচার সেটআপ
        this.setupTableStructure();
        
        // লোডিং স্টেট শো
        this.showLoading();
    }
    
    setupTableStructure() {
        if (!this.table) return;
        
        // টেবিল হেডার সেটআপ (যদি না থাকে)
        if (!this.table.querySelector('thead')) {
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>সিরিয়াল</th>
                    <th>কল স্ট্যাটাস</th>
                    <th>টোকেন স্ট্যাটাস</th>
                    <th>রোগীর নাম</th>
                    <th>বয়স</th>
                    <th>ফোন</th>
                    <th>সার্ভিস</th>
                    <th>তারিখ/সময়</th>
                    <th>ধরন</th> 
                    <th>বুকিং তারিখ</th>
                    <th>কল অ্যাকশন</th>
                    <th>টোকেন অ্যাকশন</th>
                    <th>এডিট/ডিলিট</th>
                </tr>
            `;
            this.table.appendChild(thead);
        }
        
        // টেবিল বডি সেটআপ (যদি না থাকে)
        if (!this.tbody) {
            this.tbody = document.createElement('tbody');
            this.tbody.id = this.tbodyId;
            this.table.appendChild(this.tbody);
        }
    }
    
    // =======================================================
    // ২. ইউটিলিটি ফাংশনস
    // =======================================================
    
    toBengaliNumber(num) {
        if (num === null || num === undefined || num === '—') return '—';
        const numStr = String(num); 
        const bengaliMap = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return numStr.replace(/\d/g, digit => bengaliMap[digit]);
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp || !timestamp.toDate) return '—';
        const date = timestamp.toDate();
        return date.toLocaleString('bn-BD', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).replace(/\d/g, (digit) => this.toBengaliNumber(digit));
    }
    
    getAgeDisplay(data) {
        let ageDisplay = '';
        
        if (data.ageYears || data.ageMonths || data.ageDays) {
            const years = data.ageYears || 0;
            const months = data.ageMonths || 0;
            const days = data.ageDays || 0;
            
            if (years > 0) ageDisplay += `${this.toBengaliNumber(years)} বছর`;
            if (months > 0) {
                if (ageDisplay) ageDisplay += ', ';
                ageDisplay += `${this.toBengaliNumber(months)} মাস`;
            }
            if (days > 0) {
                if (ageDisplay) ageDisplay += ', ';
                ageDisplay += `${this.toBengaliNumber(days)} দিন`;
            }
        } else if (data.age) {
            if (typeof data.age === 'number' && data.age > 0) {
                ageDisplay = `${this.toBengaliNumber(data.age)} বছর`;
            } else if (typeof data.age === 'string') {
                ageDisplay = data.age;
            }
        }
        
        return ageDisplay || '—';
    }
    
    getServiceText(serviceType) {
        const serviceTextMap = {
            general: 'সাধারণ সিরিয়াল',
            microneedling: 'মাইক্রোনিডলিং',
            prp: 'পি আর পি',
            cryosurgery: 'ক্রায়োসার্জারি',
            electrocautery: 'ইলেক্ট্রোক্যাটারি'
        };
        return serviceTextMap[serviceType] || 'সাধারণ সিরিয়াল';
    }
    
    getServiceClass(serviceType) {
        return `service-${serviceType}`;
    }
    
    // =======================================================
    // ৩. টেবিল রেন্ডারিং মেথডস
    // =======================================================
    
    showLoading() {
        if (this.loadingMessage) {
            this.loadingMessage.style.display = 'block';
            this.loadingMessage.textContent = 'ডেটা লোড হচ্ছে...';
        }
        
        if (this.tbody) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; padding: 40px;">
                        <div class="loading-spinner"></div>
                        <p>ডেটা লোড হচ্ছে...</p>
                    </td>
                </tr>
            `;
        }
    }
    
    hideLoading() {
        if (this.loadingMessage) {
            this.loadingMessage.style.display = 'none';
        }
    }
    
    showError(message) {
        if (this.tbody) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; padding: 40px; color: #dc2626;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <p style="font-size: 16px; font-weight: 600;">${message}</p>
                        <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            পৃষ্ঠা রিফ্রেশ করুন
                        </button>
                    </td>
                </tr>
            `;
        }
        
        this.hideLoading();
    }
    
    renderTable(appointments) {
        if (!this.tbody) return;
        
        this.hideLoading();
        
        if (!appointments || appointments.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; padding: 40px; color: #6b7280; font-style: italic;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>কোনো অ্যাপয়েন্টমেন্ট খুঁজে পাওয়া যায়নি</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // টেবিল ক্লিয়ার
        this.tbody.innerHTML = '';
        
        // সিরিয়াল অনুসারে সাজানো
        const sortedAppointments = [...appointments].sort((a, b) => (a.data.serial || 0) - (b.data.serial || 0));
        
        // টেবিল রো রেন্ডার
        sortedAppointments.forEach(item => {
            this.renderTableRow(item);
        });
        
        // পেজিনেশন রেন্ডার
        this.renderPagination();
    }
    
    renderTableRow(item) {
        const { id, data } = item;
        const row = this.tbody.insertRow();
        
        // স্ট্যাটাস
        const isCalled = data.called === true;
        const callStatusClass = isCalled ? 'status-called' : 'status-not-called';
        const callStatusText = isCalled ? 'কল করা হয়েছে' : 'কল করা হয়নি';
        const callButtonClass = isCalled ? 'btn-call-undo' : 'btn-call';
        const callButtonText = isCalled ? 'কল বাতিল' : data.name || 'কল করুন';
        
        const isTokenGiven = data.tokenGiven === true;
        const tokenStatusClass = isTokenGiven ? 'status-token-given' : 'status-token-not-given';
        const tokenStatusText = isTokenGiven ? 'টোকেন দেওয়া' : 'টোকেন বাকি';
        const tokenButtonClass = isTokenGiven ? 'btn-token-undo' : 'btn-token';
        const tokenButtonText = isTokenGiven ? 'টোকেন বাতিল' : data.name || 'টোকেন দিন';
        
        // সার্ভিস টাইপ
        const serviceType = data.serviceType || 'general';
        const serviceText = this.getServiceText(serviceType);
        const serviceClass = this.getServiceClass(serviceType);
        
        // অন্যান্য ডেটা
        const ageDisplay = this.getAgeDisplay(data);
        const typeText = (data.patientType || data.type || 'new') === 'old' ? 'পুরাতন' : 'নতুন';
        const timeText = data.time || '—';
        
        // তারিখ ফরম্যাট
        let appointmentDate = '—';
        if (data.timestamp && data.timestamp.toDate) {
            const date = data.timestamp.toDate();
            appointmentDate = date.toLocaleDateString('bn-BD');
        }
        
        // রো HTML - নতুন এডিট/ডিলিট বাটন যোগ
        row.innerHTML = `
            <td>${this.toBengaliNumber(data.serial || '—')}</td>
            <td><span class="status-badge ${callStatusClass}">${callStatusText}</span></td>
            <td><span class="status-badge ${tokenStatusClass}">${tokenStatusText}</span></td>
            <td>${data.name || '—'}</td>
            <td>${ageDisplay}</td>
            <td style="text-align: center;">${data.phone ? this.toBengaliNumber(data.phone) : '—'}</td>
            <td><span class="service-badge ${serviceClass}">${serviceText}</span></td>
            <td>${appointmentDate}<br><small>${timeText}</small></td>
            <td>${typeText}</td>
            <td>${this.formatTimestamp(data.timestamp)}</td>
            <td><button class="action-btn ${callButtonClass}" data-id="${id}" data-field="called" data-status="${isCalled}">${callButtonText}</button></td>
            <td><button class="action-btn ${tokenButtonClass}" data-id="${id}" data-field="tokenGiven" data-status="${isTokenGiven}">${tokenButtonText}</button></td>
            <td style="text-align: center;">
                <div class="edit-delete-actions" style="display: flex; gap: 5px; justify-content: center;">
                    <button class="edit-btn" data-id="${id}" title="এডিট">
                        <i class="fas fa-edit" style="color: #2563eb;"></i>
                    </button>
                    <button class="delete-btn" data-id="${id}" title="ডিলিট">
                        <i class="fas fa-trash-alt" style="color: #dc2626;"></i>
                    </button>
                </div>
            </td>
        `;
        
        // ইভেন্ট লিসেনার যোগ
        this.addRowEventListeners(row);
    }
    
    renderPagination() {
        // যদি পেজিনেশন এলিমেন্ট না থাকে তবে তৈরি করুন
        let paginationContainer = document.querySelector('.table-pagination');
        
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'table-pagination';
            paginationContainer.style.cssText = `
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                gap: 10px;
                background-color: #f9fafb;
                border-top: 1px solid #e5e7eb;
            `;
            
            if (this.table.parentNode) {
                this.table.parentNode.appendChild(paginationContainer);
            }
        }
        
        // পেজিনেশন কন্ট্রোলস
        const totalItems = this.filteredAppointments.length;
        this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (this.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" data-page="prev">
                <i class="fas fa-chevron-left"></i> পূর্ববর্তী
            </button>
            
            <div class="page-numbers" style="display: flex; gap: 5px;">
        `;
        
        // পেজ নম্বরস
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${this.currentPage === i ? 'active' : ''}" data-page="${i}">
                    ${this.toBengaliNumber(i)}
                </button>
            `;
        }
        
        paginationHTML += `
            </div>
            
            <button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" data-page="next">
                পরবর্তী <i class="fas fa-chevron-right"></i>
            </button>
            
            <div class="pagination-info" style="margin-left: 15px; font-size: 14px; color: #6b7280;">
                পৃষ্ঠা ${this.toBengaliNumber(this.currentPage)} এর ${this.toBengaliNumber(this.totalPages)}
            </div>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
        
        // পেজিনেশন ইভেন্ট লিসেনার
        this.addPaginationEventListeners(paginationContainer);
    }
    
    // =======================================================
    // ৪. ফিল্টারিং মেথডস
    // =======================================================
    
    setFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.applyFilters();
        
        // কলব্যাক কল
        if (this.onFilterChange) {
            this.onFilterChange(this.currentFilters, this.filteredAppointments.length);
        }
    }
    
applyFilters() {
    if (this.appointments.length === 0) {
        this.filteredAppointments = [];
        this.renderTable([]);
        return;
    }
    
    this.filteredAppointments = this.appointments.filter(item => {
        const data = item.data;
        let isMatch = true;
        
        // ১. সঠিক লোকাল ফরম্যাটে তারিখ ফিল্টার (UTC ইস্যু সমাধানের জন্য)
        if (this.currentFilters.date) {
            let appointmentDate = '';
            if (data.timestamp && data.timestamp.toDate) {
                const d = data.timestamp.toDate();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                appointmentDate = `${year}-${month}-${day}`; // YYYY-MM-DD
            }
            
            if (appointmentDate !== this.currentFilters.date) {
                isMatch = false;
            }
        }
        
        // সার্ভিস ফিল্টার
        if (isMatch && this.currentFilters.service !== 'all') {
            const serviceType = data.serviceType || 'general';
            if (serviceType !== this.currentFilters.service) {
                isMatch = false;
            }
        }
        
        // রোগীর ধরন ফিল্টার
        if (isMatch && this.currentFilters.type !== 'all') {
            const type = data.patientType || data.type || 'new';
            if (type !== this.currentFilters.type) {
                isMatch = false;
            }
        }
        
        // কল স্ট্যাটাস ফিল্টার
        if (isMatch && this.currentFilters.callStatus !== 'all') {
            const isCalled = data.called === true;
            if ((this.currentFilters.callStatus === 'called' && !isCalled) ||
                (this.currentFilters.callStatus === 'not_called' && isCalled)) {
                isMatch = false;
            }
        }
        
        // টোকেন স্ট্যাটাস ফিল্টার
        if (isMatch && this.currentFilters.tokenStatus !== 'all') {
            const isTokenGiven = data.tokenGiven === true;
            if ((this.currentFilters.tokenStatus === 'given' && !isTokenGiven) ||
                (this.currentFilters.tokenStatus === 'not_given' && isTokenGiven)) {
                isMatch = false;
            }
        }
        
        // সার্চ ফিল্টার
        if (isMatch && this.currentFilters.search) {
            const name = (data.name || '').toLowerCase();
            const phone = String(data.phone || '');
            const serial = String(data.serial || '');
            
            if (!name.includes(this.currentFilters.search) && 
                !phone.includes(this.currentFilters.search) && 
                !serial.includes(this.currentFilters.search)) {
                isMatch = false;
            }
        }
        
        return isMatch;
    });
    
    // ২. ফিল্টার করার সাথে সাথে সবসময় পেজ ১ এ রিসেট করুন
    this.currentPage = 1;
    
    // ৩. টেবিল রেন্ডার করুন
    this.renderCurrentPage();
}
    
    getCurrentPageItems() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredAppointments.slice(startIndex, endIndex);
    }
    
    renderCurrentPage() {
        const pageItems = this.getCurrentPageItems();
        this.renderTable(pageItems);
    }
    
    // =======================================================
    // ৫. ডেটা ম্যানেজমেন্ট মেথডস
    // =======================================================
    
    setAppointments(appointments) {
        this.appointments = appointments;
        this.applyFilters();
    }
    
    updateAppointment(updatedAppointment) {
        // লোকালি আপডেট
        const index = this.appointments.findIndex(app => app.id === updatedAppointment.id);
        if (index !== -1) {
            this.appointments[index] = updatedAppointment;
        }
        
        // ফিল্টারড অ্যাপয়েন্টমেন্টস আপডেট
        const filteredIndex = this.filteredAppointments.findIndex(app => app.id === updatedAppointment.id);
        if (filteredIndex !== -1) {
            this.filteredAppointments[filteredIndex] = updatedAppointment;
            
            // শুধুমাত্র সংশ্লিষ্ট রো রি-রেন্ডার
            this.updateTableRow(updatedAppointment);
        }
    }
    
    addAppointment(newAppointment) {
        this.appointments.unshift(newAppointment);
        this.applyFilters();
    }
    
    removeAppointment(appointmentId) {
        this.appointments = this.appointments.filter(app => app.id !== appointmentId);
        this.filteredAppointments = this.filteredAppointments.filter(app => app.id !== appointmentId);
        this.renderCurrentPage();
    }
    
    // =======================================================
    // ৬. ইভেন্ট হ্যান্ডলিং মেথডস
    // =======================================================
    
    setupEventListeners() {
        // গ্লোবাল ইভেন্ট ডেলিগেশন জন্য
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
    }
    
    handleGlobalClick(e) {
        // কল/টোকেন বাটন ক্লিক
        if (e.target.classList.contains('action-btn')) {
            this.handleActionButtonClick(e.target);
        }
        
        // সার্ভিস ব্যাজ ক্লিক
        if (e.target.classList.contains('service-badge')) {
            const serviceType = e.target.textContent.trim();
            this.handleServiceBadgeClick(serviceType);
        }
        
        // স্ট্যাটাস ব্যাজ ক্লিক
        if (e.target.classList.contains('status-badge')) {
            const statusType = e.target.textContent.trim();
            this.handleStatusBadgeClick(statusType);
        }
        
        // এডিট বাটন ক্লিক
        if (e.target.closest('.edit-btn')) {
            const editBtn = e.target.closest('.edit-btn');
            const docId = editBtn.getAttribute('data-id');
            this.handleEditClick(docId);
        }
        
        // ডিলিট বাটন ক্লিক
        if (e.target.closest('.delete-btn')) {
            const deleteBtn = e.target.closest('.delete-btn');
            const docId = deleteBtn.getAttribute('data-id');
            this.handleDeleteClick(docId);
        }
    }
    
    addRowEventListeners(row) {
        const actionButtons = row.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleActionButtonClick(button);
            });
        });
        
        // নতুন: এডিট বাটন ইভেন্ট
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const docId = editBtn.getAttribute('data-id');
                this.handleEditClick(docId);
            });
        }
        
        // নতুন: ডিলিট বাটন ইভেন্ট
        const deleteBtn = row.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const docId = deleteBtn.getAttribute('data-id');
                this.handleDeleteClick(docId);
            });
        }
    }
    
    addPaginationEventListeners(container) {
        const buttons = container.querySelectorAll('.pagination-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.classList.contains('disabled')) return;
                
                const page = button.getAttribute('data-page');
                
                if (page === 'prev') {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.renderCurrentPage();
                    }
                } else if (page === 'next') {
                    if (this.currentPage < this.totalPages) {
                        this.currentPage++;
                        this.renderCurrentPage();
                    }
                } else {
                    const pageNum = parseInt(page);
                    if (pageNum !== this.currentPage) {
                        this.currentPage = pageNum;
                        this.renderCurrentPage();
                    }
                }
            });
        });
    }
    
    handleActionButtonClick(button) {
        const docId = button.getAttribute('data-id');
        const field = button.getAttribute('data-field');
        const currentStatus = button.getAttribute('data-status') === 'true';
        const newStatus = !currentStatus;
        
        // কলব্যাক কল
        if (this.onStatusUpdate) {
            this.onStatusUpdate(docId, field, newStatus, button);
        }
    }
    
    handleEditClick(docId) {
        console.log('Edit clicked for:', docId);
        
        // কলব্যাক কল
        if (this.onEdit) {
            this.onEdit(docId);
        } else {
            // Fallback alert
            alert(`এডিট করার জন্য মোডাল খোলা হবে (ID: ${docId})`);
        }
    }
    
    handleDeleteClick(docId) {
        console.log('Delete requested for:', docId);
        
        if (this.onDelete) {
            // কলব্যাক কল - dashboard.js কনফার্মেশন হ্যান্ডেল করবে
            this.onDelete(docId);
        } else {
            // Fallback confirmation
            if (confirm('আপনি কি নিশ্চিত যে আপনি এই এন্ট্রি ডিলিট করতে চান?')) {
                alert(`ডিলিট রিকোয়েস্ট (ID: ${docId})`);
            }
        }
    }
    
    handleServiceBadgeClick(serviceText) {
        // সার্ভিস ফিল্টারে ক্লিক করলে ফিল্টার সেট করুন
        const serviceMap = {
            'সাধারণ সিরিয়াল': 'general',
            'মাইক্রোনিডলিং': 'microneedling',
            'পি আর পি': 'prp',
            'ক্রায়োসার্জারি': 'cryosurgery',
            'ইলেক্ট্রোক্যাটারি': 'electrocautery'
        };
        
        const serviceValue = serviceMap[serviceText];
        if (serviceValue) {
            this.setFilters({ service: serviceValue });
        }
    }
    
    handleStatusBadgeClick(statusText) {
        // স্ট্যাটাস ফিল্টারে ক্লিক করলে ফিল্টার সেট করুন
        if (statusText.includes('কল')) {
            const callStatus = statusText.includes('করা হয়েছে') ? 'called' : 'not_called';
            this.setFilters({ callStatus });
        } else if (statusText.includes('টোকেন')) {
            const tokenStatus = statusText.includes('দেওয়া হয়েছে') ? 'given' : 'not_given';
            this.setFilters({ tokenStatus });
        }
    }
    
    // =======================================================
    // ৭. টেবিল আপডেট মেথডস
    // =======================================================
    
    updateTableRow(updatedAppointment) {
        const { id, data } = updatedAppointment;
        const row = this.tbody.querySelector(`tr button[data-id="${id}"]`)?.closest('tr');
        
        if (!row) return;
        
        // আপডেট করা ডেটা
        const isCalled = data.called === true;
        const callStatusClass = isCalled ? 'status-called' : 'status-not-called';
        const callStatusText = isCalled ? 'কল করা হয়েছে' : 'কল করা হয়নি';
        const callButtonClass = isCalled ? 'btn-call-undo' : 'btn-call';
        const callButtonText = isCalled ? 'কল বাতিল' : data.name || 'কল করুন';
        
        const isTokenGiven = data.tokenGiven === true;
        const tokenStatusClass = isTokenGiven ? 'status-token-given' : 'status-token-not-given';
        const tokenStatusText = isTokenGiven ? 'টোকেন দেওয়া' : 'টোকেন বাকি';
        const tokenButtonClass = isTokenGiven ? 'btn-token-undo' : 'btn-token';
        const tokenButtonText = isTokenGiven ? 'টোকেন বাতিল' : data.name || 'টোকেন দিন';
        
        // সার্ভিস টাইপ
        const serviceType = data.serviceType || 'general';
        const serviceText = this.getServiceText(serviceType);
        const serviceClass = this.getServiceClass(serviceType);
        
        // অন্যান্য ডেটা
        const ageDisplay = this.getAgeDisplay(data);
        const typeText = (data.patientType || data.type || 'new') === 'old' ? 'পুরাতন' : 'নতুন';
        const timeText = data.time || '—';
        
        // তারিখ ফরম্যাট
        let appointmentDate = '—';
        if (data.timestamp && data.timestamp.toDate) {
            const date = data.timestamp.toDate();
            appointmentDate = date.toLocaleDateString('bn-BD');
        }
        
        // রো আপডেট
        row.innerHTML = `
            <td>${this.toBengaliNumber(data.serial || '—')}</td>
            <td><span class="status-badge ${callStatusClass}">${callStatusText}</span></td>
            <td><span class="status-badge ${tokenStatusClass}">${tokenStatusText}</span></td>
            <td>${data.name || '—'}</td>
            <td>${ageDisplay}</td>
            <td style="text-align: center;">${data.phone ? this.toBengaliNumber(data.phone) : '—'}</td>
            <td><span class="service-badge ${serviceClass}">${serviceText}</span></td>
            <td>${appointmentDate}<br><small>${timeText}</small></td>
            <td>${typeText}</td>
            <td>${this.formatTimestamp(data.timestamp)}</td>
            <td><button class="action-btn ${callButtonClass}" data-id="${id}" data-field="called" data-status="${isCalled}">${callButtonText}</button></td>
            <td><button class="action-btn ${tokenButtonClass}" data-id="${id}" data-field="tokenGiven" data-status="${isTokenGiven}">${tokenButtonText}</button></td>
            <td style="text-align: center;">
                <div class="edit-delete-actions" style="display: flex; gap: 5px; justify-content: center;">
                    <button class="edit-btn" data-id="${id}" title="এডিট">
                        <i class="fas fa-edit" style="color: #2563eb;"></i>
                    </button>
                    <button class="delete-btn" data-id="${id}" title="ডিলিট">
                        <i class="fas fa-trash-alt" style="color: #dc2626;"></i>
                    </button>
                </div>
            </td>
        `;
        
        // ইভেন্ট লিসেনার যোগ
        this.addRowEventListeners(row);
    }
    
    updateButtonStatus(button, newStatus, field) {
        const docId = button.getAttribute('data-id');
        const row = button.closest('tr');
        
        if (!row) return;
        
        // বাটন আপডেট
        if (field === 'called') {
            const callButtonClass = newStatus ? 'btn-call-undo' : 'btn-call';
            const callButtonText = newStatus ? 'কল বাতিল' : row.querySelector('td:nth-child(4)').textContent || 'কল করুন';
            const callStatusClass = newStatus ? 'status-called' : 'status-not-called';
            const callStatusText = newStatus ? 'কল করা হয়েছে' : 'কল করা হয়নি';
            
            button.className = `action-btn ${callButtonClass}`;
            button.textContent = callButtonText;
            button.setAttribute('data-status', newStatus);
            
            // স্ট্যাটাস ব্যাজ আপডেট
            const statusBadge = row.querySelector('td:nth-child(2) .status-badge');
            if (statusBadge) {
                statusBadge.textContent = callStatusText;
                statusBadge.className = `status-badge ${callStatusClass}`;
            }
        } else if (field === 'tokenGiven') {
            const tokenButtonClass = newStatus ? 'btn-token-undo' : 'btn-token';
            const tokenButtonText = newStatus ? 'টোকেন বাতিল' : 'টোকেন দিন';
            const tokenStatusClass = newStatus ? 'status-token-given' : 'status-token-not-given';
            const tokenStatusText = newStatus ? 'টোকেন দেওয়া হয়েছে' : 'টোকেন দেওয়া হয়নি';
            
            button.className = `action-btn ${tokenButtonClass}`;
            button.textContent = tokenButtonText;
            button.setAttribute('data-status', newStatus);
            
            // স্ট্যাটাস ব্যাজ আপডেট
            const statusBadge = row.querySelector('td:nth-child(3) .status-badge');
            if (statusBadge) {
                statusBadge.textContent = tokenStatusText;
                statusBadge.className = `status-badge ${tokenStatusClass}`;
            }
        }
    }
    
    // =======================================================
    // ৮. এক্সপোর্ট/ডাউনলোড মেথডস
    // =======================================================
    
    exportToCSV(filename = 'সিরিয়াল_ডেটা') {
        if (this.filteredAppointments.length === 0) {
            return false;
        }
        
        try {
            // CSV হেডার
            const headers = [
                'সিরিয়াল',
                'কল স্ট্যাটাস',
                'টোকেন স্ট্যাটাস',
                'রোগীর নাম',
                'বয়স',
                'ফোন',
                'সার্ভিস',
                'তারিখ',
                'সময়',
                'রোগীর ধরন',
                'বুকিং তারিখ'
            ];
            
            // CSV ডেটা
            const csvData = this.filteredAppointments.map(item => {
                const data = item.data;
                
                // সার্ভিস টেক্সট
                const serviceType = data.serviceType || 'general';
                const serviceText = this.getServiceText(serviceType);
                
                // স্ট্যাটাস টেক্সট
                const isCalled = data.called === true;
                const callStatusText = isCalled ? 'কল করা হয়েছে' : 'কল করা হয়নি';
                
                const isTokenGiven = data.tokenGiven === true;
                const tokenStatusText = isTokenGiven ? 'টোকেন দেওয়া হয়েছে' : 'টোকেন দেওয়া হয়নি';
                
                // রোগীর ধরন
                const typeText = (data.patientType || data.type || 'new') === 'old' ? 'পুরাতন' : 'নতুন';
                
                // বয়স
                const ageDisplay = this.getAgeDisplay(data);
                
                // তারিখ
                let appointmentDate = '';
                if (data.timestamp && data.timestamp.toDate) {
                    const date = data.timestamp.toDate();
                    appointmentDate = date.toLocaleDateString('bn-BD');
                }
                
                // টাইমস্ট্যাম্প
                const timestamp = this.formatTimestamp(data.timestamp);
                
                return [
                    data.serial || '',
                    callStatusText,
                    tokenStatusText,
                    data.name || '',
                    ageDisplay,
                    data.phone || '',
                    serviceText,
                    appointmentDate,
                    data.time || '',
                    typeText,
                    timestamp
                ];
            });
            
            // CSV স্ট্রিং তৈরি
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');
            
            // ফাইলনেম
            const dateStr = new Date().toISOString().slice(0, 10);
            const fullFilename = `${filename}_${dateStr}.csv`;
            
            // ডাউনলোড
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', fullFilename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
            
        } catch (error) {
            console.error('CSV export error:', error);
            return false;
        }
    }
    
    exportToExcel(filename = 'সিরিয়াল_ডেটা') {
        // এক্সেল এক্সপোর্টের জন্য CSV ব্যবহার করুন
        return this.exportToCSV(filename);
    }
    
    printTable() {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('প্রিন্ট উইন্ডো খুলতে সমস্যা হয়েছে। পপআপ ব্লকার চেক করুন।');
            return;
        }
        
        const tableClone = this.table.cloneNode(true);
        
        // স্টাইলস যোগ
        const styles = `
            <style>
                body { font-family: 'Noto Sans Bengali', sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th { background-color: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
                td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
                .status-badge, .service-badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; }
                .status-called { background-color: #dcfce7; color: #166534; }
                .status-not-called { background-color: #fef3c7; color: #92400e; }
                .status-token-given { background-color: #dbeafe; color: #1e40af; }
                .status-token-not-given { background-color: #f3e8ff; color: #5b21b6; }
                .service-general { background-color: rgba(59, 130, 246, 0.1); color: #1d4ed8; }
                .service-microneedling { background-color: rgba(139, 92, 246, 0.1); color: #6d28d9; }
                .service-prp { background-color: rgba(16, 185, 129, 0.1); color: #047857; }
                .service-cryosurgery { background-color: rgba(14, 165, 233, 0.1); color: #0369a1; }
                .service-electrocautery { background-color: rgba(245, 158, 11, 0.1); color: #b45309; }
                .action-btn { display: none; }
                .edit-delete-actions { display: none; }
                .print-header { text-align: center; margin-bottom: 20px; }
                .print-footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
        `;
        
        // হেডার যোগ
        const header = `
            <div class="print-header">
                <h2>সিরিয়াল ডেটা রিপোর্ট</h2>
                <p>তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
                <p>মোট রেকর্ড: ${this.toBengaliNumber(this.filteredAppointments.length)}</p>
            </div>
        `;
        
        // ফুটার যোগ
        const footer = `
            <div class="print-footer">
                <p>প্রিন্ট তারিখ: ${new Date().toLocaleString('bn-BD')}</p>
            </div>
        `;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>সিরিয়াল ডেটা রিপোর্ট</title>
                    ${styles}
                </head>
                <body>
                    ${header}
                    ${tableClone.outerHTML}
                    ${footer}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        };
                    <\/script>
                </body>
            </html>
        `);
        
        printWindow.document.close();
    }
    
    // =======================================================
    // ৯. ইউটিলিটি মেথডস
    // =======================================================
    
    getStats() {
        const stats = {
            total: this.filteredAppointments.length,
            called: this.filteredAppointments.filter(item => item.data.called === true).length,
            notCalled: this.filteredAppointments.filter(item => item.data.called !== true).length,
            tokenGiven: this.filteredAppointments.filter(item => item.data.tokenGiven === true).length,
            tokenNotGiven: this.filteredAppointments.filter(item => item.data.tokenGiven !== true).length,
            
            // সার্ভিস অনুযায়ী
            general: this.filteredAppointments.filter(item => (item.data.serviceType || 'general') === 'general').length,
            microneedling: this.filteredAppointments.filter(item => (item.data.serviceType || 'general') === 'microneedling').length,
            prp: this.filteredAppointments.filter(item => (item.data.serviceType || 'general') === 'prp').length,
            cryosurgery: this.filteredAppointments.filter(item => (item.data.serviceType || 'general') === 'cryosurgery').length,
            electrocautery: this.filteredAppointments.filter(item => (item.data.serviceType || 'general') === 'electrocautery').length,
            
            // রোগীর ধরন অনুযায়ী
            newPatient: this.filteredAppointments.filter(item => (item.data.patientType || item.data.type || 'new') === 'new').length,
            oldPatient: this.filteredAppointments.filter(item => (item.data.patientType || item.data.type || 'new') === 'old').length
        };
        
        return stats;
    }
    
    getFilteredCount() {
        return this.filteredAppointments.length;
    }
    
    clearFilters() {
        this.currentFilters = {
            date: '',
            service: 'all',
            type: 'all',
            callStatus: 'all',
            tokenStatus: 'all',
            search: ''
        };
        
        this.applyFilters();
    }
    
    search(query) {
        this.setFilters({ search: query.toLowerCase().trim() });
    }
    
    // =======================================================
    // ১০. ডেস্ট্রাক্টর/ক্লিনআপ
    // =======================================================
    
    cleanup() {
        // ইভেন্ট লিসেনার রিমুভ
        document.removeEventListener('click', this.handleGlobalClick);
        
        // ডেটা ক্লিয়ার
        this.appointments = [];
        this.filteredAppointments = [];
        
        console.log('Table Manager cleaned up');
    }
}

// গ্লোবাল এক্সেসের জন্য
if (typeof window !== 'undefined') {
    window.TableManager = TableManager;
}

// CSS স্টাইলস যোগ (যদি না থাকে)
if (!document.querySelector('style[data-table-manager]')) {
    const style = document.createElement('style');
    style.setAttribute('data-table-manager', 'true');
    style.textContent = `
        /* টেবিল ম্যানেজার স্টাইলস */
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .pagination-btn {
            padding: 8px 16px;
            border: 1px solid #e5e7eb;
            background-color: white;
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Noto Sans Bengali', sans-serif;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .pagination-btn:hover:not(.disabled):not(.active) {
            background-color: #f9fafb;
            border-color: #d1d5db;
        }
        
        .pagination-btn.active {
            background-color: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
        
        .pagination-btn.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* সার্ভিস ব্যাজ স্টাইলস */
        .service-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            min-width: 100px;
            text-align: center;
        }
        
        .service-general {
            background-color: rgba(59, 130, 246, 0.1);
            color: #1d4ed8;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .service-microneedling {
            background-color: rgba(139, 92, 246, 0.1);
            color: #6d28d9;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }
        
        .service-prp {
            background-color: rgba(16, 185, 129, 0.1);
            color: #047857;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .service-cryosurgery {
            background-color: rgba(14, 165, 233, 0.1);
            color: #0369a1;
            border: 1px solid rgba(14, 165, 233, 0.3);
        }
        
        .service-electrocautery {
            background-color: rgba(245, 158, 11, 0.1);
            color: #b45309;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        /* স্ট্যাটাস ব্যাজ স্টাইলস */
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            min-width: 100px;
            text-align: center;
        }
        
        .status-called {
            background-color: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        
        .status-not-called {
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
        }
        
        .status-token-given {
            background-color: #dbeafe;
            color: #1e40af;
            border: 1px solid #bfdbfe;
        }
        
        .status-token-not-given {
            background-color: #f3e8ff;
            color: #5b21b6;
            border: 1px solid #e9d5ff;
        }
        
        /* অ্যাকশন বাটন স্টাইলস */
        .action-btn {
            padding: 6px 14px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s ease;
            min-width: 90px;
            white-space: nowrap;
        }
        
        .btn-call {
            background-color: #2563eb;
            color: white;
        }
        
        .btn-call:hover {
            background-color: #1d4ed8;
        }
        
        .btn-call-undo {
            background-color: #dc2626;
            color: white;
        }
        
        .btn-call-undo:hover {
            background-color: #b91c1c;
        }
        
        .btn-token {
            background-color: #f59e0b;
            color: white;
        }
        
        .btn-token:hover {
            background-color: #eab308;
        }
        
        .btn-token-undo {
            background-color: #0ea5e9;
            color: white;
        }
        
        .btn-token-undo:hover {
            background-color: #0284c7;
        }
        
        /* এডিট/ডিলিট বাটন স্টাইলস */
        .edit-btn, .delete-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px 10px;
            border-radius: 4px;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
        }
        
        .edit-btn:hover {
            background-color: rgba(37, 99, 235, 0.1);
        }
        
        .delete-btn:hover {
            background-color: rgba(220, 38, 38, 0.1);
        }
        
        .edit-btn i, .delete-btn i {
            font-size: 16px;
        }
        
        /* রেসপনসিভ টেবিল */
        @media (max-width: 768px) {
            .service-badge,
            .status-badge {
                min-width: 80px;
                font-size: 11px;
                padding: 3px 8px;
            }
            
            .action-btn {
                min-width: 75px;
                padding: 5px 10px;
                font-size: 12px;
            }
            
            .edit-btn, .delete-btn {
                width: 32px;
                height: 32px;
                padding: 5px 8px;
            }
            
            .edit-btn i, .delete-btn i {
                font-size: 14px;
            }
            
            .pagination-btn {
                padding: 6px 12px;
                font-size: 12px;
            }
        }
        
        @media (max-width: 480px) {
            .pagination-btn {
                padding: 5px 10px;
                font-size: 11px;
            }
            
            .pagination-info {
                font-size: 12px;
            }
        }
    `;
    document.head.appendChild(style);
}