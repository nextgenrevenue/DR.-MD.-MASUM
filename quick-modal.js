// =======================================================
// quick-modal.js - Complete Quick Modal with HTML - FIXED VERSION
// =======================================================

class QuickModal {
    constructor(db, adminSessionId, showAlert) {
        this.db = db;
        this.adminSessionId = adminSessionId;
        this.showAlert = showAlert;
        this.gridSystem = null;
        this.pendingSelections = {};
        this.timeSlots = []; // Firebase থেকে লোড করা সময়
        this.serialRanges = {}; // সিরিয়াল রেঞ্জ
        
        // Firebase reference সংরক্ষণ
        this.firebase = window.firebase || firebase;
        
        // মোডাল তৈরি
        this.createModalHTML();
        this.initializeElements();
    }
    
    // =======================================================
// ১. মোডাল HTML ডাইনামিকভাবে তৈরি - IMPROVED LAYOUT
// =======================================================
createModalHTML() {
    // যদি ইতিমধ্যে মোডাল থাকে তাহলে রিটার্ন
    if (document.getElementById('quickSerialModal')) {
        return;
    }
    
    const modalHTML = `
    <!-- কুইক সিরিয়াল মোডাল -->
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
                
                <!-- সার্ভিস এবং সময় এক সারিতে - FIXED FOR MOBILE -->
                <div class="form-row responsive-row">
                    <!-- সার্ভিস সিলেকশন -->
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
                    
                    <!-- টাইম স্লট সিলেকশন -->
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
                    <div class="serial-grid" id="serialGrid">
                        <div class="grid-loading">
                            <i class="fas fa-spinner fa-spin"></i> সিরিয়াল লোড হচ্ছে...
                        </div>
                    </div>
                    <input type="hidden" id="serialInput" value="">
                    <small style="color: var(--gray); font-size: 12px; display: block; margin-top: 5px;">
                        খালি সিরিয়ালে ক্লিক করুন
                    </small>
                </div>
                
                <!-- রোগীর তথ্য -->
                <div class="form-group">
                    <label for="quickName">রোগীর নাম *</label>
                    <input type="text" id="quickName" required placeholder="রোগীর নাম লিখুন" class="full-width-input">
                </div>
                
                <!-- বয়সের তিনটি ফিল্ড পাশাপাশি -->
                <div class="form-group">
                    <label for="quickAge">বয়স</label>
                    <div class="age-container">
                        <div class="age-field">
                            <label for="quickAgeYears" class="age-label">বছর</label>
                            <input type="number" id="quickAgeYears" min="0" max="120" 
                                   placeholder="0" class="age-input">
                        </div>
                        <div class="age-field">
                            <label for="quickAgeMonths" class="age-label">মাস</label>
                            <input type="number" id="quickAgeMonths" min="0" max="11" 
                                   placeholder="0" class="age-input">
                        </div>
                        <div class="age-field">
                            <label for="quickAgeDays" class="age-label">দিন</label>
                            <input type="number" id="quickAgeDays" min="0" max="30" 
                                   placeholder="0" class="age-input">
                        </div>
                    </div>
                    <small style="color: var(--gray); font-size: 12px; display: block; margin-top: 5px;">
                        কমপক্ষে একটি ফিল্ড পূরণ করুন
                    </small>
                </div>
                
                <!-- ফোন নম্বর -->
                <div class="form-group">
                    <label for="quickPhone">ফোন নম্বর (ঐচ্ছিক)</label>
                    <input type="text" id="quickPhone" placeholder="01XXXXXXXXX" class="full-width-input">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cancel-btn-modal" id="cancelQuickModal">বাতিল</button>
                    <button type="submit" class="submit-btn" id="submitQuickBtn">সিরিয়াল যুক্ত করুন</button>
                </div>
            </form>
        </div>
    </div>
    `;
    
    // মোডাল HTML বডিতে যোগ
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // CSS স্টাইল ডাইনামিকভাবে যোগ
    this.addModalStyles();
    
    // অতিরিক্ত CSS যোগ
    this.addExtraStyles();
}

// =======================================================
// অতিরিক্ত CSS স্টাইল যোগ
// =======================================================
addExtraStyles() {
    const extraStyles = `
    <style>
    /* রেসপনসিভ ফর্ম কলাম */
    .form-col {
        flex: 1;
        min-width: 0; /* ফ্লেক্সবক্সের জন্য গুরুত্বপূর্ণ */
    }
    
    .full-width-input {
        width: 100%;
        box-sizing: border-box;
    }
    
    .form-select {
        width: 100%;
        box-sizing: border-box;
    }
    
    /* রেসপনসিভ সারির জন্য */
    .responsive-row {
        display: flex;
        flex-wrap: nowrap;
    }
    
    /* মোবাইলের জন্য বিশেষ মিডিয়া কোয়েরি */
    @media (max-width: 768px) {
        .responsive-row {
            flex-wrap: nowrap; /* মোবাইলেও নো র্যাপ */
            overflow: hidden;
        }
        
        .form-col {
            flex: 1 1 auto;
            min-width: 120px; /* মিনিমাম উইথ */
        }
        
        /* খুব ছোট ডিভাইসের জন্য */
        @media (max-width: 400px) {
            .responsive-row {
                flex-wrap: wrap; /* 400px এর নিচে কলামে */
            }
            
            .form-col {
                flex: 1 1 100%;
                margin-bottom: 10px;
            }
        }
    }
    
    /* খুব ছোট ফোনের জন্য */
    @media (max-width: 320px) {
        .age-container {
            flex-wrap: nowrap; /* বয়স ফিল্ড সবসময় পাশাপাশি */
        }
        
        .age-field {
            flex: 1;
        }
        
        .age-label {
            font-size: 10px;
        }
        
        .age-input {
            font-size: 11px;
            padding: 6px 4px;
        }
    }
    </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', extraStyles);
}
    
  // =======================================================
// ২. মোডাল CSS স্টাইল যোগ - UPDATED FOR MOBILE
// =======================================================
addModalStyles() {
    // যদি ইতিমধ্যে স্টাইল যোগ করা থাকে
    if (document.getElementById('quickModalStyles')) {
        return;
    }
    
    const styles = `
    <style id="quickModalStyles">
    /* কুইক সিরিয়াল মোডাল স্টাইল */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        justify-content: center;
        align-items: center;
    }
    
