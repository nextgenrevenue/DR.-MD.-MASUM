// =======================================================
// quick-modal.js - Complete Quick Modal (Fixed & Integrated)
// =======================================================

class QuickModal {
    constructor(db, adminSessionId, showAlert) {
        this.db = db;
        this.adminSessionId = adminSessionId;
        this.showAlert = showAlert;
        this.gridSystem = null;
        this.pendingSelections = {};
        this.timeSlots = [];
        this.serialRanges = {};
        this.currentEditDocId = null;
        this.currentEditTime = null;
        
        // Firebase reference
        this.firebase = window.firebase || firebase;
        
        // মোডাল তৈরি ও এলিমেন্ট ইনিশিয়ালাইজ
        this.createModalHTML();
        this.initializeElements();
    }
    
    // =======================================================
    // ১. মোডাল HTML ডাইনামিকভাবে তৈরি
    // =======================================================
    createModalHTML() {
        if (document.getElementById('quickSerialModal')) {
            return;
        }
        
        const modalHTML = `
        <div class="modal" id="quickSerialModal">
            <div class="modal-content">
                <h2 style="margin-bottom: 20px; color: var(--dark);">সিরিয়াল যুক্ত করুন</h2>
                <button class="close-btn" id="closeQuickModal">&times;</button>
                
                <form id="quickSerialForm">
                    <!-- তারিখ পিকার -->
                    <div class="form-group">
                        <label for="quickDate">তারিখ</label>
                        <input type="date" id="quickDate" required class="full-width-input">
                    </div>
                    
                    <!-- রোগীর ধরন -->
                    <div class="form-group">
                        <label for="patientTypeSelect">রোগীর ধরন</label>
                        <div class="input-field">
                            <select id="patientTypeSelect" name="patientType" required class="form-select">
                                <option value="">-- নির্বাচন করুন --</option>
                                <option value="new">নতুন রোগী</option>
                                <option value="old">পুরাতন রোগী</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- সার্ভিস এবং সময় -->
                    <div class="form-row responsive-row">
                        <div class="form-group form-col">
                            <label for="serviceType">সেবার ধরন</label>
                            <div class="input-field">
                                <select id="serviceType" name="serviceType" required class="form-select">
                                    <option value="">-- সেবা নির্বাচন করুন --</option>
                                    <option value="general">সাধারণ</option>
                                    <option value="microneedling">মাইক্রোনিডলিং</option>
                                    <option value="prp">পি আর পি</option>
                                    <option value="electrocautery">ইলেক্ট্রোক্যাটারি</option>
                                    <option value="cryosurgery">ক্রায়োসার্জারি</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group form-col">
                            <label for="quickTime">সময়</label>
                            <div class="input-field">
                                <select id="quickTime" name="quickTime" required disabled class="form-select">
                                    <option value="">-- সময় লোড হচ্ছে --</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- সিরিয়াল গ্রিড -->
                    <div class="form-group">
                        <label>সিরিয়াল নির্বাচন করুন</label>
                        <div class="serial-grid" id="serialGrid"></div>
                        <input type="hidden" id="serialInput" value="">
                        <small style="color: var(--gray); font-size: 12px; display: block; margin-top: 5px;">
                            💡 প্রতিটি রোগীর জন্য আলাদা সিরিয়ালে ক্লিক করুন
                        </small>
                    </div>
          
                    <!-- 👥 একাধিক রোগীর তথ্য সেকশন -->
                    <div class="form-group">
                        <label style="display: flex; justify-content: space-between; align-items: center;">
                            <span>👥 রোগীর তথ্য</span>
                            <button type="button" id="addPatientBtn" class="btn-add-patient" style="padding: 5px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-plus"></i> আরও রোগী যোগ করুন
                            </button>
                        </label>
                        
                        <div id="patientsContainer">
                            <div class="patient-card active" data-patient-index="0" style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 2px solid #3b82f6;">
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <input type="text" class="patient-name" placeholder="রোগীর নাম *" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;" required onblur="window.formatName ? window.formatName(this) : null">
                                        <button type="button" class="remove-patient-btn" style="background: #ef4444; color: white; border: none; border-radius: 6px; width: 38px; height: 38px; cursor: pointer; display: none; align-items: center; justify-content: center;">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>

                                    <div style="display: flex; gap: 8px;">
                                        <input type="number" class="patient-age-years" min="0" max="120" placeholder="বছর" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                                        <input type="number" class="patient-age-months" min="0" max="11" placeholder="মাস" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                                        <input type="number" class="patient-age-days" min="0" max="30" placeholder="দিন" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                                    </div>
                                </div>

                                <div class="selected-serial-display" style="margin-top: 12px; font-size: 12px; color: #2563eb; display: none; background: #dbeafe; padding: 6px 10px; border-radius: 6px;">
                                    📍 সিলেক্টেড সিরিয়াল: <span class="serial-numbers">—</span>
                                </div>
                            </div>
                        </div>
                    </div>
          
                    <!-- ফোন ফিল্ড -->
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="skipPhoneCheckbox" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>ফোন নম্বর ছাড়া বুকিং করুন</span>
                        </label>
                        <div id="phoneFieldContainer" style="margin-top: 8px;">
                            <input type="tel" id="quickPhone" placeholder="01XXXXXXXXX" pattern="01[0-9]{9}" title="বাংলাদেশের ১১ ডিজিটের মোবাইল নম্বর লিখুন" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px;">
                            <small style="color: var(--gray); font-size: 12px;">📱 ফোন নম্বর দিন অথবা উপরের চেকবক্স টিক দিন</small>
                        </div>
                    </div>
          
                    <div class="form-actions">
                        <button type="button" class="cancel-btn-modal" id="cancelQuickModal">বাতিল</button>
                        <button type="submit" class="submit-btn" id="submitQuickBtn">সিরিয়াল যুক্ত করুন</button>
                    </div>
                </form>
            </div>
        </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addModalStyles();
        this.addExtraStyles();
    }

    // =======================================================
    // ২. মাল্টি পেশেন্ট মেথডসমূহ
    // =======================================================
    addPatientField() {
        const container = this.elements.patientsContainer;
        if (!container) return;
        
        const patientCount = container.children.length;
        const patientDiv = document.createElement('div');
        patientDiv.className = 'patient-card';
        patientDiv.setAttribute('data-patient-index', patientCount);
        patientDiv.style.cssText = 'background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb;';
        
        patientDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" class="patient-name" placeholder="রোগীর নাম *" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;" required onblur="window.formatName ? window.formatName(this) : null">
                    <button type="button" class="remove-patient-btn" style="background: #ef4444; color: white; border: none; border-radius: 6px; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="number" class="patient-age-years" min="0" max="120" placeholder="বছর" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                    <input type="number" class="patient-age-months" min="0" max="11" placeholder="মাস" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                    <input type="number" class="patient-age-days" min="0" max="30" placeholder="দিন" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                </div>
            </div>
            <div class="selected-serial-display" style="margin-top: 12px; font-size: 12px; color: #2563eb; display: none; background: #dbeafe; padding: 6px 10px; border-radius: 6px;">
                📍 সিলেক্টেড সিরিয়াল: <span class="serial-numbers">—</span>
            </div>
        `;
        
        container.appendChild(patientDiv);

        const removeBtn = patientDiv.querySelector('.remove-patient-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePatientField(patientDiv);
            });
        }

        patientDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-patient-btn')) {
                this.setActivePatient(patientDiv);
            }
        });
        
        this.updatePatientIndices();
        this.setActivePatient(patientDiv);
    }

    removePatientField(patientDiv) {
        const container = this.elements.patientsContainer;
        if (!container || container.querySelectorAll('.patient-card').length === 1) {
            this.showAlert('কমপক্ষে একজন রোগী থাকতে হবে', 'warning');
            return;
        }
        
        patientDiv.remove();
        this.updatePatientIndices();
        
        const firstPatient = container.querySelector('.patient-card');
        if (firstPatient) {
            this.setActivePatient(firstPatient);
        }
    }

    setActivePatient(patientDiv) {
        const cards = this.elements.patientsContainer?.querySelectorAll('.patient-card');
        cards?.forEach(card => {
            card.classList.remove('active');
            card.style.background = '#f9fafb';
            card.style.border = '1px solid #e5e7eb';
        });
        
        patientDiv.classList.add('active');
        patientDiv.style.background = '#eff6ff';
        patientDiv.style.border = '2px solid #3b82f6';
        
        const patientIndex = parseInt(patientDiv.getAttribute('data-patient-index'));
        if (this.gridSystem && typeof this.gridSystem.setCurrentPatientIndex === 'function') {
            this.gridSystem.setCurrentPatientIndex(patientIndex);
            this.updateAllSerialDisplays();
        }
    }

