// token_modal.js - Token Management & Printing Modal System
console.log("🎟️ Token Modal System loading...");

class TokenModal {
    constructor(config = {}) {
        if (config && config.collection) { // If Firestore DB passed directly
            this.db = config;
            this.firebase = typeof firebase !== 'undefined' ? firebase : null;
            this.showAlert = window.showAlert || alert;
            this.onTokenSaved = null;
        } else {
            this.db = config.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
            this.firebase = config.firebase || (typeof firebase !== 'undefined' ? firebase : null);
            this.showAlert = config.showAlert || window.showAlert || alert;
            this.onTokenSaved = config.onTokenSaved || null;
        }

        this.currentTokenId = null;
        this.currentTokenPath = null;
        this.currentTokenDoc = null;
        this.isTokenSaving = false;
    }

    toBengaliNumber(num) {
        if (num === null || num === undefined || num === '—') return '—';
        const numStr = String(num); 
        const bengaliMap = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return numStr.replace(/\d/g, digit => bengaliMap[digit]);
    }

    getYYMMDD(dateString) {
        if (!dateString) {
            const d = new Date();
            const yy = String(d.getFullYear()).slice(-2);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yy}${mm}${dd}`;
        }
        if (typeof dateString === 'string') {
            const cleanStr = dateString.split('T')[0];
            if (cleanStr.includes('-')) {
                const parts = cleanStr.split('-');
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        return `${parts[0].slice(-2)}${parts[1].padStart(2, '0')}${parts[2].padStart(2, '0')}`;
                    } else if (parts[2].length === 4) {
                        return `${parts[2].slice(-2)}${parts[1].padStart(2, '0')}${parts[0].padStart(2, '0')}`;
                    }
                }
            }
        }
        const d = new Date(dateString);
        if (isNaN(d.getTime())) {
            const today = new Date();
            const yy = String(today.getFullYear()).slice(-2);
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            return `${yy}${mm}${dd}`;
        }
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yy}${mm}${dd}`;
    }

async openModal(arg1, arg2 = {}, arg3 = null) {
    if (!this.db) return this.showAlert('ডেটাবেস সংযোগ নেই', 'error');

    let docId = typeof arg1 === 'string' ? arg1 : (arg1?.id || arg1?.docId);
    let appointmentData = typeof arg2 === 'object' && arg2 !== null ? arg2 : {};
    let docPath = typeof arg3 === 'string' ? arg3 : (arg1?.path || null);

    if (!docId && appointmentData) {
        docId = appointmentData.id || appointmentData.docId;
    }

    try {
        let mainData = { ...appointmentData };

        if (!docPath && docId) {
            const dateStr = mainData.date || mainData.appointmentDate || mainData.createdAt;
            const yymmdd = this.getYYMMDD(dateStr);
            const pType = String(mainData.patientType || mainData.type || 'new').toLowerCase();
            if (yymmdd) {
                docPath = `appointments/${yymmdd}/${pType}/${docId}`;
            }
        }

        if (docPath) {
            try {
                const mainSnap = await this.db.doc(docPath).get();
                if (mainSnap.exists) {
                    mainData = { ...mainSnap.data(), ...mainData };
                }
            } catch(e) {
                console.warn("Main snap load error:", e);
            }
        }

        this.currentTokenId = docId;
        this.currentAppointmentPath = docPath;
        this.currentTokenPath = docPath;

        // পেমেন্ট হিস্ট্রি চেক (কোয়েরি লজিক)
        let paymentDocData = null;
        let paymentDocPath = null;
        const dateStr = mainData.date || mainData.appointmentDate;
        const yymmdd = this.getYYMMDD(dateStr);

        if (yymmdd && docId) {
            for (let col of ['payment_new', 'payment_old']) {
                if (paymentDocData) break;
                const snap = await this.db.collection('paymentHistories').doc(yymmdd).collection(col)
                    .where('appointmentId', '==', String(docId)).limit(1).get();
                if (!snap.empty) {
                    paymentDocData = snap.docs[0].data();
                    paymentDocPath = snap.docs[0].ref.path;
                }
            }
        }

        const finalData = { ...mainData, ...(paymentDocData || {}) };
        this.paymentDocPath = paymentDocPath;
        this.currentTokenDoc = { id: docId, ...finalData };

        const defaultFee = finalData.patientType === 'old' || finalData.type === 'old' ? 600 : 800;
        const currentFee = finalData.tokenFee !== undefined ? finalData.tokenFee : defaultFee;
        const currentPaid = finalData.tokenPaid !== undefined ? finalData.tokenPaid : currentFee;
        const due = currentFee - currentPaid;

        // ✅ সমাধান: paymentHistory ভেরিয়েবলটি অ্যাসাইন করা হলো
        const paymentHistory = finalData.paymentHistory || [];

        let paymentHistoryHtml = '';
        if (paymentHistory.length > 0) {
            const sortedHistory = [...paymentHistory].reverse();
            const paymentItems = sortedHistory.map(p => {
                let dateText = 'তারিখ নেই';
                if (p.timestamp) {
                    try {
                        const date = new Date(p.timestamp);
                        const dateStr = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
                        const timeStr = date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                        dateText = `${dateStr} এ ${timeStr}`;
                    } catch(e) {
                        dateText = p.timestamp;
                    }
                }

                const isPayment = p.type === 'payment';
                return `
                    <div style="background: ${isPayment ? '#dbeafe' : '#fed7aa'}; padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 13px;">
                        <div style="font-weight: bold;">📅 ${dateText}</div>
                        <div>💰 পরিমাণ: ${this.toBengaliNumber(p.amount || 0)} টাকা</div>
                        <div>💳 পদ্ধতি: ${p.method || 'নগদ'}</div>
                        <div>📝 ধরন: ${isPayment ? 'পেমেন্ট' : 'ফেরত'}</div>
                        ${p.note ? `<div>📝 নোট: ${p.note}</div>` : ''}
                        <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                            পূর্বের পরিশোধ: ${this.toBengaliNumber(p.previousPaid ?? 0)} → নতুন: ${this.toBengaliNumber(p.newPaid ?? 0)}
                        </div>
                    </div>
                `;
            }).join('');

            paymentHistoryHtml = `
                <div style="margin-top: 15px;">
                    <h4 style="margin-bottom: 8px; font-size: 14px; color: #374151;">💳 পেমেন্ট ইতিহাস (${this.toBengaliNumber(paymentHistory.length)}টি):</h4>
                    <div style="max-height: 180px; overflow-y: auto; padding-right: 4px;">${paymentItems}</div>
                </div>
            `;
        } else {
            paymentHistoryHtml = `<div style="margin-top: 15px; text-align: center; padding: 15px; color: #9ca3af; border: 1px dashed #e5e7eb; border-radius: 8px;">📭 কোনো পেমেন্ট ইতিহাস নেই</div>`;
        }

        const modalTitle = (paymentDocData || mainData.tokenGiven) ? 'টোকেন বিস্তারিত ও আপডেট' : 'নতুন টোকেন প্রদান';
        const actionBtnText = (paymentDocData || mainData.tokenGiven) ? 'তথ্য আপডেট করুন' : 'সংরক্ষণ ও প্রিন্ট';
        const actionBtnBg = (paymentDocData || mainData.tokenGiven) ? '#16a34a' : '#2563eb';

        this.closeModal();

        const modalHtml = `
            <div class="token-modal-overlay" id="tokenModalOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(3px);">
                <div class="token-modal-container" style="background: #fff; border-radius: 12px; width: 90%; max-width: 460px; max-height: 90vh; overflow-y: auto; padding: 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        <h3 style="margin: 0; font-size: 18px; color: #1d4ed8; font-weight: 700;"><i class="fas fa-ticket-alt"></i> ${modalTitle}</h3>
                        <button id="closeTokenModalBtn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
                    </div>
                    <div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">রোগীর নাম</label>
                            <input type="text" id="tokenName" value="${(finalData.patientName || finalData.name || '').replace(/"/g, '&quot;')}" style="width: 100%; padding: 9px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">বয়স</label>
                            <input type="text" id="tokenAge" value="${finalData.patientAge || finalData.ageDisplay || finalData.age || ''}" style="width: 100%; padding: 9px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">রোগীর ধরন</label>
                            <select id="tokenType" style="width: 100%; padding: 9px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="new" ${(finalData.patientType === 'new' || finalData.type === 'new') ? 'selected' : ''}>নতুন রোগী</option>
                                <option value="old" ${(finalData.patientType === 'old' || finalData.type === 'old') ? 'selected' : ''}>পুরাতন রোগী</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">ফি (টাকা)</label>
                            <input type="number" id="tokenFee" value="${currentFee}" style="width: 100%; padding: 9px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">পরিশোধিত টাকা</label>
                            <input type="number" id="tokenPaid" value="${currentPaid}" style="width: 100%; padding: 9px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                            <div id="dueAmount" style="color: ${due > 0 ? '#ef4444' : '#10b981'}; font-weight: bold; margin-top: 5px; font-size: 13px;">বাকি: ${this.toBengaliNumber(due)} টাকা</div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">রেফারেন্স</label>
                            <input type="text" id="tokenGivenBy" value="${finalData.givenBy || finalData.reference || ''}" placeholder="রেফারেন্স নাম লিখুন" style="width: 100%; padding: 9px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                        ${paymentHistoryHtml}
                    </div>
                    <div style="margin-top: 18px; display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="savePrintTokenBtn" style="background-color: ${actionBtnBg}; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer;">
                            ${actionBtnText}
                        </button>
                        <button id="cancelTokenModalBtn" style="background: #e5e7eb; color: #374151; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer;">বাতিল</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('closeTokenModalBtn').onclick = () => this.closeModal();
        document.getElementById('cancelTokenModalBtn').onclick = () => this.closeModal();
        
        const tokenTypeSelect = document.getElementById('tokenType');
        if (tokenTypeSelect) {
            tokenTypeSelect.onchange = (e) => this.updateFeeByPatientType(e.target.value);
        }

        const feeInput = document.getElementById('tokenFee');
        const paidInput = document.getElementById('tokenPaid');
        if (feeInput) feeInput.oninput = () => this.updateDueAmount();
        if (paidInput) paidInput.oninput = () => this.updateDueAmount();

        const saveBtn = document.getElementById('savePrintTokenBtn');
        if (saveBtn) {
            saveBtn.onclick = () => this.saveAndPrintToken(!paymentDocData && !mainData.tokenGiven);
        }

    } catch (err) {
        console.error("❌ Token Modal load error:", err);
        this.showAlert("ডাটা লোড করতে সমস্যা হয়েছে: " + err.message, "error");
    }
}

    updateDueAmount() {
        const fee = parseInt(document.getElementById('tokenFee')?.value) || 0;
        const paid = parseInt(document.getElementById('tokenPaid')?.value) || 0;
        const due = fee - paid;
        const dueElement = document.getElementById('dueAmount');
        if (dueElement) {
            dueElement.textContent = `বাকি: ${this.toBengaliNumber(due)} টাকা`;
            dueElement.style.color = due > 0 ? '#ef4444' : '#10b981';
        }
    }

    updateFeeByPatientType(type) {
        const feeInput = document.getElementById('tokenFee');
        const paidInput = document.getElementById('tokenPaid');
        
        if (feeInput) {
            const feeValue = (type === 'new') ? 800 : 600;
            feeInput.value = feeValue;
            if (paidInput) {
                paidInput.value = feeValue;
            }
            this.updateDueAmount();
        }
    }

    closeModal() {
        const overlay = document.getElementById('tokenModalOverlay');
        if (overlay) overlay.remove();
        this.currentTokenId = null;
        this.currentTokenPath = null;
        this.currentTokenDoc = null;
    }

async saveAndPrintToken(shouldPrint = false) {
    if (this.isTokenSaving) {
        return this.showAlert('দয়া করে অপেক্ষা করুন, টোকেন সংরক্ষণ করা হচ্ছে...', 'warning');
    }

    // ১. currentTokenId নির্ধারণ
    if (!this.currentTokenId) {
        if (this.currentTokenDoc && (this.currentTokenDoc.id || this.currentTokenDoc.docId || this.currentTokenDoc.appointmentId)) {
            this.currentTokenId = String(this.currentTokenDoc.id || this.currentTokenDoc.docId || this.currentTokenDoc.appointmentId);
        } else if (this.currentTokenPath) {
            const parts = this.currentTokenPath.split('/');
            if (parts.length > 0 && parts[parts.length - 1]) {
                this.currentTokenId = parts[parts.length - 1];
            }
        } else {
            this.currentTokenId = 'T_' + Date.now();
        }
    }

    const saveBtn = document.getElementById('savePrintTokenBtn');
    const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> সংরক্ষণ হচ্ছে...';
    }

    this.isTokenSaving = true;

    try {
        const name = document.getElementById('tokenName')?.value || '';
        const age = document.getElementById('tokenAge')?.value || '';
        const patientType = document.getElementById('tokenType')?.value;
        const fee = parseInt(document.getElementById('tokenFee')?.value) || (patientType === 'new' ? 800 : 600);
        const paid = parseInt(document.getElementById('tokenPaid')?.value) || 0;
        const givenBy = document.getElementById('tokenGivenBy')?.value || '';

        // ২. আসল অ্যাপয়েন্টমেন্ট ডাটা ফেচিং
        let fetchedData = {};
        if (this.currentTokenPath) {
            try {
                let appointmentDoc = await this.db.doc(this.currentTokenPath).get();
                if (!appointmentDoc.exists) {
                    const parts = this.currentTokenPath.split('/');
                    if (parts.length === 4) {
                        const altType = parts[2] === 'new' ? 'old' : 'new';
                        const altPath = `appointments/${parts[1]}/${altType}/${parts[3]}`;
                        const altSnap = await this.db.doc(altPath).get();
                        if (altSnap.exists) {
                            this.currentTokenPath = altPath;
                            appointmentDoc = altSnap;
                        }
                    }
                }
                if (appointmentDoc && appointmentDoc.exists) {
                    fetchedData = appointmentDoc.data();
                }
            } catch (e) {
                console.warn("Could not fetch appointment doc from path:", e);
            }
        }

        const appointmentData = { ...(this.currentTokenDoc || {}), ...fetchedData };
        const originalSerial = appointmentData.serial || appointmentData.appointmentSerial || 0;
        
        // yymmdd ফরম্যাট বের করা (না পাওয়া গেলে আজকের তারিখ ব্যবহার করবে)
        let yymmdd = this.getYYMMDD(appointmentData.date || appointmentData.appointmentDate || appointmentData.createdAt);
        if (!yymmdd) {
            yymmdd = this.getYYMMDD(new Date());
        }

        const targetPatientType = (patientType || appointmentData.patientType || 'new').toLowerCase();
        const subCollectionName = `payment_${targetPatientType}`;

        if (!this.currentTokenPath && this.currentTokenId && yymmdd) {
            this.currentTokenPath = `appointments/${yymmdd}/${targetPatientType}/${this.currentTokenId}`;
        }

        // ৩. পূর্বের পেমেন্ট রেকর্ড খোঁজা (অহেতুক কোয়েরি পরিহার করে)
        let existingDoc = null;

        if (this.paymentDocPath) {
            try {
                const snap = await this.db.doc(this.paymentDocPath).get();
                if (snap.exists) existingDoc = snap;
            } catch(e) {}
        }

        if (!existingDoc && this.currentTokenId && yymmdd) {
            const candidateAppIds = [this.currentTokenId, String(this.currentTokenId)];
            if (!isNaN(this.currentTokenId)) candidateAppIds.push(Number(this.currentTokenId));

            for (let qId of candidateAppIds) {
                if (existingDoc) break;
                try {
                    const [snapNew, snapOld] = await Promise.all([
                        this.db.collection('paymentHistories').doc(yymmdd).collection('payment_new').where('appointmentId', '==', qId).limit(1).get(),
                        this.db.collection('paymentHistories').doc(yymmdd).collection('payment_old').where('appointmentId', '==', qId).limit(1).get()
                    ]);
                    if (!snapNew.empty) existingDoc = snapNew.docs[0];
                    else if (!snapOld.empty) existingDoc = snapOld.docs[0];
                } catch(e) {}
            }
        }

        if (!existingDoc) {
            const tNum = appointmentData.tokenNumber || (this.currentTokenDoc && this.currentTokenDoc.tokenNumber);
            if (tNum) {
                const cleanTNum = String(tNum).replace(/^T-?/i, '');
                const dateFolder = cleanTNum.split('-')[0] || yymmdd;
                for (let col of ['payment_new', 'payment_old']) {
                    if (existingDoc) break;
                    try {
                        const snap = await this.db.collection('paymentHistories').doc(dateFolder).collection(col).doc(cleanTNum).get();
                        if (snap.exists) existingDoc = snap;
                    } catch(e) {}
                }
            }
        }

        let tokenNumber;

        // ৪. বিদ্যমান টোকেন আপডেট
        if (existingDoc) {
            const existingData = existingDoc.data();
            tokenNumber = existingData.tokenNumber;
            let paymentHistory = existingData.paymentHistory || [];
            
            const oldPaid = existingData.tokenPaid || 0;
            if (paid !== oldPaid) {
                const difference = paid - oldPaid;
                paymentHistory.push({
                    id: Date.now().toString(),
                    amount: Math.abs(difference),
                    type: difference > 0 ? 'payment' : 'refund',
                    method: 'নগদ',
                    previousPaid: oldPaid,
                    newPaid: paid,
                    note: difference > 0 ? `পেমেন্ট: ${difference} টাকা` : `ফেরত: ${Math.abs(difference)} টাকা`,
                    timestamp: new Date().toISOString(),
                    createdBy: sessionStorage.getItem('adminEmail') || 'admin',
                    source: 'dashboard'
                });
            }

            const updatedTokenData = {
                ...existingData,
                patientName: name,
                patientAge: age,
                patientType: targetPatientType,
                tokenFee: fee,
                tokenPaid: paid,
                tokenDue: fee - paid,
                status: (fee - paid) === 0 ? 'paid' : 'due',
                paymentHistory: paymentHistory,
                givenBy: givenBy,
                reference: givenBy,
                serial: originalSerial || existingData.serial || 0,
                appointmentSerial: originalSerial || existingData.appointmentSerial || 0,
                lastUpdated: this.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date()
            };

            const currentPaymentSubcollection = existingDoc.ref.parent.id;
            
            if (currentPaymentSubcollection !== subCollectionName) {
                const newPaymentDocRef = this.db.collection('paymentHistories').doc(yymmdd).collection(subCollectionName).doc(existingDoc.id);
                await newPaymentDocRef.set(updatedTokenData);
                await existingDoc.ref.delete();
                this.paymentDocPath = newPaymentDocRef.path;
            } else {
                await existingDoc.ref.update(updatedTokenData);
                this.paymentDocPath = existingDoc.ref.path;
            }
            
            this.showAlert(`✅ টোকেন ${tokenNumber} সফলভাবে আপডেট করা হয়েছে!`, 'success');
            
        } else {
            // ৫. নতুন টোকেন তৈরি (Transaction দ্বারা)
            const counterDocRef = this.db.collection('paymentHistories').doc(yymmdd);
            let createdPath = null;

            await this.db.runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterDocRef);

                let lastCounter = 0;
                if (counterDoc.exists && counterDoc.data().dailyLastCounter) {
                    lastCounter = counterDoc.data().dailyLastCounter;
                }

                const newTokenSerial = lastCounter + 1;
                const serialStr = String(newTokenSerial).padStart(2, '0');
                const tokenDocId = `${yymmdd}-${serialStr}`;
                tokenNumber = `T-${tokenDocId}`;

                const finalDocRef = counterDocRef.collection(subCollectionName).doc(tokenDocId);
                const checkDuplicateDoc = await transaction.get(finalDocRef);

                if (checkDuplicateDoc.exists) {
                    throw new Error(`টোকেন ${tokenNumber} ইতিমধ্যে বিদ্যমান! দয়া করে আবার চেষ্টা করুন।`);
                }

                const initialPaymentHistory = [{
                    id: Date.now().toString(),
                    amount: paid,
                    type: 'payment',
                    method: 'নগদ',
                    note: `টোকেন প্রদান - ${tokenNumber}`,
                    timestamp: new Date().toISOString(),
                    createdBy: sessionStorage.getItem('adminEmail') || 'admin',
                    source: 'dashboard'
                }];

                transaction.set(counterDocRef, { dailyLastCounter: newTokenSerial }, { merge: true });

                transaction.set(finalDocRef, {
                    tokenNumber: tokenNumber,
                    tokenCounter: newTokenSerial,
                    tokenDatePrefix: yymmdd,
                    tokenTimestamp: this.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date(),
                    patientName: name,
                    patientAge: age,
                    patientPhone: appointmentData.phone || '',
                    patientType: targetPatientType,
                    tokenFee: fee,
                    tokenPaid: paid,
                    tokenDue: fee - paid,
                    amount: paid,
                    method: 'নগদ',
                    type: 'payment',
                    note: `টোকেন প্রদান - ${tokenNumber}`,
                    status: (fee - paid) === 0 ? 'paid' : 'due',
                    paymentHistory: initialPaymentHistory,
                    source: 'dashboard',
                    givenBy: givenBy,
                    reference: givenBy,
                    appointmentId: this.currentTokenId,
                    serial: originalSerial,
                    appointmentSerial: originalSerial,
                    createdAt: this.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date(),
                    createdBy: sessionStorage.getItem('adminEmail') || 'admin'
                });

                createdPath = finalDocRef.path;
            });

            this.paymentDocPath = createdPath;
            this.showAlert(`✅ টোকেন ${tokenNumber} তৈরি করা হয়েছে! (সিরিয়াল: ${originalSerial})`, 'success');
        }
        
        // ৬. মূল অ্যাপয়েন্টমেন্ট ডকুমেন্টে স্ট্যাটাস আপডেট
        let appointmentUpdatePath = this.currentTokenPath;
        if (!appointmentUpdatePath && this.currentTokenId && yymmdd) {
            appointmentUpdatePath = `appointments/${yymmdd}/${targetPatientType}/${this.currentTokenId}`;
        }

        if (appointmentUpdatePath) {
            const updatePayload = {
                tokenGiven: true,
                tokenNumber: tokenNumber,
                tokenTimestamp: this.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date(),
                appointmentId: this.currentTokenId,
                tokenFee: fee,
                tokenPaid: paid,
                givenBy: givenBy,
                patientType: targetPatientType,
                lastTokenUpdate: this.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date()
            };

            try {
                let appSnap = await this.db.doc(appointmentUpdatePath).get();
                if (appSnap.exists) {
                    await this.db.doc(appointmentUpdatePath).update(updatePayload);
                } else {
                    const parts = appointmentUpdatePath.split('/');
                    if (parts.length === 4) {
                        const altType = parts[2] === 'new' ? 'old' : 'new';
                        const altPath = `appointments/${parts[1]}/${altType}/${parts[3]}`;
                        const altSnap = await this.db.doc(altPath).get();
                        if (altSnap.exists) {
                            await this.db.doc(altPath).update(updatePayload);
                        }
                    }
                }
            } catch (e) {
                console.warn("Could not update appointment document state:", e);
            }
        }
        
        const savedTokenNum = tokenNumber;
        this.closeModal();
        
        if (shouldPrint) {
            await this.printTokenReceipt(savedTokenNum, name, age, targetPatientType, fee, paid);
        }

        if (typeof this.onTokenSaved === 'function') {
            this.onTokenSaved();
        }

    } catch (error) {
        console.error("❌ Error saving token:", error);
        this.showAlert("সংরক্ষণ করতে সমস্যা হয়েছে: " + error.message, "error");
    } finally {
        this.isTokenSaving = false;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHtml;
        }
    }
}

    async printTokenReceipt(tokenNumber, name, age, patientType, fee, paid) {
        const adminName = sessionStorage.getItem('adminName') || 'অ্যাডমিন';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (!isMobile) {
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                    <title>${tokenNumber}</title>
                    <meta charset="UTF-8">
          <style>
        @page { size: 60mm auto; margin: 0; }
        body { font-family: 'Noto Sans Bengali', sans-serif; width: 56mm; padding: 10px; margin: 0 auto; }
        .card { border: 1px dashed #2563eb; border-radius: 8px; padding: 12px; text-align: center; }
        .header { border-bottom: 1px dashed #e5e7eb; padding-bottom: 8px; margin-bottom: 8px; }
        .header h2 { font-size: 12px; font-weight: bold; color: #2563eb; margin: 0 0 3px 0; }
        .header p { font-size: 10px; color: #6b7280; margin: 0; }
        .token-num { font-size: 22px; font-weight: bold; color: #2563eb; margin: 8px 0; letter-spacing: 1px; }
        .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e5e7eb; font-size: 12px; }
        .footer { margin-top: 10px; font-size: 9px; color: #9ca3af; text-align: center; }
      </style>
                    </head>
                    <body>
                    <div class="card">
                    <div class="header"><h2>ডাঃ মোঃ ওয়াহিদুজ্জামান মাসুম</h2><p>টোকেন নাম্বার</p></div>
                    <div class="token-num">${tokenNumber}</div>
                    <div class="info-row"><span>রোগীর নাম:</span><span>${name || '—'}</span></div>
                    <div class="info-row"><span>বয়স:</span><span>${age || '—'}</span></div>
                    <div class="info-row"><span>ধরন:</span><span>${patientType === 'new' ? 'নতুন' : 'পুরাতন'}</span></div>
                    <div class="info-row"><span>ফি:</span><span>${this.toBengaliNumber(fee)} টাকা</span></div>
                    <div class="footer"><p>Printed by: ${adminName}</p><p>${new Date().toLocaleString('bn-BD')}</p></div>
                    </div>
                    <script>window.onload = function() { setTimeout(() => window.print(), 500); }<\/script>
                    </body>
                    </html>
                `);
                win.document.close();
            }
            return;
        }

        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            await new Promise((resolve) => {
                let loaded = 0;
                const check = () => { loaded++; if (loaded >= 2) resolve(); };
                
                if (typeof html2canvas === 'undefined') {
                    const s1 = document.createElement('script');
                    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    s1.onload = check;
                    s1.onerror = check;
                    document.head.appendChild(s1);
                } else loaded++;

                if (typeof window.jspdf === 'undefined') {
                    const s2 = document.createElement('script');
                    s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    s2.onload = check;
                    s2.onerror = check;
                    document.head.appendChild(s2);
                } else loaded++;
            });
        }

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = '2.2in';
        container.style.backgroundColor = 'white';
        container.style.padding = '12px';
        container.innerHTML = `
            <div style="font-family: sans-serif; border: 1px dashed #2563eb; padding: 12px; text-align: center; border-radius: 8px; background: #fff;">
                <div style="border-bottom: 1px dashed #ccc; margin-bottom: 10px; padding-bottom: 5px;">
                    <h2 style="font-size: 13px; color: #2563eb; margin: 0; font-weight: bold;">ডাঃ মোঃ ওয়াহিদুজ্জামান মাসুম</h2>
                    <p style="font-size: 10px; margin: 2px 0; color: #555;">টোকেন নাম্বার</p>
                </div>
                <div style="font-size: 26px; font-weight: bold; color: #2563eb; margin: 8px 0;">${tokenNumber}</div>
                <div style="font-size: 12px; text-align: left;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 2px;"><span>রোগীর নাম:</span><strong>${name || '—'}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 2px;"><span>বয়স:</span><strong>${age || '—'}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 2px;"><span>ধরন:</span><strong>${patientType === 'new' ? 'নতুন' : 'পুরাতন'}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 2px;"><span>ফি:</span><strong>${this.toBengaliNumber(fee)} টাকা</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>জমা:</span><strong>${this.toBengaliNumber(paid)} টাকা</strong></div>
                </div>
                <div style="margin-top: 12px; font-size: 8px; color: #777;">
                    <p style="margin: 2px 0;">Printed by: ${adminName}</p>
                    <p style="margin: 0;">${new Date().toLocaleString('bn-BD')}</p>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        try {
            if (typeof html2canvas === 'undefined') {
                this.showAlert('PDF জেনারেটর সম্পূর্ণ লোড করা যায়নি', 'error');
                return;
            }

            const canvas = await html2canvas(container, { scale: 3, useCORS: true, logging: false });
            const imgData = canvas.toDataURL('image/jpeg', 0.85);

            const jspdfModule = window.jspdf || window.jsPDF;
            const jsPDFClass = jspdfModule?.jsPDF || jspdfModule;

            if (jsPDFClass) {
                const doc = new jsPDFClass({ unit: 'mm', format: [53.34, 76.2], compress: true });
                doc.addImage(imgData, 'JPEG', 0, 0, 53.34, 76.2, undefined, 'FAST');

                const pdfBlob = doc.output('blob');
                const pdfFile = new File([pdfBlob], `${tokenNumber}.pdf`, { type: 'application/pdf' });

                let shared = false;

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                    try {
                        await navigator.share({
                            files: [pdfFile],
                            title: `টোকেন ${tokenNumber}`,
                            text: `রোগী: ${name || '—'} (টোকেন: ${tokenNumber})`
                        });
                        shared = true;
                    } catch (shareErr) {
                        if (shareErr.name !== 'AbortError') {
                            console.warn("PDF file share failed:", shareErr);
                        } else {
                            shared = true;
                        }
                    }
                }

                if (!shared) {
                    canvas.toBlob(async (imgBlob) => {
                        if (imgBlob && navigator.share && navigator.canShare) {
                            const imgFile = new File([imgBlob], `${tokenNumber}.jpg`, { type: 'image/jpeg' });
                            if (navigator.canShare({ files: [imgFile] })) {
                                try {
                                    await navigator.share({
                                        files: [imgFile],
                                        title: `টোকেন ${tokenNumber}`,
                                        text: `রোগী: ${name || '—'} (টোকেন: ${tokenNumber})`
                                    });
                                    shared = true;
                                } catch (imgShareErr) {
                                    console.warn("Image share failed:", imgShareErr);
                                }
                            }
                        }
                        if (!shared) {
                            doc.save(`${tokenNumber}.pdf`);
                        }
                    }, 'image/jpeg', 0.85);
                }
            } else {
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${tokenNumber}.jpg`;
                    a.click();
                }, 'image/jpeg', 0.85);
            }
        } catch (e) {
            console.error("PDF generation/sharing error:", e);
            this.showAlert("পিডিএফ তৈরিতে সমস্যা হয়েছে: " + e.message, "error");
        } finally {
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    }
}