    .modal-content {
        background-color: var(--white);
        padding: 25px;
        border-radius: 12px;
        width: 90%;
        max-width: 550px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .close-btn {
        position: absolute;
        top: 20px;
        right: 25px;
        background: none;
        border: none;
        font-size: 28px;
        color: var(--gray);
        cursor: pointer;
        line-height: 1;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-btn:hover {
        color: var(--dark);
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-row {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        align-items: flex-end;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--dark);
        font-size: 14px;
    }
    
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-family: 'Noto Sans Bengali', sans-serif;
        font-size: 14px;
        background-color: white;
    }
    
    .age-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-family: 'Noto Sans Bengali', sans-serif;
        font-size: 14px;
        text-align: center;
    }
    
    #quickDate {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-family: 'Noto Sans Bengali', sans-serif;
        font-size: 14px;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    #quickDate:focus,
    .age-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    /* বয়সের তিন ফিল্ডের জন্য বিশেষ কন্টেইনার */
    .age-container {
        display: flex;
        gap: 10px;
        width: 100%;
    }
    
    .age-field {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    
    .age-field label {
        font-size: 12px;
        margin-bottom: 5px;
        color: var(--gray);
        text-align: center;
    }
    
    /* সিরিয়াল গ্রিড স্টাইল */
    .serial-grid {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        gap: 8px;
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        max-height: 250px;
        overflow-y: auto;
        background-color: white;
        overscroll-behavior: none;
        -webkit-overflow-scrolling: auto;
        scroll-behavior: auto;
    }
    
    .serial-grid::-webkit-scrollbar {
        width: 6px;
    }
    
    .serial-grid::-webkit-scrollbar-track {
        background: #f1f1f1;
    }
    
    .serial-grid::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }
    
    .serial-item {
        padding: 8px 5px;
        border: 2px solid transparent;
        border-radius: 6px;
        text-align: center;
        font-weight: 500;
        font-size: 13px;
        transition: all 0.15s ease;
        user-select: none;
        cursor: pointer;
        min-height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: none;
    }
    
    /* সকল ফোকাস স্টেট রিমুভ */
    .serial-item:focus,
        .serial-item:active {
        outline: none !important;
        box-shadow: none !important;
    }
    
    /* সবুজ - খালি */
    .serial-item.available {
        background-color: #dcfce7;
        color: #16a34a;
        border: 2px solid #16a34a;
    }

    .serial-item.available:hover {
        background-color: #bbf7d0;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(34, 197, 94, 0.2);
    }
    
    /* লাল - বুকড */
    .serial-item.booked {
        background-color: #fecaca;
        color: #dc2626;
        border: 2px solid #dc2626;
        cursor: not-allowed;
        opacity: 0.8;
        pointer-events: none;
    }
    
    /* নীল - সিলেক্টেড (অন্য ইউজার) */
    .serial-item.pending {
        background-color: #dbeafe;
        color: #3b82f6;
        border: 2px solid #3b82f6;
        cursor: not-allowed;
        opacity: 0.7;
        pointer-events: none;
    }
    
    /* হলুদ - আপনার নির্বাচিত */
    .serial-item.selected {
        background-color: #fef3c7;
        color: #f59e0b;
        border: 2px solid #f59e0b;
        font-weight: 700;
    }
    
    .grid-no-selection {
        grid-column: 1 / -1;
        text-align: center;
        padding: 20px;
        color: #6b7280;
        font-style: italic;
    }
    
    .grid-loading {
        grid-column: 1 / -1;
        text-align: center;
        padding: 30px;
        color: #3b82f6;
    }
    