updatePatientIndices() {
    const cards = this.elements.patientsContainer?.querySelectorAll('.patient-card');
    cards?.forEach((card, index) => {
        card.setAttribute('data-patient-index', index);
        const removeBtn = card.querySelector('.remove-patient-btn');
        if (removeBtn) {
            removeBtn.style.display = index > 0 ? 'flex' : 'none';
        }
    });
}

    updateAllSerialDisplays() {
        if (!this.gridSystem) return;
        
        const cards = this.elements.patientsContainer?.querySelectorAll('.patient-card');
        cards?.forEach((patient, index) => {
            const serials = this.gridSystem.getSerialsForPatient ? this.gridSystem.getSerialsForPatient(index) : [];
            const displayDiv = patient.querySelector('.selected-serial-display');
            const serialSpan = patient.querySelector('.serial-numbers');
            
            if (displayDiv && serialSpan) {
                if (serials && serials.length > 0) {
                    serialSpan.textContent = serials.join(', ');
                    displayDiv.style.display = 'block';
                } else {
                    serialSpan.textContent = '—';
                    displayDiv.style.display = 'none';
                }
            }
        });
    }

    getAllPatientsData() {
        const cards = this.elements.patientsContainer?.querySelectorAll('.patient-card');
        const patientsData = [];
        
        cards?.forEach((patient, index) => {
            const nameInput = patient.querySelector('.patient-name');
            const yearsInput = patient.querySelector('.patient-age-years');
            const monthsInput = patient.querySelector('.patient-age-months');
            const daysInput = patient.querySelector('.patient-age-days');
            
            patientsData.push({
                index: index,
                name: nameInput ? nameInput.value.trim() : '',
                years: parseInt(yearsInput?.value) || 0,
                months: parseInt(monthsInput?.value) || 0,
                days: parseInt(daysInput?.value) || 0
            });
        });
        
        return patientsData;
    }

    getCommonPhoneNumber() {
        const skipPhone = this.elements.skipPhoneCheckbox?.checked;
        if (skipPhone) return null;
        
        const phone = this.elements.quickPhone?.value.trim();
        if (!phone || !/^01[0-9]{9}$/.test(phone)) return null;
        
        return phone;
    }

    // =======================================================
    // ৩. DOM উপাদান ইনিশিয়ালাইজ
    // =======================================================
    initializeElements() {
        this.elements = {
            quickSerialModal: document.getElementById('quickSerialModal'),
            closeQuickModal: document.getElementById('closeQuickModal'),
            cancelQuickModal: document.getElementById('cancelQuickModal'),
            quickSerialForm: document.getElementById('quickSerialForm'),
            quickDate: document.getElementById('quickDate'),
            quickTime: document.getElementById('quickTime'),
            serviceType: document.getElementById('serviceType'),
            patientTypeSelect: document.getElementById('patientTypeSelect'),
            serialGrid: document.getElementById('serialGrid'),
            serialInput: document.getElementById('serialInput'),
            patientsContainer: document.getElementById('patientsContainer'),
            addPatientBtn: document.getElementById('addPatientBtn'),
            skipPhoneCheckbox: document.getElementById('skipPhoneCheckbox'),
            phoneFieldContainer: document.getElementById('phoneFieldContainer'),
            quickPhone: document.getElementById('quickPhone'),
            submitQuickBtn: document.getElementById('submitQuickBtn')
        };
    }
    
    initialize() {
        console.log("🟢 QuickModal initializing...");
        if (!this.elements.quickSerialModal) {
            console.error("❌ Quick modal elements not found");
            return false;
        }
        this.setupEventListeners();
        console.log("✅ QuickModal initialized successfully");
        return true;
    }
    
    // =======================================================
    // ৪. ইভেন্ট লিসেনার সেটআপ
    // =======================================================
    setupEventListeners() {
        if (this.elements.closeQuickModal) {
            this.elements.closeQuickModal.addEventListener('click', () => this.closeModal());
        }
        
        if (this.elements.cancelQuickModal) {
            this.elements.cancelQuickModal.addEventListener('click', () => this.closeModal());
        }
        
        if (this.elements.quickSerialForm) {
            this.elements.quickSerialForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitForm();
            });
        }
        
        if (this.elements.addPatientBtn) {
            this.elements.addPatientBtn.addEventListener('click', () => this.addPatientField());
        }

        if (this.elements.skipPhoneCheckbox) {
            this.elements.skipPhoneCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                if (this.elements.phoneFieldContainer) {
                    this.elements.phoneFieldContainer.style.display = isChecked ? 'none' : 'block';
                }
                if (this.elements.quickPhone) {
                    this.elements.quickPhone.required = !isChecked;
                }
            });
        }
        
        if (this.elements.quickDate) {
            this.elements.quickDate.addEventListener('change', () => this.loadAvailableTimes());
        }
        
        if (this.elements.serviceType) {
            this.elements.serviceType.addEventListener('change', () => this.loadAvailableTimes());
        }
        
        if (this.elements.patientTypeSelect) {
            this.elements.patientTypeSelect.addEventListener('change', () => this.updateGrid());
        }
        
        if (this.elements.quickTime) {
            this.elements.quickTime.addEventListener('change', () => this.updateGrid());
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.quickSerialModal) {
                this.closeModal();
            }
        });

        const firstPatientCard = this.elements.patientsContainer?.querySelector('.patient-card');
        if (firstPatientCard) {
            firstPatientCard.addEventListener('click', (e) => {
                if (!e.target.closest('.remove-patient-btn')) {
                    this.setActivePatient(firstPatientCard);
                }
            });
        }
    }
    
    // =======================================================
    // ৫. Firebase থেকে সময় লোড
    // =======================================================
    async loadSerialRanges() {
        if (!this.db) {
            console.error("❌ Firebase DB নেই");
            return;
        }
        try {
            const doc = await this.db.collection('settings').doc('serialRanges').get();
            if (doc.exists) {
                this.serialRanges = doc.data();
            } else {
                this.serialRanges = {};
            }
            this.loadAvailableTimes();
        } catch (error) {
            console.error("❌ সিরিয়াল রেঞ্জ লোড করতে সমস্যা:", error);
        }
    }
    
    async loadAvailableTimes() {
        const date = this.elements.quickDate.value;
        const service = this.elements.serviceType.value;
        
        if (!date || !service) {
            this.elements.quickTime.innerHTML = '<option value="">-- প্রথমে তারিখ ও সার্ভিস নির্বাচন করুন --</option>';
            this.elements.quickTime.disabled = true;
            return;
        }
        
        const selectedDate = new Date(date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const englishDay = days[selectedDate.getDay()];
        
        const dayData = this.serialRanges[englishDay];
        if (!dayData) {
            this.elements.quickTime.innerHTML = '<option value="">-- এই দিনে কোনো সিরিয়াল নেই --</option>';
            this.elements.quickTime.disabled = true;
            this.clearGrid();
            return;
        }
        
        const serviceData = dayData[service];
        if (!serviceData) {
            this.elements.quickTime.innerHTML = '<option value="">-- এই সার্ভিসের জন্য কোনো সময় নেই --</option>';
            this.elements.quickTime.disabled = true;
            this.clearGrid();
            return;
        }
        
        const allTimes = new Set();
        if (serviceData['new']) Object.keys(serviceData['new']).forEach(time => allTimes.add(time));
        if (serviceData['old']) Object.keys(serviceData['old']).forEach(time => allTimes.add(time));
        
        if (allTimes.size === 0) {
            this.elements.quickTime.innerHTML = '<option value="">-- কোনো সময় উপলব্ধ নেই --</option>';
            this.elements.quickTime.disabled = true;
            this.clearGrid();
            return;
        }
        
        const sortedTimes = Array.from(allTimes).sort((a, b) => {
            const timeToMinutes = (timeStr) => {
                const [time, modifier] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (modifier === 'PM' && hours !== 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                return hours * 60 + (minutes || 0);
            };
            return timeToMinutes(a) - timeToMinutes(b);
        });
        
        this.elements.quickTime.innerHTML = '<option value="">-- সময় নির্বাচন করুন --</option>';
        sortedTimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            this.elements.quickTime.appendChild(option);
        });
        
        this.elements.quickTime.disabled = false;
        
        if (sortedTimes.length > 0) {
            this.elements.quickTime.value = sortedTimes[0];
            this.updateGrid();
        }
    }
    
    // =======================================================
    // ৬. মোডাল ওপেন/ক্লোজ
    // =======================================================
    async openModal() {
        this.setDefaultDate();
        this.resetForm();
        await this.loadSerialRanges();
        this.elements.quickSerialModal.style.display = 'flex';
        this.initializeSimpleGrid();
    }
    