// Global functions for direct access or backward compatibility
window.showTokenDetailsModal = function(btnOrId, path) {
    if (!window.tokenModal && typeof db !== 'undefined') {
        window.tokenModal = new TokenModal(db);
    }
    if (window.tokenModal) {
        if (typeof btnOrId === 'object' && btnOrId && btnOrId.getAttribute) {
            const id = btnOrId.getAttribute('data-id');
            const docPath = btnOrId.getAttribute('data-path');
            window.tokenModal.openModal(id, {}, docPath);
        } else {
            window.tokenModal.openModal(btnOrId, {}, path);
        }
    }
};

window.closeTokenModal = function() {
    if (window.tokenModal) window.tokenModal.closeModal();
};

window.updateDueAmount = function() {
    if (window.tokenModal) window.tokenModal.updateDueAmount();
};

window.updateFeeByPatientType = function(type) {
    if (window.tokenModal) window.tokenModal.updateFeeByPatientType(type);
};

window.saveAndPrintToken = function(shouldPrint) {
    if (window.tokenModal) window.tokenModal.saveAndPrintToken(shouldPrint);
};

if (typeof window !== 'undefined') {
    window.TokenModal = TokenModal;
    window.TokenModalSystem = TokenModal;
    console.log("✅ TokenModal registered on window");
}