    .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 25px;
    }
    
    .form-actions button {
        flex: 1;
        padding: 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        transition: background-color 0.2s ease;
        border: none;
    }
    
    .submit-btn {
        background-color: var(--primary);
        color: white;
    }
    
    .submit-btn:hover {
        background-color: var(--primary-hover);
    }
    
    .submit-btn:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
    }
    
    .cancel-btn-modal {
        background-color: var(--gray);
        color: white;
    }
    
    .cancel-btn-modal:hover {
        background-color: #4b5563;
    }
    
    /* ============================================== */
    /* মোবাইল রেসপনসিভ - UPDATED FOR FORM-ROW */
    /* ============================================== */
    @media (max-width: 768px) {
        .modal-content {
            margin: 10px;
            width: calc(100% - 20px);
            padding: 20px 15px;
            max-height: 95vh;
        }
        
        /* ফর্ম সারি - শুধুমাত্র খুব ছোট স্ক্রিনে কলাম হবে */
        .form-row {
            flex-direction: row; /* মোবাইলেও পাশাপাশি */
            gap: 10px;
            flex-wrap: nowrap;
        }
        
        /* খুব ছোট মোবাইলে (480px নিচে) */
        @media (max-width: 480px) {
            .form-row {
                flex-direction: row; /* এখনও পাশাপাশি */
                gap: 8px;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
        }
        
        /* এক্সট্রিম ছোট মোবাইলে (360px নিচে) */
        @media (max-width: 360px) {
            .form-row {
                flex-direction: column; /* খুব ছোট স্ক্রিনে কলাম */
                gap: 12px;
            }
        }
        
        /* বয়স কন্টেইনার - সব ডিভাইসে পাশাপাশি */
        .age-container {
            display: flex;
            flex-direction: row;
            gap: 8px;
            width: 100%;
        }
        
        .age-field {
            flex: 1;
        }
        
        .age-field label {
            font-size: 11px;
            white-space: nowrap;
        }
        
        .age-input {
            font-size: 13px;
            padding: 8px 6px;
            text-align: center;
        }
        
        /* সিরিয়াল গ্রিড */
        .serial-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            padding: 8px;
            max-height: 200px;
        }
        
        .serial-item {
            padding: 6px 3px;
            font-size: 12px;
            min-height: 32px;
        }
        
        /* ফর্ম গ্রুপ মোবাইল */
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-group label {
            font-size: 13px;
            margin-bottom: 6px;
        }
        
        .form-group input,
        .form-group select {
            padding: 9px 10px;
            font-size: 13px;
        }
        
        /* খুব ছোট মোবাইলে ফন্ট ছোট */
        @media (max-width: 360px) {
            .form-group input,
            .form-group select {
                padding: 8px 9px;
                font-size: 12px;
            }
            
            .form-group label {
                font-size: 12px;
            }
        }
        
        /* বাটন মোবাইল - সবসময় কলামে */
        .form-actions {
            flex-direction: column;
            gap: 8px;
        }
        
        .form-actions button {
            padding: 14px;
            font-size: 14px;
        }
    }
    
    /* ল্যান্ডস্কেপ মোডে বিশেষ স্টাইল */
    @media (max-height: 600px) and (orientation: landscape) {
        .modal-content {
            max-height: 85vh;
            padding: 15px;
        }
        
        .form-row {
            gap: 8px;
        }
        
        .age-container {
            gap: 5px;
        }
        
        .age-input {
            padding: 6px 4px;
            font-size: 12px;
        }
        
        .serial-grid {
            max-height: 150px;
            grid-template-columns: repeat(8, 1fr);
        }
        
        .form-group {
            margin-bottom: 12px;
        }
    }
    </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
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
            quickName: document.getElementById('quickName'),
            quickAgeYears: document.getElementById('quickAgeYears'),
            quickAgeMonths: document.getElementById('quickAgeMonths'),
            quickAgeDays: document.getElementById('quickAgeDays'),
            quickPhone: document.getElementById('quickPhone'),
            submitQuickBtn: document.getElementById('submitQuickBtn')
        };
    }
    
    // =======================================================
    // ৪. মোডাল ইনিশিয়ালাইজ
    // =======================================================
    initialize() {
        console.log("🟢 QuickModal initializing...");
        
        // DOM এলিমেন্ট চেক
        if (!this.elements.quickSerialModal) {
            console.error("❌ Quick modal elements not found");
            return false;
        }
        
        // ইভেন্ট লিসেনার সেটআপ
        this.setupEventListeners();
        
        console.log("✅ QuickModal initialized successfully");
        return true;
    }
    
    // =======================================================
    // ৫. ইভেন্ট লিসেনার সেটআপ
    // =======================================================
    setupEventListeners() {
        // মোডাল ক্লোজ
        if (this.elements.closeQuickModal) {
            this.elements.closeQuickModal.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // মোডাল ক্যান্সেল
        if (this.elements.cancelQuickModal) {
            this.elements.cancelQuickModal.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // ফর্ম সাবমিট
        if (this.elements.quickSerialForm) {
            this.elements.quickSerialForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitForm();
            });
        }
        
        // তারিখ পরিবর্তন
        if (this.elements.quickDate) {
            this.elements.quickDate.addEventListener('change', () => {
                this.loadAvailableTimes();
            });
        }
        
        // সার্ভিস পরিবর্তন
        if (this.elements.serviceType) {
            this.elements.serviceType.addEventListener('change', () => {
                this.loadAvailableTimes();
            });
        }
        
        // রোগীর ধরন পরিবর্তন
        if (this.elements.patientTypeSelect) {
            this.elements.patientTypeSelect.addEventListener('change', () => {
                this.updateGrid();
            });
        }
        
        // সময় পরিবর্তন
        if (this.elements.quickTime) {
            this.elements.quickTime.addEventListener('change', () => {
                this.updateGrid();
            });
        }
        
        // উইন্ডো ক্লিক ইভেন্ট (মোডাল বন্ধ)
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.quickSerialModal) {
                this.closeModal();
            }
        });
    }
    
    // =======================================================
    // ৬. Firebase থেকে সময় লোড করুন
    // =======================================================
    async loadSerialRanges() {
        if (!this.db) {
            console.error("❌ Firebase DB নেই");
            return;
        }
        
        try {
            console.log("🔄 Firebase থেকে সিরিয়াল রেঞ্জ লোড হচ্ছে...");
            
            const doc = await this.db
                .collection('settings')
                .doc('serialRanges')
                .get();
            
            if (doc.exists) {
                this.serialRanges = doc.data();
                console.log("✅ সিরিয়াল রেঞ্জ লোড হয়েছে:", Object.keys(this.serialRanges));
            } else {
                console.log("⚠️ কোনো সিরিয়াল রেঞ্জ নেই");
                this.serialRanges = {};
            }
            
            // সময় লোড করুন
            this.loadAvailableTimes();
            
        } catch (error) {
            console.error("❌ সিরিয়াল রেঞ্জ লোড করতে সমস্যা:", error);
        }
    }
    
    // =======================================================
    // ৭. উপলব্ধ সময় লোড করুন
    // =======================================================
    async loadAvailableTimes() {
        const date = this.elements.quickDate.value;
        const service = this.elements.serviceType.value;
        
        if (!date || !service) {
            this.elements.quickTime.innerHTML = '<option value="">-- প্রথমে তারিখ ও সার্ভিস নির্বাচন করুন --</option>';
            this.elements.quickTime.disabled = true;
            return;
        }
        
        // তারিখ থেকে ইংরেজি দিনের নাম বের করুন
        const selectedDate = new Date(date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const englishDay = days[selectedDate.getDay()];
        
        console.log("🕒 সময় লোড হচ্ছে:", {
            date: date,
            day: englishDay,
            service: service
        });
        
        // Firebase থেকে ডেটা চেক করুন
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
        
        // সব সময়গুলো সংগ্রহ করুন (new এবং old থেকে)
        const allTimes = new Set();
        
        if (serviceData['new']) {
            Object.keys(serviceData['new']).forEach(time => allTimes.add(time));
        }
        
        if (serviceData['old']) {
            Object.keys(serviceData['old']).forEach(time => allTimes.add(time));
        }
        
        if (allTimes.size === 0) {
            this.elements.quickTime.innerHTML = '<option value="">-- কোনো সময় উপলব্ধ নেই --</option>';
            this.elements.quickTime.disabled = true;
            this.clearGrid();
            return;
        }
        
        // সময়গুলো সাজান
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
        
        // সময় ড্রপডাউন আপডেট করুন
        this.elements.quickTime.innerHTML = '<option value="">-- সময় নির্বাচন করুন --</option>';
        sortedTimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            this.elements.quickTime.appendChild(option);
        });
        
        this.elements.quickTime.disabled = false;
        console.log("✅ সময় লোড হয়েছে:", sortedTimes);
        
        // প্রথম সময়টি সিলেক্ট করুন
        if (sortedTimes.length > 0) {
            this.elements.quickTime.value = sortedTimes[0];
            // Grid আপডেট করুন
            this.updateGrid();
        }
    }
    
    // =======================================================
    // ৮. মোডাল ওপেন/ক্লোজ
    // =======================================================
    async openModal() {
        console.log("🟢 মোডাল ওপেন করা হচ্ছে...");
        
        // ডিফল্ট তারিখ সেট
        this.setDefaultDate();
        
        // ফর্ম রিসেট
        this.resetForm();
        
        // Firebase থেকে ডেটা লোড
        await this.loadSerialRanges();
        
        // মোডাল দেখান
        this.elements.quickSerialModal.style.display = 'flex';
        console.log("🟢 মোডাল display: flex সেট করা হয়েছে");
        
        // Grid System ইনিশিয়ালাইজ
        this.initializeSimpleGrid();
    }
    
    // এডিট মোডাল ওপেন
    async openEditModal(docId, data) {
        console.log("🟢 এডিট মোডাল ওপেন করা হচ্ছে...", docId);
        
        // ডেটা ফর্মে সেট করুন
        await this.setEditFormData(docId, data);
        
        // মোডাল শো করুন
        this.elements.quickSerialModal.style.display = 'flex';
        
        // টাইটেল পরিবর্তন
        const modalTitle = document.querySelector('#quickSerialModal h2');
        if (modalTitle) {
            modalTitle.textContent = 'সিরিয়াল এডিট করুন';
        }
        
        // সাবমিট বাটন টেক্সট পরিবর্তন
        if (this.elements.submitQuickBtn) {
            this.elements.submitQuickBtn.textContent = 'আপডেট করুন';
        }
        
        // Firebase থেকে ডেটা লোড
        await this.loadSerialRanges();
        
        // Grid আপডেট করুন
        this.initializeSimpleGrid();
    }
    
    closeModal() {
        console.log("🔴 মোডাল ক্লোজ করা হচ্ছে");
        this.elements.quickSerialModal.style.display = 'none';
        this.resetForm();
    }
    