async openEditModal(docId, data) {
    // ১. আগের Doc ID এবং সম্পূর্ণ Data অবজেক্ট স্টোর করে রাখা
    this.currentEditDocId = docId;
    this.currentEditData = data; 
    
    await this.setEditFormData(docId, data);
    this.elements.quickSerialModal.style.display = 'flex';
    
    const modalTitle = document.querySelector('#quickSerialModal h2');
    if (modalTitle) modalTitle.textContent = 'সিরিয়াল এডিট করুন';
    if (this.elements.submitQuickBtn) this.elements.submitQuickBtn.textContent = 'আপডেট করুন';
    
    await this.loadSerialRanges();
    this.initializeSimpleGrid();
}
    
    closeModal() {
        this.elements.quickSerialModal.style.display = 'none';
        this.resetForm();
    }
    
    // =======================================================
    // ৭. সরল গ্রিড সিস্টেম
    // =======================================================
    async initializeSimpleGrid() {
        const date = this.elements.quickDate.value;
        const time = this.elements.quickTime.value;
        const service = this.elements.serviceType.value;
        const type = this.elements.patientTypeSelect.value;
        
        if (!date || !time || !service || !type) {
            this.showGridMessage('অনুগ্রহ করে সব তথ্য পূরণ করুন');
            return;
        }
        
        try {
            this.showGridMessage('সিরিয়াল লোড হচ্ছে...');
            
            const selectedDate = new Date(date);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const englishDay = days[selectedDate.getDay()];
            
            const dayData = this.serialRanges[englishDay];
            if (!dayData) {
                this.showGridMessage('এই দিনে কোনো সিরিয়াল নেই');
                return;
            }
            
            const serviceData = dayData[service];
            if (!serviceData) {
                this.showGridMessage(`"${service}" সার্ভিসের জন্য সিরিয়াল নেই`);
                return;
            }
            
            const typeData = serviceData[type];
            if (!typeData) {
                const typeText = type === 'new' ? 'নতুন রোগী' : 'পুরাতন রোগী';
                this.showGridMessage(`"${typeText}" এর জন্য সিরিয়াল নেই`);
                return;
            }
            
            const timeRange = typeData[time];
            if (!timeRange || !Array.isArray(timeRange) || timeRange.length !== 2) {
                this.showGridMessage(`"${time}" সময়ের জন্য সিরিয়াল রেঞ্জ নেই`);
                return;
            }
            
            const [startSerial, endSerial] = timeRange;
            
            const appointmentsSnapshot = await this.db.collection('appointments')
                .where('date', '==', date)
                .where('time', '==', time)
                .get();
            
            const bookedSerials = [];
            appointmentsSnapshot.forEach(doc => {
                const data = doc.data();
                const appointmentType = data.patientType || data.type;
                if (appointmentType === type && data.serial) {
                    bookedSerials.push(data.serial);
                }
            });
            
            const now = new Date();
            const pendingSnapshot = await this.db.collection('pendingSelections')
                .where('date', '==', date)
                .where('time', '==', time)
                .get();
            
            const pendingSerials = [];
            pendingSnapshot.forEach(doc => {
                const data = doc.data();
                const expiresAt = data.expiresAt ? data.expiresAt.toDate() : null;
                const pendingType = data.type || 'new';
                if (expiresAt && expiresAt > now && pendingType === type) {
                    pendingSerials.push(data.serial);
                }
            });
            
            this.renderGrid(startSerial, endSerial, bookedSerials, pendingSerials);
            
        } catch (error) {
            console.error("❌ গ্রিড লোড ত্রুটি:", error);
            this.showGridMessage(`গ্রিড লোড করতে সমস্যা: ${error.message}`);
        }
    }

    renderGrid(start, end, bookedSerials, pendingSerials) {
    this.elements.serialGrid.innerHTML = '';
    
    const totalSerials = end - start + 1;
    if (totalSerials <= 0) {
        this.showGridMessage('সিরিয়াল রেঞ্জ সঠিক নয়');
        return;
    }
    
    const selectedSerial = parseInt(this.elements.serialInput.value) || null;
    const patientCount = this.elements.patientsContainer?.querySelectorAll('.patient-card').length || 1;
    const endSelectedSerial = selectedSerial ? selectedSerial + patientCount - 1 : null;

    for (let serial = start; serial <= end; serial++) {
        const serialItem = document.createElement('div');
        serialItem.className = 'serial-item';
        serialItem.textContent = serial;
        serialItem.dataset.serial = serial;
        serialItem.setAttribute('tabindex', '-1');
        
        const isSelected = selectedSerial && (serial >= selectedSerial && serial <= endSelectedSerial);

        if (bookedSerials.includes(serial)) {
            serialItem.classList.add('booked');
            serialItem.title = `সিরিয়াল ${serial} - ইতিমধ্যে বুক করা হয়েছে`;
        } else if (pendingSerials.includes(serial)) {
            serialItem.classList.add('pending');
            serialItem.title = `সিরিয়াল ${serial} - অন্য ব্যবহারকারী নির্বাচন করেছে`;
        } else if (isSelected) {
            serialItem.classList.add('selected');
            serialItem.title = `সিরিয়াল ${serial} - আপনার নির্বাচিত`;
        } else {
            serialItem.classList.add('available');
            serialItem.title = `সিরিয়াল ${serial} - খালি (নির্বাচন করতে ক্লিক করুন)`;
            
            serialItem.addEventListener('click', () => {
                this.selectSerial(serial, serialItem);
            });
        }
        
        this.elements.serialGrid.appendChild(serialItem);
    }
}

