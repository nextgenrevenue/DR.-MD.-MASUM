// quick-modal.js - Multi-Patient Appointment Modal & Grid System
console.log("⚡ Quick Modal System loading...");

class QuickModal {
    constructor(dbOrConfig, adminSessionId = null, showAlert = null) {
        if (dbOrConfig && dbOrConfig.db) {
            this.db = dbOrConfig.db;
            this.firebase = dbOrConfig.firebase || (typeof firebase !== 'undefined' ? firebase : null);
            this.adminSessionId = dbOrConfig.adminSessionId || 'admin_' + Date.now();
            this.showAlert = dbOrConfig.showAlert || window.showAlert || alert;
        } else {
            this.db = dbOrConfig;
            this.firebase = typeof firebase !== 'undefined' ? firebase : null;
            this.adminSessionId = adminSessionId || 'admin_' + Date.now();
            this.showAlert = showAlert || window.showAlert || alert;
        }

        this.serialRanges = {};
        this.currentSelectedSerial = null;
        this.patientCount = 1;
        this.isEditMode = false;
        this.editDocId = null;
        this.originalData = null;
        this.bookedSerials = [];
        this.pendingSerials = [];
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
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yy}${mm}${dd}`;
    }

    getDayNameBangla(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
        return days[d.getDay()];
    }

    getDayNameEnglish(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[d.getDay()];
    }

    async initialize() {
        this.createModalHTML();
        this.attachEventListeners();
        await this.loadSerialRanges();
        console.log("✅ Quick Modal System initialized successfully");
    }

    async loadSerialRanges() {
        if (!this.db) return;
        try {
            const doc = await this.db.collection('settings').doc('serialRanges').get();
            if (doc.exists) {
                this.serialRanges = doc.data();
            }
        } catch (e) {
            console.error("❌ Failed to load serial ranges in QuickModal:", e);
        }
    }

    createModalHTML() {
        if (document.getElementById('quickAppointmentModal')) return;

        const modalDiv = document.createElement('div');
        modalDiv.id = 'quickAppointmentModal';
        modalDiv.className = 'quick-modal-overlay';
        modalDiv.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 9999; justify-content: center; align-items: center; 
            overflow-y: auto; padding: 20px 10px;
        `;

