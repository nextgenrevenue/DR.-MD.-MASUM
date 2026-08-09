// grid.js - DATE & SERVICE BASED REALTIME GRID SYSTEM
console.log("📅 তারিখ ও সেভাবিশিষ্ট Grid System লোড হচ্ছে...");

class RealTimeGridSystem {
  constructor(config) {
    console.log("🔧 Grid System Constructor কল হয়েছে");
    
    const defaultConfig = {
      firebase: null,
      db: null,
      gridContainerId: 'serialGrid',
      selectedSerialInputId: 'serialInput',
      dateElementId: 'date',
      dayElementId: 'day',
      timeElementId: 'time',
      typeElementId: 'patientType',
      serviceElementId: 'serviceType',
      pendingSelectionsCollection: 'pendingSelections',
      appointmentsCollection: 'appointments',
      settingsCollection: 'settings',
      serialRangesDocId: 'serialRanges',
      onSerialClick: null,
      onGridUpdate: null,
      onPendingUpdate: null,
      mode: 'user',
      adminSessionId: null,
      userPendingExpiry: 1 * 60 * 1000,
      adminPendingExpiry: 5 * 60 * 1000,
      enableRealTime: true,
      multiSelect: false
    };
    
    this.config = { ...defaultConfig, ...config };
    
    this.serialRanges = {};
    this.appointmentsList = [];
    this.pendingSelections = {};
    this.userPendingId = null;
    this.currentSelection = null;
    this.realtimeListeners = [];
    this.currentUserPendingSerial = null;
    
    // মাল্টি সিলেক্টের জন্য প্রপার্টি
    this.multiSelect = this.config.multiSelect || false;
    this.selectedSerials = [];
    this.currentPatientIndex = 0;
    
    // গ্রিড রি-রেন্ডার ঠেকানোর জন্য ফ্ল্যাগ
    this._skipNextGridRender = false;
    this.isProcessing = false;
    
    console.log(`✅ Grid System তৈরি হয়েছে (${this.config.mode} মোড, multiSelect: ${this.multiSelect})`);
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

  getNextDateByDay(targetDay) {
    const daysMap = {
      "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
      "Thursday": 4, "Friday": 5, "Saturday": 6
    };
    
    const targetDayIndex = daysMap[targetDay];
    const today = new Date();
    const todayIndex = today.getDay();
    let daysToAdd = targetDayIndex - todayIndex;
    if (daysToAdd < 0) daysToAdd += 7;
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    
    return {
      date: nextDate,
      dateString: this.formatDate(nextDate),
      displayDate: this.formatDisplayDate(nextDate),
      banglaDate: this.formatBanglaDate(nextDate),
      isToday: daysToAdd === 0
    };
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(date) {
    return date.toLocaleDateString('bn-BD', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  }

  formatBanglaDate(date) {
    const banglaMonths = ['জানুয়ারী', 'ফেব্রুয়ারী', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const banglaDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    return `${banglaDays[date.getDay()]}, ${date.getDate()} ${banglaMonths[date.getMonth()]} ${date.getFullYear()}`;
  }

  injectStyles() {
    if (document.getElementById('grid-system-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'grid-system-styles';
    style.textContent = `
      .serial-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 8px; margin: 10px 0; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; max-height: 300px; overflow-y: auto; background-color: white; }
      .date-header { grid-column: 1 / -1; text-align: center; font-weight: 700; color: #1d4ed8; padding: 10px; background: linear-gradient(135deg, #dbeafe, #eff6ff); border-radius: 8px; margin-bottom: 10px; border: 2px solid #3b82f6; font-size: 15px; }
      .serial-item { padding: 10px; border: 2px solid transparent; border-radius: 6px; text-align: center; font-weight: 500; font-size: 14px; transition: all 0.08s linear; user-select: none; cursor: pointer; min-height: 40px; display: flex; align-items: center; justify-content: center; will-change: background-color, border-color; backface-visibility: hidden; }
      .serial-item.available { background-color: #dcfce7; color: #16a34a; border: 2px solid #16a34a; }
      .serial-item.available:hover { background-color: #bbf7d0; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(34, 197, 94, 0.2); }
      .serial-item.booked { background-color: #fecaca; color: #dc2626; border: 2px solid #dc2626; cursor: not-allowed; opacity: 0.8; pointer-events: none; }
      .serial-item.pending { background-color: #dbeafe; color: #3b82f6; border: 2px solid #3b82f6; cursor: not-allowed; opacity: 0.7; pointer-events: none; }
      .serial-item.selected { background-color: #fef3c7; color: #f59e0b; border: 2px solid #f59e0b; font-weight: 700; }
      @media (max-width: 768px) { .serial-grid { grid-template-columns: repeat(7, 1fr); gap: 6px; } .serial-item { padding: 8px; font-size: 13px; } }
      @media (max-width: 480px) { .serial-grid { grid-template-columns: repeat(7, 1fr); } .serial-item { font-size: 12px; } }
      .grid-no-selection { grid-column: 1 / -1; text-align: center; padding: 20px; color: #6b7280; font-style: italic; }
    `;
    document.head.appendChild(style);
  }

  async init() {
    console.log("🚀 Grid System ইনিশিয়ালাইজেশন শুরু...");
    try {
      this.injectStyles();
      if (!this.config.db) throw new Error('Firebase Firestore not available');
      await this.loadSerialRanges();
      if (this.config.enableRealTime) this.setupRealtimeListeners();
      this.setupEventDelegation();
      console.log("✅ Grid System সফলভাবে ইনিশিয়ালাইজ হয়েছে");
      return true;
    } catch (error) {
      console.error("❌ Grid System ইনিশিয়ালাইজেশন ব্যর্থ:", error);
      return false;
    }
  }

  async loadSerialRanges() {
    if (!this.config.db) return;
    try {
      const doc = await this.config.db
        .collection(this.config.settingsCollection)
        .doc(this.config.serialRangesDocId)
        .get();
      if (doc.exists) {
        this.serialRanges = doc.data();
      } else {
        this.serialRanges = {};
      }
    } catch (error) {
      console.error("❌ সিরিয়াল রেঞ্জ লোড করতে সমস্যা:", error);
    }
  }

  setupRealtimeListeners() {
    if (!this.config.db) return;
    
    if (this.realtimeListeners.length) {
      this.realtimeListeners.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
      this.realtimeListeners = [];
    }

    let allAppointments = {};

    const updateAppointments = () => {
      this.appointmentsList = Object.values(allAppointments).map(item => item.data);
      this.safeUpdateGrid();
      if (this.config.onGridUpdate) this.config.onGridUpdate('appointments', this.appointmentsList);
    };

    // 'new' সাব-কালেকশন লিসেনার
    const unsubscribeNew = this.config.db.collectionGroup('new')
      .onSnapshot(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.patientType) data.patientType = 'new';
          if (!data.type) data.type = 'new';
          allAppointments[`${doc.id}_new`] = { id: doc.id, data: data };
        });
        updateAppointments();
      }, error => console.error("❌ 'new' লিসেনার ত্রুটি:", error));

    // 'old' সাব-কালেকশন লিসেনার
    const unsubscribeOld = this.config.db.collectionGroup('old')
      .onSnapshot(snapshot => {
        snapshot.forEach(doc => {
          const data = doc.data();
          if (!data.patientType) data.patientType = 'old';
          if (!data.type) data.type = 'old';
          allAppointments[`${doc.id}_old`] = { id: doc.id, data: data };
        });
        updateAppointments();
      }, error => console.error("❌ 'old' লিসেনার ত্রুটি:", error));

    this.realtimeListeners.push(unsubscribeNew);
    this.realtimeListeners.push(unsubscribeOld);

    // পেন্ডিং সিলেকশন লিসেনার
    const unsubscribePending = this.config.db.collection(this.config.pendingSelectionsCollection)
      .onSnapshot(snapshot => {
        this.processPendingSelections(snapshot);
        this.safeUpdateGrid();
        if (this.config.onPendingUpdate) this.config.onPendingUpdate(this.pendingSelections);
      }, error => console.error("❌ পেন্ডিং লিসেনার ত্রুটি:", error));
    
    this.realtimeListeners.push(unsubscribePending);
  }

  processPendingSelections(snapshot) {
    this.pendingSelections = {};
    const now = new Date();
    snapshot.forEach(doc => {
      const data = doc.data();
      const expires = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (expires && expires > now) {
        const dateStr = data.date || data.appointmentDate;
        const timeStr = data.time;
        const typeStr = (data.type || data.patientType || '').toLowerCase();
        const serviceStr = data.service || data.serviceType || '';
        
        const key = `${dateStr}_${timeStr}_${typeStr}` + (serviceStr ? `_${serviceStr}` : '');
        if (!this.pendingSelections[key]) this.pendingSelections[key] = { user: [], admin: [] };
        
        const serialNum = parseInt(data.serial);
        if (data.bookedBy === 'user') {
          this.pendingSelections[key].user.push({ serial: serialNum, id: doc.id, expiresAt: expires });
          if (doc.id === this.userPendingId) this.currentUserPendingSerial = serialNum;
        } else if (data.bookedBy === 'admin') {
          this.pendingSelections[key].admin.push({ serial: serialNum, id: doc.id, adminId: data.adminId, expiresAt: expires });
        }
      }
    });
  }

  setupEventDelegation() {
    const gridContainer = document.getElementById(this.config.gridContainerId);
    if (!gridContainer) return;
    gridContainer.removeEventListener('click', this.handleGridClick);
    this.handleGridClick = this.handleGridClick.bind(this);
    gridContainer.addEventListener('click', this.handleGridClick);
  }

  handleGridClick(event) {
    if (this.isProcessing) return;
    const serialItem = event.target.closest('.serial-item');
    if (!serialItem) return;
    if (serialItem.classList.contains('booked') || serialItem.classList.contains('pending')) return;
    
    const serial = parseInt(serialItem.dataset.serial);
    if (isNaN(serial)) return;
    
    this.isProcessing = true;
    
    this.selectSerial(serial).finally(() => {
      this.isProcessing = false;
    });
  }

  getElementValue(elementId) {
    if (!elementId) return null;
    const element = document.getElementById(elementId);
    return element ? element.value : null;
  }

  async selectSerial(serial) {
    console.log(`🎯 সিরিয়াল ${serial} সিলেক্ট করা হচ্ছে...`);
    
    this._skipNextGridRender = true;
    
    const newSerialElement = document.querySelector(`.serial-item[data-serial="${serial}"]`);
    if (!newSerialElement) {
        this._skipNextGridRender = false;
        return false;
    }
    
    const day = this.getElementValue(this.config.dayElementId);
    const time = this.getElementValue(this.config.timeElementId);
    const type = this.getElementValue(this.config.typeElementId);
    const service = this.config.serviceElementId ? this.getElementValue(this.config.serviceElementId) : null;
    
    if (!time || !type) {
        this._skipNextGridRender = false;
        return false;
    }
    
    let dateString = null;
    if (this.config.dateElementId) {
      dateString = this.getElementValue(this.config.dateElementId);
    }
    if (!dateString && day) {
      const nextDateInfo = this.getNextDateByDay(day);
      dateString = nextDateInfo.dateString;
    }
    if (!dateString) {
      this._skipNextGridRender = false;
      return false;
    }
    
    const pendingData = this.getPendingDataForKey(dateString, day, time, type, service);
    const status = this.getSerialStatus(serial, day, time, type, dateString, pendingData, service);
    
    if (status.isBooked) {
        if (this.config.onSerialClick) {
            this.config.onSerialClick({ serial, status: 'booked', date: dateString });
        }
        this._skipNextGridRender = false;
        return false;
    }
    
    if (status.isOtherUserPending || (status.isAdminPending && !status.isCurrentAdminPending)) {
        if (this.config.onSerialClick) {
            this.config.onSerialClick({ serial, status: 'pending', date: dateString });
        }
        this._skipNextGridRender = false;
        return false;
    }
    
    // ========== মাল্টি সিলেক্ট মোড ==========
    if (this.multiSelect === true) {
        const alreadySelectedForCurrentPatient = this.selectedSerials.some(
            s => s.serial === serial && s.patientIndex === this.currentPatientIndex
        );
        
        if (alreadySelectedForCurrentPatient) {
            this._skipNextGridRender = false;
            return true; 
        }
        
        const existingForOtherPatient = this.selectedSerials.find(s => s.serial === serial && s.patientIndex !== this.currentPatientIndex);
        
        if (existingForOtherPatient) {
            const otherElement = document.querySelector(`.serial-item[data-serial="${serial}"]`);
            if (otherElement) {
                otherElement.classList.remove('selected');
                otherElement.classList.add('available');
            }
            if (existingForOtherPatient.pendingId) {
                await this.removePendingSelection(existingForOtherPatient.pendingId);
            }
            const otherIndex = this.selectedSerials.findIndex(s => s.serial === serial);
            if (otherIndex !== -1) {
                this.selectedSerials.splice(otherIndex, 1);
            }
        }
        
        const currentPatientSelections = this.getSerialsForPatient(this.currentPatientIndex);
        if (currentPatientSelections.length >= 1) {
            const oldSerial = currentPatientSelections[0];
            const oldSerialElement = document.querySelector(`.serial-item[data-serial="${oldSerial}"]`);
            
            if (oldSerialElement && oldSerialElement !== newSerialElement) {
                oldSerialElement.classList.remove('selected');
                oldSerialElement.classList.add('available');
            }
            
            const oldSelection = this.selectedSerials.find(s => s.serial === oldSerial && s.patientIndex === this.currentPatientIndex);
            if (oldSelection && oldSelection.pendingId) {
                await this.removePendingSelection(oldSelection.pendingId);
            }
            const oldIndex = this.selectedSerials.findIndex(s => s.serial === oldSerial && s.patientIndex === this.currentPatientIndex);
            if (oldIndex !== -1) {
                this.selectedSerials.splice(oldIndex, 1);
            }
        }
        
        const pendingId = await this.addPendingSelection(serial, day, time, type, dateString, service);
        if (pendingId) {
            this.selectedSerials.push({ 
                serial, pendingId, date: dateString, 
                patientIndex: this.currentPatientIndex 
            });
            
            newSerialElement.classList.remove('available', 'pending');
            newSerialElement.classList.add('selected');
            
            const selectedInput = document.getElementById(this.config.selectedSerialInputId);
            if (selectedInput) {
                selectedInput.value = JSON.stringify(this.selectedSerials.map(s => s.serial));
            }
            
            if (this.config.onSerialClick) {
                this.config.onSerialClick({
                    serial, status: 'selected',
                    allSelected: this.selectedSerials.map(s => s.serial),
                    patientIndex: this.currentPatientIndex
                });
            }
        }
        
        this._skipNextGridRender = false;
        return true;
    }
    
    // ========== সিঙ্গেল সিলেক্ট মোড ==========
    if (this.userPendingId) {
        const oldElement = document.querySelector(`.serial-item[data-serial="${this.currentSelection}"]`);
        if (oldElement) {
            oldElement.classList.remove('selected');
            oldElement.classList.add('available');
        }
        await this.removePendingSelection(this.userPendingId);
    }
    
    const pendingId = await this.addPendingSelection(serial, day, time, type, dateString, service);
    if (pendingId) {
        this.userPendingId = pendingId;
        this.currentSelection = serial;
        this.currentUserPendingSerial = serial;
        
        newSerialElement.classList.remove('available', 'pending');
        newSerialElement.classList.add('selected');
        
        const selectedInput = document.getElementById(this.config.selectedSerialInputId);
        if (selectedInput) {
            selectedInput.value = serial;
        }
        
        if (this.config.onSerialClick) {
            this.config.onSerialClick({ serial, status: 'pending', pendingId, date: dateString });
        }
    }
    
    this._skipNextGridRender = false;
    return true;
  }

  getPendingDataForKey(dateString, day, time, type, service) {
    const typeStr = (type || '').toLowerCase();
    const serviceStr = service || '';
    
    const key1 = `${dateString}_${time}_${typeStr}`;
    const key2 = serviceStr ? `${dateString}_${time}_${typeStr}_${serviceStr}` : null;
    
    const p1 = this.pendingSelections[key1] || { user: [], admin: [] };
    const p2 = key2 ? (this.pendingSelections[key2] || { user: [], admin: [] }) : { user: [], admin: [] };
    
    return {
      user: [...p1.user, ...p2.user],
      admin: [...p1.admin, ...p2.admin]
    };
  }

  async updateGrid() {
    if (this._skipNextGridRender) {
      console.log("⏭️ গ্রিড রি-রেন্ডার স্কিপ করা হয়েছে");
      this._skipNextGridRender = false;
      return;
    }
    
    if (this.isProcessing) return;
    
    const gridContainer = document.getElementById(this.config.gridContainerId);
    if (!gridContainer) return;
    
    const day = this.getElementValue(this.config.dayElementId);
    const time = this.getElementValue(this.config.timeElementId);
    const type = this.getElementValue(this.config.typeElementId);
    const service = this.config.serviceElementId ? this.getElementValue(this.config.serviceElementId) : null;
    
    if (!time || !type) {
      gridContainer.innerHTML = '<div class="grid-no-selection">সময় এবং ধরন নির্বাচন করুন</div>';
      if (this.config.onGridUpdate) {
        this.config.onGridUpdate('grid', { day, time, type, service, start: 0, end: 0 });
      }
      return;
    }
    
    let dateString = null;
    let displayDate = null;
    if (this.config.dateElementId) {
      const dateVal = this.getElementValue(this.config.dateElementId);
      if (dateVal) {
        dateString = dateVal;
        const parts = dateVal.split('-');
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          displayDate = this.formatBanglaDate(dateObj);
        }
      }
    }
    if (!dateString && day) {
      const nextDateInfo = this.getNextDateByDay(day);
      dateString = nextDateInfo.dateString;
      displayDate = nextDateInfo.banglaDate;
    }
    if (!dateString) {
      gridContainer.innerHTML = '<div class="grid-no-selection">তারিখ নির্বাচন করুন</div>';
      return;
    }
    
    const range = this.getSerialRange(day, type, time, service);
    if (!range) {
      gridContainer.innerHTML = '<div class="grid-no-selection">এই সময়ের জন্য সিরিয়াল উপলব্ধ নেই</div>';
      if (this.config.onGridUpdate) {
        this.config.onGridUpdate('grid', { day, time, type, service, start: 0, end: 0 });
      }
      return;
    }
    
    let start, end;
    if (Array.isArray(range)) { 
      [start, end] = range; 
    } else if (typeof range === 'number') {
      start = 1;
      end = range;
    } else if (typeof range === 'string') {
      if (range.includes('-')) {
        const parts = range.split('-');
        start = parseInt(parts[0]);
        end = parseInt(parts[1]);
      } else {
        start = 1;
        end = parseInt(range);
      }
    }
    
    if (isNaN(start) || isNaN(end) || start <= 0 || end < start) {
      gridContainer.innerHTML = '<div class="grid-no-selection">এই সময়ের জন্য সিরিয়াল উপলব্ধ নেই</div>';
      if (this.config.onGridUpdate) {
        this.config.onGridUpdate('grid', { day, time, type, service, start: 0, end: 0 });
      }
      return;
    }

    const pendingData = this.getPendingDataForKey(dateString, day, time, type, service);
    const currentScroll = gridContainer.scrollTop;
    
    gridContainer.innerHTML = '';
    
    if (displayDate) {
      const dateHeader = document.createElement('div');
      dateHeader.className = 'date-header';
      dateHeader.textContent = `📅 অ্যাপয়েন্টমেন্ট তারিখ: ${displayDate}`;
      gridContainer.appendChild(dateHeader);
    }
    
    for (let serial = start; serial <= end; serial++) {
      const serialItem = document.createElement('div');
      serialItem.className = 'serial-item';
      serialItem.textContent = serial;
      serialItem.dataset.serial = serial;
      serialItem.dataset.date = dateString;
      
      const status = this.getSerialStatus(serial, day, time, type, dateString, pendingData, service);
      
      if (status.isBooked) {
        serialItem.classList.add('booked');
      }
      else if (this.multiSelect && this.selectedSerials.some(s => s.serial === serial)) {
        serialItem.classList.add('selected');
      }
      else if (this.currentSelection === serial || status.isCurrentUserPending || status.isCurrentAdminPending) {
        serialItem.classList.add('selected');
      }
      else if (status.isOtherUserPending || status.isAdminPending) {
        serialItem.classList.add('pending');
      }
      else {
        serialItem.classList.add('available');
      }
      
      gridContainer.appendChild(serialItem);
    }
    
    requestAnimationFrame(() => { gridContainer.scrollTop = currentScroll; });
    
    if (this.config.onGridUpdate) {
      this.config.onGridUpdate('grid', { day, time, type, service, start, end, date: dateString, displayDate });
    }
  }

  getSerialRange(day, type, time, service = null) {
    if (!this.serialRanges) return null;
    
    // Check by day first
    if (day && this.serialRanges[day]) {
      const currentService = service || (this.config.serviceElementId ? this.getElementValue(this.config.serviceElementId) : null);
      if (currentService && this.serialRanges[day][currentService] && this.serialRanges[day][currentService][type]) {
        const val = this.serialRanges[day][currentService][type][time];
        if (val !== undefined && val !== null) return val;
      }
      if (this.serialRanges[day][type] && this.serialRanges[day][type][time] !== undefined) {
        return this.serialRanges[day][type][time];
      }
    }

    // Search across all days if day is missing/mismatched
    for (const dKey in this.serialRanges) {
      const dData = this.serialRanges[dKey];
      const currentService = service || (this.config.serviceElementId ? this.getElementValue(this.config.serviceElementId) : null);
      if (currentService && dData[currentService] && dData[currentService][type] && dData[currentService][type][time] !== undefined) {
        return dData[currentService][type][time];
      }
      if (dData[type] && dData[type][time] !== undefined) {
        return dData[type][time];
      }
    }
    
    return null;
  }

  getSerialStatus(serial, day, time, type, dateString, pendingData, service = null) {
    const status = {
      isBooked: false,
      isOtherUserPending: false,
      isCurrentUserPending: false,
      isAdminPending: false,
      isCurrentAdminPending: false
    };

    const currentService = service || (this.config.serviceElementId ? this.getElementValue(this.config.serviceElementId) : null);
    const targetType = (type || '').toLowerCase();
    const targetSerial = parseInt(serial);

    if (this.appointmentsList && Array.isArray(this.appointmentsList)) {
      const appointment = this.appointmentsList.find(app => {
        const appDate = app.date || app.appointmentDate;
        const appTime = app.time;
        const appType = (app.patientType || app.type || '').toLowerCase();
        const appService = app.serviceType || app.service || 'general';
        const appSerial = parseInt(app.serial);

        if (!appDate || isNaN(appSerial)) return false;

        const dateMatch = (appDate === dateString);
        const timeMatch = (appTime === time);
        const typeMatch = (appType === targetType);
        const serialMatch = (appSerial === targetSerial);
        const serviceMatch = !currentService || !appService || (appService === currentService);

        return dateMatch && timeMatch && typeMatch && serialMatch && serviceMatch;
      });

      if (appointment) {
        status.isBooked = true;
      }
    }

    if (!status.isBooked) {
      if (this.currentUserPendingSerial === targetSerial) {
        status.isCurrentUserPending = true;
      } else if (pendingData.user && pendingData.user.some(p => parseInt(p.serial) === targetSerial)) {
        status.isOtherUserPending = true;
      }

      if (pendingData.admin && pendingData.admin.some(p => parseInt(p.serial) === targetSerial)) {
        status.isAdminPending = true;
        const adminPending = pendingData.admin.find(p => parseInt(p.serial) === targetSerial);
        if (adminPending && adminPending.adminId === this.config.adminSessionId) {
          status.isCurrentAdminPending = true;
        }
      }
    }

    return status;
  }

  async addPendingSelection(serial, day, time, type, dateString, service = null) {
    if (!this.config.db) return null;
    try {
      const expiryTime = this.config.mode === 'admin' ? this.config.adminPendingExpiry : this.config.userPendingExpiry;
      const currentService = service || (this.config.serviceElementId ? this.getElementValue(this.config.serviceElementId) : null);
      
      const pendingData = {
        serial: parseInt(serial),
        day: day || '',
        time,
        type: (type || 'new').toLowerCase(),
        patientType: (type || 'new').toLowerCase(),
        date: dateString,
        appointmentDate: dateString,
        service: currentService || 'general',
        serviceType: currentService || 'general',
        bookedBy: this.config.mode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + expiryTime)
      };
      if (this.config.mode === 'admin' && this.config.adminSessionId) {
        pendingData.adminId = this.config.adminSessionId;
      }
      const docRef = await this.config.db.collection(this.config.pendingSelectionsCollection).add(pendingData);
      return docRef.id;
    } catch (error) {
      console.error("❌ পেন্ডিং সিলেকশন অ্যাড করতে সমস্যা:", error);
      return null;
    }
  }