selectSerial(serial, element) {
    this.elements.serialInput.value = serial;
    
    const patientCount = this.elements.patientsContainer?.querySelectorAll('.patient-card').length || 1;
    const endSerial = serial + patientCount - 1;
    
    const allItems = this.elements.serialGrid.querySelectorAll('.serial-item');
    allItems.forEach(item => {
        const itemSerial = parseInt(item.dataset.serial);
        if (!item.classList.contains('booked') && !item.classList.contains('pending')) {
            if (itemSerial >= serial && itemSerial <= endSerial) {
                item.classList.remove('available');
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
                item.classList.add('available');
            }
        }
    });

    this.updatePatientSerialDisplay(serial);
}

    showGridMessage(message) {
        this.elements.serialGrid.innerHTML = `<div class="grid-no-selection">${message}</div>`;
    }

    clearGrid() {
        this.elements.serialGrid.innerHTML = `<div class="grid-no-selection">📅 তারিখ, 🔧 সার্ভিস এবং ⏰ সময় নির্বাচন করুন</div>`;
        this.elements.serialInput.value = '';
    }

    updatePatientSerialDisplay(startSerial) {
    const cards = this.elements.patientsContainer?.querySelectorAll('.patient-card');
    cards?.forEach((patient, index) => {
        const displayDiv = patient.querySelector('.selected-serial-display');
        const serialSpan = patient.querySelector('.serial-numbers');
        
        if (displayDiv && serialSpan) {
            if (startSerial) {
                const assignedSerial = patient.selectedSerial || (startSerial + index);
                serialSpan.textContent = assignedSerial;
                displayDiv.style.display = 'block';
            } else {
                serialSpan.textContent = '—';
                displayDiv.style.display = 'none';
            }
        }
    });
}

    // =======================================================
    // ৮. ডাটা সাবমিট ও Firebase সেভ
    // =======================================================
    collectFormData() {
        const dateObj = new Date(this.elements.quickDate.value);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const englishDay = days[dateObj.getDay()];
        
        const banglaDays = {
            'Sunday': 'রবিবার', 'Monday': 'সোমবার', 'Tuesday': 'মঙ্গলবার',
            'Wednesday': 'বুধবার', 'Thursday': 'বৃহস্পতিবার', 'Friday': 'শুক্রবার', 'Saturday': 'শনিবার'
        };

        return {
            date: this.elements.quickDate.value,
            day: banglaDays[englishDay],
            time: this.elements.quickTime.value,
            service: this.elements.serviceType.value,
            type: this.elements.patientTypeSelect.value,
            serial: parseInt(this.elements.serialInput.value),
            phone: this.getCommonPhoneNumber(),
            patients: this.getAllPatientsData()
        };
    }

    validateFormData(data) {
        if (!data.date) return { isValid: false, message: 'তারিখ নির্বাচন করুন' };
        if (!data.type) return { isValid: false, message: 'রোগীর ধরন নির্বাচন করুন' };
        if (!data.service) return { isValid: false, message: 'সার্ভিস নির্বাচন করুন' };
        if (!data.time) return { isValid: false, message: 'সময় নির্বাচন করুন' };
        if (!data.serial || isNaN(data.serial)) return { isValid: false, message: 'সিরিয়াল নির্বাচন করুন' };

        const skipPhone = this.elements.skipPhoneCheckbox?.checked;
        if (!skipPhone && !data.phone) {
            return { isValid: false, message: 'সঠিক ১১ ডিজিটের ফোন নম্বর দিন অথবা স্কিপ করুন' };
        }

        if (data.patients.length === 0) return { isValid: false, message: 'কমপক্ষে একজন রোগীর তথ্য দিন' };

        for (let p of data.patients) {
            if (!p.name) return { isValid: false, message: 'সকল রোগীর নাম সঠিকভাবে লিখুন' };
            if (p.years === 0 && p.months === 0 && p.days === 0) {
                return { isValid: false, message: `${p.name}-এর বয়স প্রদান করুন` };
            }
        }
        
        return { isValid: true, message: '' };
    }