// =======================================================
// ৯. সরল গ্রিড সিস্টেম
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
    // লোডিং দেখান
    this.showGridMessage('সিরিয়াল লোড হচ্ছে...');
    
    // তারিখ থেকে দিনের নাম
    const selectedDate = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const englishDay = days[selectedDate.getDay()];
    
    // বাংলা দিনের নাম
    const banglaDays = {
      'Sunday': 'রবিবার',
      'Monday': 'সোমবার',
      'Tuesday': 'মঙ্গলবার',
      'Wednesday': 'বুধবার',
      'Thursday': 'বৃহস্পতিবার',
      'Friday': 'শুক্রবার',
      'Saturday': 'শনিবার'
    };
    const banglaDay = banglaDays[englishDay];
    
    // ১. Firebase থেকে সিরিয়াল রেঞ্জ পান
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
    
    // ২. **সার্ভিস ইগনোর করুন - শুধু রোগীর ধরন চেক করুন**
    // শুধু date এবং time দিয়ে ডাটা লোড করুন
    const appointmentsSnapshot = await this.db.collection('appointments')
      .where('date', '==', date)
      .where('time', '==', time)
      .get();
    
    const bookedSerials = [];
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      const appointmentType = data.patientType || data.type;
      
      // শুধু রোগীর ধরন মিললে বুকড হিসেবে গণ্য করুন
      if (appointmentType === type && data.serial) {
        bookedSerials.push(data.serial);
      }
    });
    
    // ৩. **সার্ভিস ইগনোর করুন - শুধু রোগীর ধরন চেক করুন**
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
      
      // শুধু রোগীর ধরন মিললে পেন্ডিং হিসেবে গণ্য করুন
      if (expiresAt && expiresAt > now && pendingType === type) {
        pendingSerials.push(data.serial);
      }
    });
    
    // ৪. গ্রিড তৈরি করুন
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
  
  // সিলেক্ট করা সিরিয়াল
  const selectedSerial = parseInt(this.elements.serialInput.value) || null;
  
  for (let serial = start; serial <= end; serial++) {
    const serialItem = document.createElement('div');
    serialItem.className = 'serial-item';
    serialItem.textContent = serial;
    serialItem.dataset.serial = serial;
    serialItem.setAttribute('tabindex', '-1');
    
    if (bookedSerials.includes(serial)) {
      serialItem.classList.add('booked');
      serialItem.title = `সিরিয়াল ${serial} - ইতিমধ্যে বুক করা হয়েছে`;
      serialItem.style.cursor = 'not-allowed';
    } else if (pendingSerials.includes(serial)) {
      serialItem.classList.add('pending');
      serialItem.title = `সিরিয়াল ${serial} - অন্য ব্যবহারকারী নির্বাচন করেছে`;
      serialItem.style.cursor = 'not-allowed';
    } else if (selectedSerial === serial) {
      serialItem.classList.add('selected');
      serialItem.title = `সিরিয়াল ${serial} - আপনার নির্বাচিত`;
      serialItem.style.cursor = 'default';
    } else {
      serialItem.classList.add('available');
      serialItem.title = `সিরিয়াল ${serial} - খালি (নির্বাচন করতে ক্লিক করুন)`;
      serialItem.style.cursor = 'pointer';
      
      serialItem.addEventListener('click', () => {
        this.selectSerial(serial, serialItem);
      });
      
      serialItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectSerial(serial, serialItem);
        }
      });
    }
    
    this.elements.serialGrid.appendChild(serialItem);
  }
  
  console.log(`✅ গ্রিড তৈরি হয়েছে: ${totalSerials} টি সিরিয়াল (${start}-${end})`);
  console.log(`📊 অবস্থা: ${bookedSerials.length} টি বুকড, ${pendingSerials.length} টি পেন্ডিং`);
}