  async removePendingSelection(pendingId) {
    if (!this.config.db || !pendingId) return;
    try {
      await this.config.db.collection(this.config.pendingSelectionsCollection).doc(pendingId).delete();
    } catch (error) {
      console.error("❌ পেন্ডিং সিলেকশন রিমুভ করতে সমস্যা:", error);
    }
  }

  safeUpdateGrid() {
    if (this.isProcessing) {
      setTimeout(() => this.safeUpdateGrid(), 100);
      return;
    }
    this.updateGrid();
  }

  getSelectedSerials() {
    return this.selectedSerials.map(s => s.serial);
  }
  
  getAllSelectedSerials() {
    return this.selectedSerials.map(s => s.serial);
  }
  
  getAllSelectedSerialsWithDetails() {
    return [...this.selectedSerials];
  }
  
  getSerialsForPatient(patientIndex) {
    return this.selectedSerials.filter(s => s.patientIndex === patientIndex).map(s => s.serial);
  }
  
  setCurrentPatientIndex(index) {
    this.currentPatientIndex = index;
  }
  
  async clearAllSelections() {
    this._skipNextGridRender = true;
    
    for (const selected of this.selectedSerials) {
      if (selected.pendingId) {
        await this.removePendingSelection(selected.pendingId);
      }
      const element = document.querySelector(`.serial-item[data-serial="${selected.serial}"]`);
      if (element) {
        element.classList.remove('selected');
        element.classList.add('available');
      }
    }
    this.selectedSerials = [];
    
    const selectedInput = document.getElementById(this.config.selectedSerialInputId);
    if (selectedInput) selectedInput.value = '';
    
    this._skipNextGridRender = false;
  }

  cleanup() {
    this.realtimeListeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') unsubscribe();
    });
    const gridContainer = document.getElementById(this.config.gridContainerId);
    if (gridContainer) {
      gridContainer.removeEventListener('click', this.handleGridClick);
    }
    if (this.multiSelect && this.selectedSerials.length > 0) {
      this.selectedSerials.forEach(async (selected) => {
        if (selected.pendingId) await this.removePendingSelection(selected.pendingId);
      });
    }
    if (this.userPendingId) this.removePendingSelection(this.userPendingId);
    console.log("🧹 Grid System ক্লিনআপ সম্পন্ন");
  }
}

if (typeof window !== 'undefined') {
  window.RealTimeGridSystem = RealTimeGridSystem;
  console.log("✅ RealTimeGridSystem উইন্ডো অবজেক্টে রেজিস্টার হয়েছে");
}

console.log("📅 grid.js লোড সম্পন্ন");