// ১. YYMMDD ফরম্যাট তৈরি করার হেলপার মেথড
getYYMMDD(dateString) {
    const d = new Date(dateString);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
}

// ২. আপডেট করা saveToFirebase মেথড
async saveToFirebase(data) {
    const yymmdd = this.getYYMMDD(data.date);
    const patientType = (data.type || data.patientType).toLowerCase(); // 'new' অথবা 'old'

    // প্রতিটি রোগীর জন্য আলাদা অ্যাপয়েন্টমেন্ট সেভ
    for (let i = 0; i < data.patients.length; i++) {
        const patient = data.patients[i];
        const currentSerial = data.serial + i; // পর পর সিরিয়াল সংখ্যা বরাদ্দ
        const customDocId = `${yymmdd}-${currentSerial}`; // উদাহরণ: 260806-05

        // নির্দিষ্ট নেস্টেড পাথ: appointments/{yymmdd}/{new or old}/{yymmdd-serial}
        const docRef = this.db.collection('appointments')
            .doc(yymmdd)
            .collection(patientType)
            .doc(customDocId);

        // সিরিয়ালটি আগেই বুকড কি না তা সরাসরি Document Exist চেক করে দেখা
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            throw new Error(`সিরিয়াল #${currentSerial} (${patientType.toUpperCase()}) ইতিমধ্যে বুক করা আছে!`);
        }

        const appointmentData = {
            name: patient.name,
            age: this.createAgeString(patient.years, patient.months, patient.days),
            ageYears: patient.years,
            ageMonths: patient.months,
            ageDays: patient.days,
            phone: data.phone || null,
            date: data.date,
            day: data.day,
            time: data.time,
            serviceType: data.service,
            patientType: patientType,
            type: patientType,
            serial: currentSerial,
            called: false,
            tokenGiven: false,
            bookedBy: 'admin',
            timestamp: this.firebase.firestore.FieldValue.serverTimestamp()
        };

        // .add() এর জায়গায় .set() ব্যবহার করতে হবে Custom Document ID দেওয়ার জন্য
        await docRef.set(appointmentData);
    }
}