selectSerial(serial, element) {
  const previouslySelected = document.querySelectorAll('.serial-item.selected');
  
  previouslySelected.forEach(item => {
    if (parseInt(item.dataset.serial) !== serial) {
      item.classList.remove('selected');
      item.classList.add('available');
      item.title = `সিরিয়াল ${item.dataset.serial} - খালি (নির্বাচন করতে ক্লিক করুন)`;
      item.style.cursor = 'pointer';
      
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      
      newItem.addEventListener('click', () => {
        this.selectSerial(parseInt(newItem.dataset.serial), newItem);
      });
    }
  });
  
  element.classList.remove('available');
  element.classList.add('selected');
  element.title = `সিরিয়াল ${serial} - আপনার নির্বাচিত`;
  element.style.cursor = 'default';
  
  this.elements.serialInput.value = serial;
  
  console.log(`✅ সিরিয়াল সিলেক্ট করা হয়েছে: ${serial}`);
  element.blur();
}

showGridMessage(message) {
  this.elements.serialGrid.innerHTML = `
      <div class="grid-no-selection">
          ${message}
      </div>
  `;
}

clearGrid() {
  const serialItems = this.elements.serialGrid.querySelectorAll('.serial-item');
  serialItems.forEach(item => {
    const newItem = item.cloneNode(false);
    item.parentNode.replaceChild(newItem, item);
  });
  
  this.elements.serialGrid.innerHTML = `
      <div class="grid-no-selection">
          📅 তারিখ, 🔧 সার্ভিস এবং ⏰ সময় নির্বাচন করুন
      </div>
  `;
  
  this.elements.serialInput.value = '';
  console.log('🧹 গ্রিড ক্লিয়ার করা হয়েছে');
}