        modalDiv.innerHTML = `
            <div class="quick-modal-content" style="background: white; border-radius: 12px; width: 100%; max-width: 680px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; position: relative; margin: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">
                    <h3 id="quickModalTitle" style="margin: 0; color: #1d4ed8; font-size: 20px; font-weight: 700;">⚡ সিরিয়াল যুক্ত করুন</h3>
                    <button id="closeQuickModalBtn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
                </div>

                <form id="quickAppointmentForm" style="display: flex; flex-direction: column; gap: 16px;"> 
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-weight: 600; font-size: 14px; margin-bottom: 4px; display: block; color: #374151;">তারিখ *</label>
                            <input type="date" id="quickDate" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 14px; margin-bottom: 4px; display: block; color: #374151;">সেবা *</label>
                            <select id="serviceType" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="general">সাধারণ চিকিৎসা</option>
                                <option value="microneedling">মাইক্রোনিডলিং</option>
                                <option value="prp">পি আর পি</option>
                                <option value="electrocautery">ইলেক্ট্রোক্যাটারি</option>
                                <option value="cryosurgery">ক্রায়োসার্জারি</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-weight: 600; font-size: 14px; margin-bottom: 4px; display: block; color: #374151;">রোগীর ধরন *</label>
                            <select id="patientTypeSelect" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="new">নতুন রোগী</option>
                                <option value="old">পুরাতন রোগী</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: 600; font-size: 14px; margin-bottom: 4px; display: block; color: #374151;">সময় *</label>
                            <select id="quickTime" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="">সময় নির্বাচন করুন</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label style="font-weight: 600; font-size: 14px; color: #374151;">সিরিয়াল নম্বর নির্বাচন করুন *</label>
                            <span id="selectedSerialInfo" style="font-size: 13px; font-weight: 600; color: #2563eb;"></span>
                        </div>
                        <div id="serialGrid" class="serial-grid" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; max-height: 180px; overflow-y: auto; background: #f9fafb; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb; min-height: 80px;"></div>
                        <input type="hidden" id="quickSerialInput" required>
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <label style="font-weight: 700; font-size: 15px; color: #1e293b;">রোগীর তথ্য</label>
                            <button type="button" id="addPatientBtn" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                + আরও রোগী যোগ করুন
                            </button>
                        </div>

                        <div id="patientsContainer" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Patient Cards inserted here dynamically -->
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="font-weight: 600; font-size: 14px; color: #374151;">যোগাযোগের নম্বর *</label>
                            <label style="font-size: 13px; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                                <input type="checkbox" id="skipPhoneCheckbox"> ফোন নম্বর ছাড়া বুকিং করুন
                            </label>
                        </div>
                        <input type="tel" id="quickPhone" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;" placeholder="01XXXXXXXXX">
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 10px;">
                        <button type="submit" id="quickSubmitBtn" style="flex: 1; background: #1d4ed8; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; font-size: 16px; cursor: pointer;">
                            সংরক্ষণ করুন
                        </button>
                        <button type="button" id="cancelQuickModalBtn" style="background: #9ca3af; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: 600; font-size: 16px; cursor: pointer;">
                            বাতিল
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modalDiv);
        this.addStyles();
        this.addPatientCardHTML(1);
    }

    addStyles() {
        if (document.getElementById('quick-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'quick-modal-styles';
        style.textContent = `
            .serial-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; max-height: 180px; overflow-y: auto; background-color: #f9fafb; }
            .serial-item { padding: 8px; border: 2px solid transparent; border-radius: 6px; text-align: center; font-weight: 600; font-size: 13px; cursor: pointer; user-select: none; transition: all 0.15s ease; min-height: 36px; display: flex; align-items: center; justify-content: center; }
            .serial-item.available { background-color: #dcfce7; color: #16a34a; border-color: #16a34a; }
            .serial-item.available:hover { background-color: #bbf7d0; transform: translateY(-1px); }
            .serial-item.booked { background-color: #fecaca; color: #dc2626; border-color: #dc2626; cursor: not-allowed; opacity: 0.7; }
            .serial-item.pending { background-color: #dbeafe; color: #2563eb; border-color: #2563eb; cursor: not-allowed; opacity: 0.7; }
            .serial-item.selected { background-color: #fef3c7; color: #d97706; border-color: #f59e0b; font-weight: 800; transform: scale(1.05); }
            .patient-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; position: relative; }
            @media (max-width: 640px) { .serial-grid { grid-template-columns: repeat(6, 1fr); } }
        `;
        document.head.appendChild(style);
    }

    addPatientCardHTML(index) {
        const container = document.getElementById('patientsContainer');
        if (!container) return;

        const card = document.createElement('div');
        card.className = 'patient-card';
        card.dataset.patientIndex = index;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 600; font-size: 13px; color: #475569;">
                    রোগী #${index} <span class="serial-badge" style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; margin-left: 6px; font-size: 12px;">সিরিয়াল: -</span>
                </span>
                ${index > 1 ? `<button type="button" class="remove-patient-btn" style="background: #fee2e2; color: #dc2626; border: none; padding: 2px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">✕ মুছে ফেলুন</button>` : ''}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 2px;">রোগীর নাম *</label>
                    <input type="text" class="patient-name" required style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px;" placeholder="রোগীর নাম">
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 2px;">বয়স *</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                        <input type="number" class="patient-age-years" placeholder="বছর" min="0" max="120" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; text-align: center;">
                        <input type="number" class="patient-age-months" placeholder="মাস" min="0" max="11" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; text-align: center;">
                        <input type="number" class="patient-age-days" placeholder="দিন" min="0" max="30" style="padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; text-align: center;">
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);

        const removeBtn = card.querySelector('.remove-patient-btn');
        if (removeBtn) {
            removeBtn.onclick = () => {
                card.remove();
                this.updatePatientIndices();
                this.updateGridSelection();
            };
        }
    }

    updatePatientIndices() {
        const container = document.getElementById('patientsContainer');
        if (!container) return;
        const cards = container.querySelectorAll('.patient-card');
        this.patientCount = cards.length;

        cards.forEach((card, idx) => {
            const newIndex = idx + 1;
            card.dataset.patientIndex = newIndex;
            const headerText = card.querySelector('.patient-card span');
            if (headerText) {
                const serialBadge = card.querySelector('.serial-badge');
                const badgeHTML = serialBadge ? serialBadge.outerHTML : '<span class="serial-badge" style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; margin-left: 6px; font-size: 12px;">সিরিয়াল: -</span>';
                headerText.innerHTML = `রোগী #${newIndex} ${badgeHTML}`;
            }
        });
    }