async updateInFirebase(oldDocId, oldData, newData) {
    // ১. পুরোনো তারিখ ও টাইপ থেকে পুরোনো পাথ বের করা
    const oldYymmdd = this.getYYMMDD(oldData.date);
    const oldType = (oldData.type || oldData.patientType).toLowerCase();

    // ২. নতুন তারিখ ও টাইপ থেকে নতুন পাথ বের করা
    const newYymmdd = this.getYYMMDD(newData.date);
    const newType = (newData.type || newData.patientType).toLowerCase();
    const newDocId = `${newYymmdd}-${newData.serial}`;

    const firstPatient = newData.patients[0];
    const updatedFields = {
        name: firstPatient.name,
        age: this.createAgeString(firstPatient.years, firstPatient.months, firstPatient.days),
        ageYears: firstPatient.years,
        ageMonths: firstPatient.months,
        ageDays: firstPatient.days,
        phone: newData.phone || null,
        date: newData.date,
        day: newData.day,
        time: newData.time,
        serviceType: newData.service,
        patientType: newType,
        type: newType,
        serial: newData.serial,
        updatedAt: this.firebase.firestore.FieldValue.serverTimestamp()
    };

    // ৩. যদি তারিখ বা টাইপ পরিবর্তন হয় (পাথ চেঞ্জ হয়েছে)
    if (oldYymmdd !== newYymmdd || oldType !== newType || oldDocId !== newDocId) {
        
        // ক) পুরোনো পাথের ডকুমেন্ট ডিলিট করুন
        await this.db.collection('appointments')
            .doc(oldYymmdd)
            .collection(oldType)
            .doc(oldDocId)
            .delete();

        // খ) নতুন পাথে নতুন ডাটা সেট করুন
        await this.db.collection('appointments')
            .doc(newYymmdd)
            .collection(newType)
            .doc(newDocId)
            .set(updatedFields);

    } else {
        // ৪. পাথ একই থাকলে সরাসরি আগের পাথেই আপডেট করুন
        await this.db.collection('appointments')
            .doc(newYymmdd)
            .collection(newType)
            .doc(oldDocId)
            .update(updatedFields);
    }
}