// =======================================================
// ফর্ম সাবমিট ভ্যালিডেশন আপডেট
// =======================================================
async saveToFirebase(data) {
  try {
    const existingAppointments = await this.db.collection('appointments')
      .where('date', '==', data.date)
      .where('time', '==', data.time)
      .get();
    
    let isAlreadyBooked = false;
    let existingService = '';
    
    existingAppointments.forEach(doc => {
      const appointmentData = doc.data();
      const appointmentType = appointmentData.patientType || appointmentData.type;
      
      if (appointmentType === data.type && appointmentData.serial === data.serial) {
        isAlreadyBooked = true;
        existingService = appointmentData.serviceType || 'general';
      }
    });
    
    if (isAlreadyBooked) {
      const typeText = data.type === 'new' ? 'নতুন রোগী' : 'পুরাতন রোগী';
      const serviceNames = {
        'general': 'সাধারণ',
        'microneedling': 'মাইক্রোনিডলিং', 
        'prp': 'পি আর পি',
        'electrocautery': 'ইলেক্ট্রোক্যাটারি',
        'cryosurgery': 'ক্রায়োসার্জারি'
      };
      const existingServiceText = serviceNames[existingService] || existingService;
      
      throw new Error(`সিরিয়াল #${data.serial} ইতিমধ্যে ${typeText} ধরনের জন্য বুক করা আছে! (সার্ভিস: ${existingServiceText})`);
    }
    
    const ageString = this.createAgeString(data.years, data.months, data.days);
    
    const appointmentData = {
      name: data.name,
      age: ageString,
      ageYears: data.years,
      ageMonths: data.months,
      ageDays: data.days,
      phone: data.phone || null,
      date: data.date,
      day: data.day,
      time: data.time,
      serviceType: data.service,
      patientType: data.type,
      type: data.type,
      serial: data.serial,
      called: false,
      tokenGiven: false,
      bookedBy: 'admin',
      timestamp: this.firebase.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('💾 Firebase-এ সংরক্ষণ:', appointmentData);
    await this.db.collection('appointments').add(appointmentData);
    
  } catch (error) {
    console.error('❌ Error in saveToFirebase:', error);
    throw error;
  }
}

async updateInFirebase(docId, data) {
  try {
    const existingAppointments = await this.db.collection('appointments')
      .where('date', '==', data.date)
      .where('time', '==', data.time)
      .get();
    
    let isAlreadyBookedByOthers = false;
    let existingService = '';
    
    existingAppointments.forEach(doc => {
      if (doc.id !== docId) {
        const appointmentData = doc.data();
        const appointmentType = appointmentData.patientType || appointmentData.type;
        
        if (appointmentType === data.type && appointmentData.serial === data.serial) {
          isAlreadyBookedByOthers = true;
          existingService = appointmentData.serviceType || 'general';
        }
      }
    });
    
    if (isAlreadyBookedByOthers) {
      const typeText = data.type === 'new' ? 'নতুন রোগী' : 'পুরাতন রোগী';
      const serviceNames = {
        'general': 'সাধারণ',
        'microneedling': 'মাইক্রোনিডলিং',
        'prp': 'পি আর পি', 
        'electrocautery': 'ইলেক্ট্রোক্যাটারি',
        'cryosurgery': 'ক্রায়োসার্জারি'
      };
      const existingServiceText = serviceNames[existingService] || existingService;
      
      throw new Error(`সিরিয়াল #${data.serial} ইতিমধ্যে অন্য ${typeText} ধরনের জন্য বুক করা আছে! (সার্ভিস: ${existingServiceText})`);
    }
    
    const ageString = this.createAgeString(data.years, data.months, data.days);
    
    const updateData = {
      name: data.name,
      age: ageString,
      ageYears: data.years,
      ageMonths: data.months,
      ageDays: data.days,
      phone: data.phone || null,
      date: data.date,
      day: data.day,
      time: data.time,
      serviceType: data.service,
      patientType: data.type,
      type: data.type,
      serial: data.serial,
      updatedAt: this.firebase.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('💾 Firebase-এ আপডেট:', updateData);
    await this.db.collection('appointments').doc(docId).update(updateData);
    
  } catch (error) {
    console.error('❌ Error in updateInFirebase:', error);
    throw error;
  }
}

// =======================================================
// ১০. ফর্ম সাবমিট
// =======================================================
async submitForm() {
  console.log("📤 Quick serial form submitted");
  
  if (!this.db) {
    this.showAlert('Firebase সংযোগ নেই', 'error');
    return;
  }
  
  const isEditMode = this.elements.submitQuickBtn.textContent === 'আপডেট করুন';
  const formData = this.collectFormData();
  
  const validationResult = this.validateFormData(formData);
  if (!validationResult.isValid) {
    this.showAlert(validationResult.message, 'error');
    return;
  }
  
  try {
    this.setLoadingState(true);
    
    if (isEditMode && this.currentEditDocId) {
      await this.updateInFirebase(this.currentEditDocId, formData);
      this.showAlert(`সিরিয়াল #${formData.serial} সফলভাবে আপডেট হয়েছে!`, 'success');
    } else {
      await this.saveToFirebase(formData);
      this.showAlert(`সিরিয়াল #${formData.serial} সফলভাবে যুক্ত হয়েছে!`, 'success');
    }
    
    this.closeModal();
    
    if (window.tableManager && typeof window.tableManager.applyFilters === 'function') {
      setTimeout(() => {
        window.tableManager.applyFilters();
      }, 500);
    }
    
  } catch (error) {
    console.error('❌ Error saving serial:', error);
    this.showAlert(error.message || 'সিরিয়াল সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
  } finally {
    this.setLoadingState(false);
  }
}
    
    // =======================================================
    // ১১. ইউটিলিটি ফাংশনস
    // =======================================================
    collectFormData() {
        // তারিখ থেকে দিনের নাম
        const date = new Date(this.elements.quickDate.value);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const englishDay = days[date.getDay()];
        
        // বাংলা দিনের নাম
        const banglaDays = {
            'Sunday': 'রবিবার',
            'Monday': 'সোমবার',
            'Tuesday': 'মঙ্গলবার',
            'Wednesday': 'বুধবার',
            'Thursday': 'বৃহস্পতিবার',
            'Friday': 'শুক্রবার',
            'Saturday': 'শনিবার'
        };
        const banglaDay = banglaDays[englishDay];
        
        return {
            name: this.elements.quickName.value.trim(),
            date: this.elements.quickDate.value,
            day: banglaDay,
            time: this.elements.quickTime.value,
            service: this.elements.serviceType.value,
            type: this.elements.patientTypeSelect.value,
            serial: parseInt(this.elements.serialInput.value),
            years: parseInt(this.elements.quickAgeYears.value) || 0,
            months: parseInt(this.elements.quickAgeMonths.value) || 0,
            days: parseInt(this.elements.quickAgeDays.value) || 0,
            phone: this.elements.quickPhone.value.trim()
        };
    }
    
    validateFormData(data) {
        if (!data.name) {
            return { isValid: false, message: 'রোগীর নাম প্রয়োজন' };
        }
        
        if (!data.date) {
            return { isValid: false, message: 'তারিখ নির্বাচন করুন' };
        }
        
        if (!data.time) {
            return { isValid: false, message: 'সময় নির্বাচন করুন' };
        }
        
        if (!data.service) {
            return { isValid: false, message: 'সার্ভিস নির্বাচন করুন' };
        }
        
        if (!data.type) {
            return { isValid: false, message: 'রোগীর ধরন নির্বাচন করুন' };
        }
        
        if (!data.serial || isNaN(data.serial)) {
            return { isValid: false, message: 'সিরিয়াল নির্বাচন করুন' };
        }
        
        if (data.years === 0 && data.months === 0 && data.days === 0) {
            return { isValid: false, message: 'বয়স দিন' };
        }
        
        return { isValid: true, message: '' };
    }
    
    async saveToFirebase(data) {
        // বয়স স্ট্রিং তৈরি
        const ageString = this.createAgeString(data.years, data.months, data.days);
        
        // অ্যাপয়েন্টমেন্ট ডেটা
        const appointmentData = {
            name: data.name,
            age: ageString,
            ageYears: data.years,
            ageMonths: data.months,
            ageDays: data.days,
            phone: data.phone || null,
            date: data.date,
            day: data.day,
            time: data.time,
            serviceType: data.service,
            patientType: data.type,
            type: data.type,
            serial: data.serial,
            called: false,
            tokenGiven: false,
            bookedBy: 'admin',
            timestamp: this.firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('💾 Firebase-এ সংরক্ষণ:', appointmentData);
        await this.db.collection('appointments').add(appointmentData);
    }
    
    async updateInFirebase(docId, data) {
        // বয়স স্ট্রিং তৈরি
        const ageString = this.createAgeString(data.years, data.months, data.days);
        
        // আপডেট করা ডেটা
        const updateData = {
            name: data.name,
            age: ageString,
            ageYears: data.years,
            ageMonths: data.months,
            ageDays: data.days,
            phone: data.phone || null,
            date: data.date,
            day: data.day,
            time: data.time,
            serviceType: data.service,
            patientType: data.type,
            type: data.type,
            serial: data.serial,
            updatedAt: this.firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('💾 Firebase-এ আপডেট:', updateData);
        await this.db.collection('appointments').doc(docId).update(updateData);
    }
    
    createAgeString(years, months, days) {
        let ageString = '';
        if (years > 0) ageString += `${years} বছর`;
        if (months > 0) {
            if (ageString) ageString += ', ';
            ageString += `${months} মাস`;
        }
        if (days > 0) {
            if (ageString) ageString += ', ';
            ageString += `${days} দিন`;
        }
        return ageString || '০ বছর';
    }
    
    async setEditFormData(docId, data) {
        if (!data) return;
        
        // ডকুমেন্ট ID সংরক্ষণ
        this.currentEditDocId = docId;
        
        // ফর্ম ফিল্ড পূরণ
        if (this.elements.quickName) this.elements.quickName.value = data.name || '';
        if (this.elements.quickDate) this.elements.quickDate.value = data.date || '';
        
        // সার্ভিস সিলেক্ট
        const serviceType = data.serviceType || 'general';
        if (this.elements.serviceType) {
            this.elements.serviceType.value = serviceType;
        }
        
        // রোগীর ধরন সিলেক্ট
        const patientType = data.patientType || data.type || 'new';
        if (this.elements.patientTypeSelect) {
            this.elements.patientTypeSelect.value = patientType;
        }
        
        // সময় সেট (পরে সময় ড্রপডাউন লোড হওয়ার পর)
        this.currentEditTime = data.time || '10:00 AM';
        
        // বয়স ফিল্ড
        if (data.ageYears !== undefined && this.elements.quickAgeYears) {
            this.elements.quickAgeYears.value = data.ageYears || 0;
        }
        if (data.ageMonths !== undefined && this.elements.quickAgeMonths) {
            this.elements.quickAgeMonths.value = data.ageMonths || 0;
        }
        if (data.ageDays !== undefined && this.elements.quickAgeDays) {
            this.elements.quickAgeDays.value = data.ageDays || 0;
        }
        
        // ফোন
        if (this.elements.quickPhone) this.elements.quickPhone.value = data.phone || '';
        
        // সিরিয়াল
        if (this.elements.serialInput && data.serial) {
            this.elements.serialInput.value = data.serial;
        }
    }
    
    setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        if (this.elements.quickDate) {
            this.elements.quickDate.value = formattedDate;
            this.elements.quickDate.min = '2024-01-01';
            this.elements.quickDate.max = '2030-12-31';
        }
        
        return formattedDate;
    }
    
    resetForm() {
        if (this.elements.quickSerialForm) {
            this.elements.quickSerialForm.reset();
        }
        
        this.elements.serialInput.value = '';
        this.currentEditDocId = null;
        this.currentEditTime = null;
        
        // তারিখ ডিফল্ট সেট
        this.setDefaultDate();
        
        // সার্ভিস ডিফল্ট সেট
        if (this.elements.serviceType) {
            this.elements.serviceType.value = 'general';
        }
        
        // রোগীর ধরন ডিফল্ট
        if (this.elements.patientTypeSelect) {
            this.elements.patientTypeSelect.value = 'new';
        }
        
        // সময় ড্রপডাউন রিসেট
        if (this.elements.quickTime) {
            this.elements.quickTime.innerHTML = '<option value="">-- তারিখ ও সার্ভিস নির্বাচন করুন --</option>';
            this.elements.quickTime.disabled = true;
        }
        
        // গ্রিড ক্লিয়ার
        this.clearGrid();
        
        // টাইটেল এবং বাটন টেক্সট রিসেট
        const modalTitle = document.querySelector('#quickSerialModal h2');
        if (modalTitle) {
            modalTitle.textContent = 'সিরিয়াল যুক্ত করুন';
        }
        
        if (this.elements.submitQuickBtn) {
            this.elements.submitQuickBtn.textContent = 'সিরিয়াল যুক্ত করুন';
        }
    }
    
    setLoadingState(isLoading) {
        if (!this.elements.submitQuickBtn) return;
        
        if (isLoading) {
            this.elements.submitQuickBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> প্রক্রিয়া হচ্ছে...';
            this.elements.submitQuickBtn.disabled = true;
        } else {
            const text = this.elements.submitQuickBtn.textContent === 'আপডেট করুন' ? 'আপডেট করুন' : 'সিরিয়াল যুক্ত করুন';
            this.elements.submitQuickBtn.innerHTML = text;
            this.elements.submitQuickBtn.disabled = false;
        }
    }
    
    updateGrid() {
        this.initializeSimpleGrid();
    }
    
    // =======================================================
    // ১২. ক্লিনআপ
    // =======================================================
    cleanup() {
        console.log("🧹 QuickModal cleanup");
    }
}

// =======================================================
// গ্লোবাল এক্সেসের জন্য
if (typeof window !== 'undefined') {
    window.QuickModal = QuickModal;
}