    attachEventListeners() {
        const modal = document.getElementById('quickAppointmentModal');
        const closeBtn = document.getElementById('closeQuickModalBtn');
        const cancelBtn = document.getElementById('cancelQuickModalBtn');
        const form = document.getElementById('quickAppointmentForm');
        const addPatientBtn = document.getElementById('addPatientBtn');

        const dateInput = document.getElementById('quickDate');
        const serviceSelect = document.getElementById('serviceType');
        const typeSelect = document.getElementById('patientTypeSelect');
        const timeSelect = document.getElementById('quickTime');
        const skipPhoneCb = document.getElementById('skipPhoneCheckbox');
        const phoneInput = document.getElementById('quickPhone');

        if (closeBtn) closeBtn.onclick = () => this.closeModal();
        if (cancelBtn) cancelBtn.onclick = () => this.closeModal();

        if (addPatientBtn) {
            addPatientBtn.onclick = () => {
                this.patientCount++;
                this.addPatientCardHTML(this.patientCount);
                this.updateGridSelection();
            };
        }

        if (skipPhoneCb) {
            skipPhoneCb.onchange = () => {
                if (skipPhoneCb.checked) {
                    phoneInput.value = '';
                    phoneInput.required = false;
                    phoneInput.style.display = 'none';
                } else {
                    phoneInput.required = true;
                    phoneInput.style.display = 'block';
                }
            };
        }

        [dateInput, serviceSelect, typeSelect].forEach(elem => {
            if (elem) elem.onchange = () => this.updateTimesAndGrid();
        });

        if (timeSelect) {
            timeSelect.onchange = () => this.loadGridForSelection();
        }

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.handleSubmit();
            };
        }
    }

    openModal() {
        this.isEditMode = false;
        this.editDocId = null;
        this.originalData = null;

        document.getElementById('quickModalTitle').textContent = '⚡ সিরিয়াল যুক্ত করুন';
        document.getElementById('quickSubmitBtn').textContent = 'সংরক্ষণ করুন';

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('quickDate').value = today;
        document.getElementById('serviceType').value = 'general';
        document.getElementById('patientTypeSelect').value = 'new';
        document.getElementById('quickSerialInput').value = '';
        document.getElementById('selectedSerialInfo').textContent = '';

        const skipPhoneCb = document.getElementById('skipPhoneCheckbox');
        const phoneInput = document.getElementById('quickPhone');
        if (skipPhoneCb) skipPhoneCb.checked = false;
        if (phoneInput) {
            phoneInput.value = '';
            phoneInput.required = true;
            phoneInput.style.display = 'block';
        }

        const container = document.getElementById('patientsContainer');
        if (container) container.innerHTML = '';
        this.patientCount = 1;
        this.addPatientCardHTML(1);

        this.updateTimesAndGrid();
        document.getElementById('quickAppointmentModal').style.display = 'flex';
    }

    openNewModal() {
        this.openModal();
    }

    async openEditModal(docId, data) {
        if (!docId || !data) return;

        this.isEditMode = true;
        this.editDocId = docId;
        this.originalData = data;

        document.getElementById('quickModalTitle').textContent = '✏️ অ্যাপয়েন্টমেন্ট এডিট করুন';
        document.getElementById('quickSubmitBtn').textContent = 'হালনাগাদ করুন';

        const dateVal = data.date || data.appointmentDate || new Date().toISOString().split('T')[0];
        document.getElementById('quickDate').value = dateVal;
        document.getElementById('serviceType').value = data.serviceType || data.service || 'general';
        document.getElementById('patientTypeSelect').value = (data.patientType || data.type || 'new').toLowerCase();

        const skipPhoneCb = document.getElementById('skipPhoneCheckbox');
        const phoneInput = document.getElementById('quickPhone');
        if (!data.phone || data.phone === '-' || data.phone === 'N/A') {
            if (skipPhoneCb) skipPhoneCb.checked = true;
            if (phoneInput) {
                phoneInput.value = '';
                phoneInput.required = false;
                phoneInput.style.display = 'none';
            }
        } else {
            if (skipPhoneCb) skipPhoneCb.checked = false;
            if (phoneInput) {
                phoneInput.value = data.phone;
                phoneInput.required = true;
                phoneInput.style.display = 'block';
            }
        }

        const container = document.getElementById('patientsContainer');
        if (container) container.innerHTML = '';
        this.patientCount = 1;
        this.addPatientCardHTML(1);

        const firstCard = container.querySelector('.patient-card');
        if (firstCard) {
            const nameInput = firstCard.querySelector('.patient-name');
            const yearsInput = firstCard.querySelector('.patient-age-years');
            const monthsInput = firstCard.querySelector('.patient-age-months');
            const daysInput = firstCard.querySelector('.patient-age-days');

            if (nameInput) nameInput.value = data.name || '';
            if (yearsInput) yearsInput.value = data.ageYears || 0;
            if (monthsInput) monthsInput.value = data.ageMonths || 0;
            if (daysInput) daysInput.value = data.ageDays || 0;
        }

        await this.updateTimesAndGrid();

        if (data.time) {
            document.getElementById('quickTime').value = data.time;
            await this.loadGridForSelection();
        }

        if (data.serial) {
            this.currentSelectedSerial = parseInt(data.serial);
            document.getElementById('quickSerialInput').value = this.currentSelectedSerial;
            this.updateGridSelection();
        }

        document.getElementById('quickAppointmentModal').style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('quickAppointmentModal');
        if (modal) modal.style.display = 'none';
    }

    async updateTimesAndGrid() {
        const dateVal = document.getElementById('quickDate').value;
        const serviceVal = document.getElementById('serviceType').value;
        const typeVal = document.getElementById('patientTypeSelect').value;
        const timeSelect = document.getElementById('quickTime');

        timeSelect.innerHTML = '<option value="">সময় নির্বাচন করুন</option>';

        if (!dateVal) return;

        const englishDay = this.getDayNameEnglish(dateVal);
        const dayData = this.serialRanges[englishDay];

        if (dayData) {
            let times = [];
            if (dayData[serviceVal] && dayData[serviceVal][typeVal]) {
                times = Object.keys(dayData[serviceVal][typeVal]);
            } else if (dayData[typeVal]) {
                times = Object.keys(dayData[typeVal]);
            }

            times.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                timeSelect.appendChild(opt);
            });
        }

        if (timeSelect.options.length > 1) {
            timeSelect.selectedIndex = 1;
        }

        await this.loadGridForSelection();
    }

    async loadGridForSelection() {
        const dateVal = document.getElementById('quickDate').value;
        const serviceVal = document.getElementById('serviceType').value;
        const typeVal = document.getElementById('patientTypeSelect').value;
        const timeVal = document.getElementById('quickTime').value;
        const gridContainer = document.getElementById('serialGrid');

        if (!gridContainer) return;
        gridContainer.innerHTML = '';

        if (!dateVal || !timeVal) {
            gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 20px;">তারিখ এবং সময় নির্বাচন করুন</div>';
            return;
        }

        const englishDay = this.getDayNameEnglish(dateVal);
        let range = null;
        if (this.serialRanges[englishDay]) {
            const dData = this.serialRanges[englishDay];
            if (dData[serviceVal] && dData[serviceVal][typeVal] && dData[serviceVal][typeVal][timeVal] !== undefined) {
                range = dData[serviceVal][typeVal][timeVal];
            } else if (dData[typeVal] && dData[typeVal][timeVal] !== undefined) {
                range = dData[typeVal][timeVal];
            }
        }

        let start = 1, end = 20;
        if (Array.isArray(range)) {
            [start, end] = range;
        } else if (typeof range === 'number') {
            end = range;
        } else if (typeof range === 'string') {
            if (range.includes('-')) {
                const parts = range.split('-');
                start = parseInt(parts[0]);
                end = parseInt(parts[1]);
            } else {
                end = parseInt(range);
            }
        }

        // Fetch booked serials
        const yymmdd = this.getYYMMDD(dateVal);
        this.bookedSerials = [];
        this.pendingSerials = [];

        if (this.db && yymmdd) {
            try {
                const snap = await this.db.collection('appointments').doc(yymmdd).collection(typeVal).get();
                snap.forEach(doc => {
                    const data = doc.data();
                    const appTime = data.time;
                    const appService = data.serviceType || data.service || 'general';
                    if (appTime === timeVal && appService === serviceVal && data.serial) {
                        this.bookedSerials.push(parseInt(data.serial));
                    }
                });

                // Fetch pending selections
                const pendingSnap = await this.db.collection('pendingSelections').get();
                const now = new Date();
                pendingSnap.forEach(doc => {
                    const pData = doc.data();
                    const pDate = pData.date || pData.appointmentDate;
                    const pType = (pData.type || pData.patientType || 'new').toLowerCase();
                    const pTime = pData.time;
                    const pService = pData.service || pData.serviceType || 'general';
                    const expiresAt = pData.expiresAt?.toDate ? pData.expiresAt.toDate() : new Date(pData.expiresAt);

                    if (pDate === dateVal && pTime === timeVal && pType === typeVal && pService === serviceVal && expiresAt > now) {
                        if (pData.serial) this.pendingSerials.push(parseInt(pData.serial));
                    }
                });
            } catch (e) {
                console.error("❌ Error fetching booked serials:", e);
            }
        }

        for (let s = start; s <= end; s++) {
            const item = document.createElement('div');
            item.className = 'serial-item';
            item.textContent = s;
            item.dataset.serial = s;

            const isBooked = this.bookedSerials.includes(s) && (!this.isEditMode || s !== parseInt(this.originalData?.serial));
            const isPending = this.pendingSerials.includes(s);

            if (isBooked) {
                item.classList.add('booked');
                item.title = 'ইতিমধ্যে বুক করা';
            } else if (isPending) {
                item.classList.add('pending');
                item.title = 'অন্য ক্লায়েন্ট প্রসেসিং করছে';
            } else {
                item.classList.add('available');
                item.onclick = () => this.selectSerialRange(s, start, end);
            }

            gridContainer.appendChild(item);
        }

        this.updateGridSelection();
    }

    selectSerialRange(startSerial, rangeMin, rangeMax) {
        const requiredCount = this.patientCount;
        let serials = [];

        for (let i = 0; i < requiredCount; i++) {
            const s = startSerial + i;
            if (s > rangeMax) {
                alert(`সিরিয়াল #${s} নির্ধারিত রেঞ্জের বাইরে (${rangeMin}-${rangeMax})`);
                return;
            }
            if (this.bookedSerials.includes(s) && (!this.isEditMode || s !== parseInt(this.originalData?.serial))) {
                alert(`সিরিয়াল #${s} ইতিমধ্যে বুক করা হয়েছে! অনুগ্রহ করে অন্য ফাঁকা সিরিয়াল নির্বাচন করুন।`);
                return;
            }
            if (this.pendingSerials.includes(s)) {
                alert(`সিরিয়াল #${s} অন্য কাস্টমার পছন্দ করছেন! অনুগ্রহ করে অন্য সিরিয়াল নির্বাচন করুন।`);
                return;
            }
            serials.push(s);
        }

        this.currentSelectedSerial = startSerial;
        document.getElementById('quickSerialInput').value = startSerial;
        this.updateGridSelection();
    }

    updateGridSelection() {
        const startSerial = parseInt(document.getElementById('quickSerialInput').value || this.currentSelectedSerial);
        const gridItems = document.querySelectorAll('#serialGrid .serial-item');
        const container = document.getElementById('patientsContainer');
        const patientCards = container ? container.querySelectorAll('.patient-card') : [];

        gridItems.forEach(item => {
            if (!item.classList.contains('booked') && !item.classList.contains('pending')) {
                item.classList.remove('selected');
                item.classList.add('available');
            }
        });

        if (!isNaN(startSerial) && startSerial > 0) {
            const selectedSerials = [];
            for (let i = 0; i < this.patientCount; i++) {
                const s = startSerial + i;
                selectedSerials.push(s);
                const elem = document.querySelector(`#serialGrid .serial-item[data-serial="${s}"]`);
                if (elem && !elem.classList.contains('booked')) {
                    elem.classList.remove('available');
                    elem.classList.add('selected');
                }
            }

            // Update patient card badges
            patientCards.forEach((card, idx) => {
                const assignedSerial = startSerial + idx;
                const badge = card.querySelector('.serial-badge');
                if (badge) {
                    badge.textContent = `সিরিয়াল: #${assignedSerial}`;
                }
            });

            const infoElem = document.getElementById('selectedSerialInfo');
            if (infoElem) {
                if (selectedSerials.length === 1) {
                    infoElem.textContent = `নির্বাচিত সিরিয়াল: #${selectedSerials[0]}`;
                } else {
                    infoElem.textContent = `নির্বাচিত সিরিয়াল: #${selectedSerials[0]} থেকে #${selectedSerials[selectedSerials.length - 1]} (${selectedSerials.length} জন)`;
                }
            }
        } else {
            patientCards.forEach(card => {
                const badge = card.querySelector('.serial-badge');
                if (badge) badge.textContent = `সিরিয়াল: -`;
            });
            const infoElem = document.getElementById('selectedSerialInfo');
            if (infoElem) infoElem.textContent = '';
        }
    }

    createAgeString(years, months, days) {
        let parts = [];
        const y = parseInt(years) || 0;
        const m = parseInt(months) || 0;
        const d = parseInt(days) || 0;

        if (y > 0) parts.push(`${y} বছর`);
        if (m > 0) parts.push(`${m} মাস`);
        if (d > 0) parts.push(`${d} দিন`);

        return parts.length > 0 ? parts.join(' ') : '০ বছর';
    }

    async handleSubmit() {
        if (!this.db) return this.showAlert('ডেটাবেস সংযোগ নেই', 'error');

        const dateVal = document.getElementById('quickDate').value;
        const serviceVal = document.getElementById('serviceType').value;
        const typeVal = document.getElementById('patientTypeSelect').value;
        const timeVal = document.getElementById('quickTime').value;
        const startSerial = parseInt(document.getElementById('quickSerialInput').value);
        const skipPhone = document.getElementById('skipPhoneCheckbox')?.checked;
        const phoneVal = document.getElementById('quickPhone')?.value.trim();

        if (!dateVal || !serviceVal || !typeVal || !timeVal || isNaN(startSerial)) {
            return this.showAlert('অনুগ্রহ করে তারিখ, সেবা, ধরন, সময় এবং সিরিয়াল সঠিকভাবে নির্বাচন করুন', 'error');
        }

        if (!skipPhone && (!phoneVal || phoneVal.length < 11)) {
            return this.showAlert('অনুগ্রহ করে সঠিক ১১ ডিজিটের ফোন নম্বর লিখুন', 'error');
        }

        const container = document.getElementById('patientsContainer');
        const cards = container ? container.querySelectorAll('.patient-card') : [];
        const patientsData = [];

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const name = card.querySelector('.patient-name')?.value.trim();
            const y = parseInt(card.querySelector('.patient-age-years')?.value) || 0;
            const m = parseInt(card.querySelector('.patient-age-months')?.value) || 0;
            const d = parseInt(card.querySelector('.patient-age-days')?.value) || 0;

            if (!name) {
                return this.showAlert(`অনুগ্রহ করে রোগী #${i + 1} এর নাম লিখুন`, 'error');
            }

            patientsData.push({ name, years: y, months: m, days: d });
        }

        const submitBtn = document.getElementById('quickSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'সংরক্ষণ করা হচ্ছে...';

        try {
            const formData = {
                date: dateVal,
                day: this.getDayNameBangla(dateVal),
                service: serviceVal,
                type: typeVal,
                time: timeVal,
                startSerial: startSerial,
                phone: skipPhone ? '-' : phoneVal,
                patients: patientsData
            };

            if (this.isEditMode) {
                await this.updateInFirebase(this.editDocId, this.originalData, formData);
            } else {
                await this.saveToFirebase(formData);
            }

            this.closeModal();
            this.showAlert(this.isEditMode ? 'অ্যাপয়েন্টমেন্ট সফলভাবে হালনাগাদ করা হয়েছে!' : `${patientsData.length} টি অ্যাপয়েন্টমেন্ট সফলভাবে সংরক্ষণ করা হয়েছে!`, 'success');

        } catch (e) {
            console.error("❌ Quick modal submit error:", e);
            this.showAlert('সংরক্ষণ করতে সমস্যা হয়েছে: ' + e.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = this.isEditMode ? 'হালনাগাদ করুন' : 'সংরক্ষণ করুন';
        }
    }

    async saveToFirebase(data) {
        const yymmdd = this.getYYMMDD(data.date);
        const typeFolder = (data.type === 'new' || data.type === 'নতুন') ? 'new' : 'old';

        for (let i = 0; i < data.patients.length; i++) {
            const patient = data.patients[i];
            const currentSerial = data.startSerial + i;
            const formattedSerial = String(currentSerial).padStart(2, '0');
            const customDocId = `${yymmdd}-${formattedSerial}`;

            const ageStr = this.createAgeString(patient.years, patient.months, patient.days);

            const appointmentData = {
                appointmentId: customDocId,
                name: patient.name,
                phone: data.phone,
                ageYears: patient.years,
                ageMonths: patient.months,
                ageDays: patient.days,
                ageString: ageStr,
                ageDisplay: ageStr,
                patientType: data.type,
                type: data.type,
                serviceType: data.service,
                service: data.service,
                date: data.date,
                appointmentDate: data.date,
                day: data.day,
                time: data.time,
                serial: currentSerial,
                timestamp: this.firebase ? this.firebase.firestore.FieldValue.serverTimestamp() : new Date(),
                status: 'confirmed',
                called: false,
                tokenGiven: false,
                bookedBy: 'admin'
            };

            const docRef = this.db.collection('appointments')
                .doc(yymmdd)
                .collection(typeFolder)
                .doc(customDocId);

            const snap = await docRef.get();
            if (snap.exists) {
                throw new Error(`সিরিয়াল #${currentSerial} ইতিমধ্যে বুক করা হয়েছে!`);
            }

            await docRef.set(appointmentData);
        }
    }

    async updateInFirebase(oldDocId, oldData, newData) {
        const oldYYMMDD = this.getYYMMDD(oldData.date || oldData.appointmentDate);
        const oldTypeFolder = (oldData.patientType === 'new' || oldData.type === 'new') ? 'new' : 'old';

        const newYYMMDD = this.getYYMMDD(newData.date);
        const newTypeFolder = (newData.type === 'new' || newData.type === 'নতুন') ? 'new' : 'old';
        const formattedSerial = String(newData.startSerial).padStart(2, '0');
        const newDocId = `${newYYMMDD}-${formattedSerial}`;

        const patient = newData.patients[0];
        const ageStr = this.createAgeString(patient.years, patient.months, patient.days);

        const updatedFields = {
            ...oldData,
            name: patient.name,
            phone: newData.phone,
            ageYears: patient.years,
            ageMonths: patient.months,
            ageDays: patient.days,
            ageString: ageStr,
            ageDisplay: ageStr,
            patientType: newData.type,
            type: newData.type,
            serviceType: newData.service,
            service: newData.service,
            date: newData.date,
            appointmentDate: newData.date,
            day: newData.day,
            time: newData.time,
            serial: newData.startSerial,
            updatedAt: this.firebase ? this.firebase.firestore.FieldValue.serverTimestamp() : new Date()
        };

        const oldRef = this.db.collection('appointments').doc(oldYYMMDD).collection(oldTypeFolder).doc(oldDocId);
        const newRef = this.db.collection('appointments').doc(newYYMMDD).collection(newTypeFolder).doc(newDocId);

        if (oldYYMMDD === newYYMMDD && oldTypeFolder === newTypeFolder && oldDocId === newDocId) {
            await oldRef.update(updatedFields);
        } else {
            await oldRef.delete();
            await newRef.set(updatedFields);
        }
    }
}

if (typeof window !== 'undefined') {
    window.QuickModal = QuickModal;
    window.QuickModalSystem = QuickModal;
    console.log("✅ QuickModal registered on window");
}