async submitForm() {
    if (!this.db) {
        this.showAlert('Firebase সংযোগ নেই', 'error');
        return;
    }
    
    const isEditMode = this.elements.submitQuickBtn.textContent === 'আপডেট করুন';
    const formData = this.collectFormData();
    
    const validation = this.validateFormData(formData);
    if (!validation.isValid) {
        this.showAlert(validation.message, 'error');
        return;
    }
    
    try {
        this.setLoadingState(true);
        
        if (isEditMode && this.currentEditDocId) {
            // পরিবর্তন: ৩টি প্যারামিটার পাস করা হচ্ছে (Doc ID, আগের ডাটা, নতুন ফর্মের ডাটা)
            await this.updateInFirebase(this.currentEditDocId, this.currentEditData, formData);
            this.showAlert(`সিরিয়াল #${formData.serial} সফলভাবে আপডেট হয়েছে!`, 'success');
        } else {
            await this.saveToFirebase(formData);
            this.showAlert(`সিরিয়াল সফলভাবে যুক্ত হয়েছে!`, 'success');
        }
        
        this.closeModal();
        
        if (window.tableManager && typeof window.tableManager.applyFilters === 'function') {
            setTimeout(() => window.tableManager.applyFilters(), 500);
        }
        
    } catch (error) {
        console.error('❌ Error saving serial:', error);
        this.showAlert(error.message || 'সিরিয়াল সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
    } finally {
        this.setLoadingState(false);
    }
}

    // =======================================================
    // ৯. ইউটিলিটি ও স্টাইলস
    // =======================================================
    createAgeString(years, months, days) {
        let parts = [];
        if (years > 0) parts.push(`${years} বছর`);
        if (months > 0) parts.push(`${months} মাস`);
        if (days > 0) parts.push(`${days} দিন`);
        return parts.join(', ') || '০ বছর';
    }

    async setEditFormData(docId, data) {
        if (!data) return;
        this.currentEditDocId = docId;
        
        if (this.elements.quickDate) this.elements.quickDate.value = data.date || '';
        if (this.elements.serviceType) this.elements.serviceType.value = data.serviceType || 'general';
        if (this.elements.patientTypeSelect) this.elements.patientTypeSelect.value = data.patientType || data.type || 'new';
        if (this.elements.serialInput) this.elements.serialInput.value = data.serial || '';
        if (this.elements.quickPhone) this.elements.quickPhone.value = data.phone || '';

        const container = this.elements.patientsContainer;
        if (container) {
            container.innerHTML = `
                <div class="patient-card active" data-patient-index="0" style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 2px solid #3b82f6;">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" class="patient-name" value="${data.name || ''}" placeholder="রোগীর নাম *" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;" required>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" class="patient-age-years" value="${data.ageYears || 0}" min="0" max="120" placeholder="বছর" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                            <input type="number" class="patient-age-months" value="${data.ageMonths || 0}" min="0" max="11" placeholder="মাস" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                            <input type="number" class="patient-age-days" value="${data.ageDays || 0}" min="0" max="30" placeholder="দিন" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                        </div>
                    </div>
                </div>
            `;
        }
    }

    setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        if (this.elements.quickDate) {
            this.elements.quickDate.value = formattedDate;
        }
        return formattedDate;
    }

    resetForm() {
        if (this.elements.quickSerialForm) this.elements.quickSerialForm.reset();
        this.elements.serialInput.value = '';
        this.currentEditDocId = null;
        this.setDefaultDate();
        
        if (this.elements.serviceType) this.elements.serviceType.value = 'general';
        if (this.elements.patientTypeSelect) this.elements.patientTypeSelect.value = 'new';
        if (this.elements.quickTime) {
            this.elements.quickTime.innerHTML = '<option value="">-- তারিখ ও সার্ভিস নির্বাচন করুন --</option>';
            this.elements.quickTime.disabled = true;
        }
        
if (this.elements.patientsContainer) {
    this.elements.patientsContainer.innerHTML = `
        <div class="patient-card active" data-patient-index="0" style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 2px solid #3b82f6;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" class="patient-name" placeholder="রোগীর নাম *" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;" required onblur="window.formatName ? window.formatName(this) : null">
                    <button type="button" class="remove-patient-btn" style="background: #ef4444; color: white; border: none; border-radius: 6px; width: 38px; height: 38px; cursor: pointer; display: none; align-items: center; justify-content: center;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="number" class="patient-age-years" min="0" max="120" placeholder="বছর" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                    <input type="number" class="patient-age-months" min="0" max="11" placeholder="মাস" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                    <input type="number" class="patient-age-days" min="0" max="30" placeholder="দিন" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px;">
                </div>
            </div>
            <!-- 🟢 ১ম কার্ডের জন্য সিলেক্টেড সিরিয়াল ডিসপ্লে যুক্ত করা হয়েছে -->
            <div class="selected-serial-display" style="margin-top: 12px; font-size: 12px; color: #2563eb; display: none; background: #dbeafe; padding: 6px 10px; border-radius: 6px;">
                📍 সিলেক্টেড সিরিয়াল: <span class="serial-numbers">—</span>
            </div>
        </div>
    `;
}

        this.clearGrid();
        this.updatePatientSerialDisplay(null);
        
        const modalTitle = document.querySelector('#quickSerialModal h2');
        if (modalTitle) modalTitle.textContent = 'সিরিয়াল যুক্ত করুন';
        if (this.elements.submitQuickBtn) this.elements.submitQuickBtn.textContent = 'সিরিয়াল যুক্ত করুন';
    }


    setLoadingState(isLoading) {
        if (!this.elements.submitQuickBtn) return;
        if (isLoading) {
            this.elements.submitQuickBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্রক্রিয়া হচ্ছে...';
            this.elements.submitQuickBtn.disabled = true;
        } else {
            const text = this.currentEditDocId ? 'আপডেট করুন' : 'সিরিয়াল যুক্ত করুন';
            this.elements.submitQuickBtn.innerHTML = text;
            this.elements.submitQuickBtn.disabled = false;
        }
    }

    updateGrid() {
        this.initializeSimpleGrid();
    }

    addExtraStyles() {
        const extraStyles = `
        <style>
        .form-col { flex: 1; min-width: 0; }
        .full-width-input, .form-select { width: 100%; box-sizing: border-box; }
        .responsive-row { display: flex; flex-wrap: nowrap; }
        @media (max-width: 768px) {
            .responsive-row { flex-wrap: nowrap; overflow: hidden; }
            .form-col { flex: 1 1 auto; min-width: 120px; }
            @media (max-width: 400px) {
                .responsive-row { flex-wrap: wrap; }
                .form-col { flex: 1 1 100%; margin-bottom: 10px; }
            }
        }
        </style>
        `;
        document.head.insertAdjacentHTML('beforeend', extraStyles);
    }

    addModalStyles() {
        if (document.getElementById('quickModalStyles')) return;
        const styles = `
        <style id="quickModalStyles">
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 2000; justify-content: center; align-items: center; }
        .modal-content { background-color: white; padding: 25px; border-radius: 12px; width: 90%; max-width: 550px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); position: relative; max-height: 90vh; overflow-y: auto; }
        .close-btn { position: absolute; top: 20px; right: 25px; background: none; border: none; font-size: 28px; cursor: pointer; }
        .form-group { margin-bottom: 20px; }
        .form-row { display: flex; gap: 15px; margin-bottom: 20px; align-items: flex-end; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
        .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; }
        .serial-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 8px; margin: 10px 0; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; max-height: 250px; overflow-y: auto; }
        .serial-item { padding: 8px 5px; border: 2px solid transparent; border-radius: 6px; text-align: center; font-weight: 500; font-size: 13px; cursor: pointer; }
        .serial-item.available { background-color: #dcfce7; color: #16a34a; border-color: #16a34a; }
        .serial-item.booked { background-color: #fecaca; color: #dc2626; border-color: #dc2626; cursor: not-allowed; opacity: 0.8; pointer-events: none; }
        .serial-item.pending { background-color: #dbeafe; color: #3b82f6; border-color: #3b82f6; cursor: not-allowed; opacity: 0.7; pointer-events: none; }
        .serial-item.selected { background-color: #fef3c7; color: #f59e0b; border-color: #f59e0b; font-weight: 700; }
        .grid-no-selection { grid-column: 1 / -1; text-align: center; padding: 20px; color: #6b7280; }
        .form-actions { display: flex; gap: 10px; margin-top: 25px; }
        .form-actions button { flex: 1; padding: 12px; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 600; border: none; }
        .submit-btn { background-color: #2563eb; color: white; }
        .cancel-btn-modal { background-color: #6b7280; color: white; }
        </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Global Export
if (typeof window !== 'undefined') {
    window.QuickModal = QuickModal;
}