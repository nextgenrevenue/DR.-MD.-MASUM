(function() {
  'use strict';
  
  // ==================== HTML TEMPLATES ====================
  const templates = {
    header: `
      <header class="admin-header">
        <button class="mobile-menu-btn" id="mobileMenuBtn">
          <i class="fas fa-bars"></i>
        </button>
        <div class="header-logo">
          <i class="fas fa-hospital-user"></i>
          <span id="pageTitle">ড্যাশবোর্ড</span>
        </div>
        <div class="header-right">
          <span class="header-role" id="headerRole">ইউজার</span>
        </div>
      </header>
      
      <style>
        .admin-header {
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: white;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 20px rgba(0,0,0,0.3);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 64px;
          border-bottom: 2px solid rgba(59,130,246,0.3);
        }
        
        .admin-header .header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
        }
        
        .admin-header .header-logo i {
          color: #3b82f6;
          font-size: 24px;
        }
        
        .admin-header .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .admin-header .header-role {
          background: rgba(59,130,246,0.2);
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #93c5fd;
          border: 1px solid rgba(59,130,246,0.3);
        }
        
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 22px;
          cursor: pointer;
          padding: 8px;
          transition: transform 0.3s;
        }
        
        .mobile-menu-btn:hover {
          transform: scale(1.1);
        }
        
        @media (max-width: 768px) {
          .admin-header { padding: 10px 16px; height: 56px; }
          .admin-header .header-logo { font-size: 16px; }
          .admin-header .header-logo i { font-size: 20px; }
          .mobile-menu-btn { display: flex; align-items: center; }
          .admin-header .header-role { font-size: 10px; padding: 2px 12px; }
        }
      </style>
    `,
    
     sidebar: `
      <nav class="admin-sidebar" id="sidebar">
        <!-- ===== PROFILE SECTION (FIXED) ===== -->
        <div class="sidebar-profile-wrapper">
          <div class="sidebar-profile">
            <div class="avatar" id="sidebarAvatar">
              <i class="fas fa-user-circle"></i>
              <span class="edit-badge" id="editProfileBtn" title="প্রোফাইল এডিট">
                <i class="fas fa-pen"></i>
              </span>
            </div>
            <h3 id="sidebarName">লোড হচ্ছে...</h3>
            <p id="sidebarPhone"><i class="fas fa-phone-alt"></i> 01XXXXXXXXX</p>
            <span class="badge" id="sidebarBadge">
              <i class="fas fa-user-check"></i> সক্রিয়
            </span>
            
            <div class="stats">
              <div class="stat-item">
                <div class="label">📋 মোট সিরিয়াল</div>
                <div class="value" id="sideTotal">0</div>
              </div>
              <div class="stat-item">
                <div class="label">⏳ পেন্ডিং</div>
                <div class="value" id="sidePending">0</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- ===== MENU ITEMS (SCROLLABLE) ===== -->
        <div class="sidebar-menu-wrapper">
          <ul class="sidebar-menu" id="sidebarMenu">
            <!-- JS দিয়ে জেনারেট হবে -->
          </ul>
        </div>
        
        <!-- ===== FOOTER ===== -->
        <div class="sidebar-footer">
          <button class="logout-btn" id="sidebarLogoutBtn">
            <i class="fas fa-sign-out-alt"></i> লগআউট
          </button>
          <div class="version">
            <i class="far fa-calendar-alt"></i> <span id="sideDate"></span>
          </div>
        </div>
      </nav>
      
      <style>
        /* ===== SIDEBAR MAIN ===== */
        .admin-sidebar {
          width: 280px;
          background: linear-gradient(180deg, #ffffff, #f8fafc);
          border-right: 1px solid #e2e8f0;
          height: calc(100dvh - 64px);
          position: sticky;
          top: 64px;
          overflow: hidden; /* পুরো সাইডবারের স্ক্রল বন্ধ */
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 100;
          box-shadow: 2px 0 12px rgba(0,0,0,0.04);
        }
        
        /* ===== PROFILE WRAPPER (FIXED) ===== */
        .sidebar-profile-wrapper {
          flex-shrink: 0; /* প্রোফাইল সঙ্কুচিত হবে না */
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-bottom: 1px solid #e2e8f0;
          position: relative;
          z-index: 2;
        }
        
        /* ===== PROFILE SECTION ===== */
        .sidebar-profile {
          padding: 20px 20px 16px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .sidebar-profile::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        
        .sidebar-profile .avatar {
          width: 72px;
          height: 72px;
          margin: 0 auto 10px;
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 36px;
          border: 3px solid white;
          box-shadow: 0 4px 20px rgba(59,130,246,0.35);
          position: relative;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .sidebar-profile .avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 30px rgba(59,130,246,0.5);
        }
        
        .sidebar-profile .avatar .edit-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          font-size: 11px;
          color: #64748b;
          border: 2px solid white;
          transition: all 0.3s ease;
        }
        
        .sidebar-profile .avatar .edit-badge:hover {
          transform: scale(1.2) rotate(45deg);
          background: linear-gradient(135deg, #3b82f6, #4f46e5);
          color: white;
          box-shadow: 0 4px 16px rgba(59,130,246,0.4);
        }
        
        .sidebar-profile h3 {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          transition: color 0.3s;
          cursor: pointer;
        }
        
        .sidebar-profile h3:hover {
          color: #3b82f6;
        }
        
        .sidebar-profile p {
          font-size: 12px;
          color: #64748b;
          margin: 3px 0 0;
        }
        
        .sidebar-profile .badge {
          display: inline-block;
          margin-top: 6px;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #15803d;
          padding: 3px 14px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          border: 1px solid rgba(22,163,74,0.2);
        }
        
        .sidebar-profile .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 12px;
        }
        
        .sidebar-profile .stats .stat-item {
          background: white;
          padding: 8px 6px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
          transition: all 0.3s ease;
        }
        
        .sidebar-profile .stats .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          border-color: #3b82f6;
        }
        
        .sidebar-profile .stats .stat-item .label {
          font-size: 9px;
          color: #94a3b8;
          font-weight: 500;
        }
        
        .sidebar-profile .stats .stat-item .value {
          font-size: 16px;
          font-weight: 800;
          color: #4f46e5;
          margin-top: 2px;
        }
        
        /* ===== MENU WRAPPER (SCROLLABLE) ===== */
        .sidebar-menu-wrapper {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0;
          position: relative;
        }
        
        .sidebar-menu-wrapper::-webkit-scrollbar {
          width: 4px;
        }
        
        .sidebar-menu-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        .sidebar-menu-wrapper::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        .sidebar-menu-wrapper::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        /* ===== MENU ===== */
        .sidebar-menu {
          list-style: none;
          padding: 8px 12px 12px;
          margin: 0;
        }
        
        .sidebar-menu li {
          margin-bottom: 2px;
        }
        
        .sidebar-menu a {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 14px;
          border-radius: 10px;
          color: #475569;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.25s ease;
          position: relative;
        }
        
        .sidebar-menu a::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%) scaleX(0);
          width: 3px;
          height: 60%;
          background: linear-gradient(180deg, #3b82f6, #4f46e5);
          border-radius: 0 4px 4px 0;
          transition: transform 0.3s ease;
        }
        
        .sidebar-menu a:hover::before,
        .sidebar-menu a.active::before {
          transform: translateY(-50%) scaleX(1);
        }
        
        .sidebar-menu a:hover {
          background: #f1f5f9;
          color: #0f172a;
          transform: translateX(4px);
        }
        
        .sidebar-menu a.active {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #2563eb;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(59,130,246,0.1);
        }
        
        .sidebar-menu a i {
          width: 20px;
          text-align: center;
          font-size: 15px;
          transition: transform 0.3s;
        }
        
        .sidebar-menu a:hover i {
          transform: scale(1.15);
        }
        
        /* ===== DROPDOWN ===== */
        .nav-dropdown {
          position: relative;
        }
        
        .dropdown-toggle {
          display: flex !important;
          align-items: center;
          gap: 14px;
          padding: 10px 14px;
          border-radius: 10px;
          color: #475569;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        
        .dropdown-toggle:hover {
          background: #f1f5f9;
          color: #0f172a;
          transform: translateX(4px);
        }
        
        .dropdown-toggle.active {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #2563eb;
          font-weight: 600;
        }
        
        .dropdown-toggle .fa-chevron-down {
          transition: transform 0.4s ease;
          margin-left: auto;
          font-size: 11px;
          color: #94a3b8;
        }
        
        .dropdown-toggle.open .fa-chevron-down {
          transform: rotate(180deg);
        }
        
        .dropdown-menu {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, opacity 0.3s ease, margin 0.3s ease;
          opacity: 0;
          padding-left: 12px;
          list-style: none;
          margin: 0;
        }
        
        .dropdown-menu.open {
          max-height: 250px;
          opacity: 1;
          margin-top: 4px;
        }
        
        .dropdown-menu .dropdown-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 8px 14px 8px 36px;
          border-radius: 8px;
          color: #64748b;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .dropdown-menu .dropdown-item:hover {
          background: #f1f5f9;
          color: #0f172a;
          transform: translateX(4px);
        }
        
        .dropdown-menu .dropdown-item.active {
          background: #eff6ff;
          color: #2563eb;
        }
        
        .dropdown-menu .dropdown-item i {
          width: 18px;
          text-align: center;
          font-size: 13px;
        }
        
        /* ===== FOOTER ===== */
        .sidebar-footer {
          flex-shrink: 0;
          padding: 12px 20px 14px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        
        .sidebar-footer .logout-btn {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          color: #dc2626;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .sidebar-footer .logout-btn:hover {
          background: linear-gradient(135deg, #fecaca, #fca5a5);
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(220,38,38,0.2);
        }
        
        .sidebar-footer .logout-btn:active {
          transform: scale(0.97);
        }
        
        .sidebar-footer .version {
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          margin-top: 10px;
          letter-spacing: 0.3px;
        }
        
        /* ===== MOBILE ===== */
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed;
            top: 56px;
            left: -100%;
            height: calc(100dvh - 56px);
            box-shadow: 4px 0 30px rgba(0,0,0,0.15);
            width: 290px;
            border-radius: 0 16px 16px 0;
            transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .admin-sidebar.mobile-open {
            left: 0;
          }
          
          .sidebar-profile .stats .stat-item .value {
            font-size: 14px;
          }
          
          .sidebar-profile .avatar {
            width: 64px;
            height: 64px;
            font-size: 30px;
          }
          
          .sidebar-profile h3 {
            font-size: 15px;
          }
          
          .mobile-menu-overlay {
            display: none;
            position: fixed;
            top: 56px;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99;
            backdrop-filter: blur(2px);
            animation: fadeIn 0.3s ease;
          }
          
          .mobile-menu-overlay.active {
            display: block;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      </style>
    `,
    
    footer: `
      <footer class="admin-footer">
        <p>© ${new Date().getFullYear()} সহজ সিরিয়াল - সর্বস্বত্ব সংরক্ষিত</p>
      </footer>
      
      <style>
        .admin-footer {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: #94a3b8;
          text-align: center;
          padding: 16px;
          font-size: 13px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
      </style>
    `
  };
  
  // ==================== MENU CONFIG ====================
  const MENU_CONFIG = {
    user: [
      { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'ড্যাশবোর্ড', page: 'dashboard' },
      { id: 'my-serials', icon: 'fa-list-alt', label: 'সিরিয়াল তালিকা', page: 'my-serials' },
      { id: 'book-serial', icon: 'fa-calendar-plus', label: 'সিরিয়াল বুক', page: 'book-serial' },
      { id: 'profile', icon: 'fa-user-edit', label: 'প্রোফাইল', page: 'profile', isDropdown: true },
    ],
    admin: [
      { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'ড্যাশবোর্ড', page: 'dashboard' },
      { id: 'my-serials', icon: 'fa-list-alt', label: 'সিরিয়াল তালিকা', page: 'my-serials' },
      { id: 'book-serial', icon: 'fa-calendar-plus', label: 'সিরিয়াল বুক', page: 'book-serial' },
      { id: 'tokenmanagement', icon: 'fa-ticket-alt', label: 'টোকেন ম্যানেজমেন্ট', page: 'tokenmanagement' },
      { id: 'admin-chat', icon: 'fa-comment-dots', label: 'লাইভ চ্যাট', page: 'admin-chat' },
      { id: 'notice', icon: 'fa-bullhorn', label: 'নোটিশ', page: 'notice' },
      { id: 'profile', icon: 'fa-user-edit', label: 'প্রোফাইল', page: 'profile', isDropdown: true },
    ],
    owner: [
      { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'ড্যাশবোর্ড', page: 'dashboard' },
      { id: 'my-serials', icon: 'fa-list-alt', label: 'সিরিয়াল তালিকা', page: 'my-serials' },
      { id: 'book-serial', icon: 'fa-calendar-plus', label: 'সিরিয়াল বুক', page: 'book-serial' },
      { id: 'tokenmanagement', icon: 'fa-ticket-alt', label: 'টোকেন ম্যানেজমেন্ট', page: 'tokenmanagement' },
      { id: 'allserial', icon: 'fa-calendar-check', label: 'অ্যাপয়েন্টমেন্ট সমুহ', page: 'allserial' },
      { id: 'management', icon: 'fa-tasks', label: 'সিরিয়াল ম্যানেজমেন্ট', page: 'management' },
      { id: 'admincontrol', icon: 'fa-user-shield', label: 'অ্যাডমিন কন্ট্রোল', page: 'admincontrol' },
      { id: 'admin-chat', icon: 'fa-comment-dots', label: 'লাইভ চ্যাট', page: 'admin-chat' },
      { id: 'notice', icon: 'fa-bullhorn', label: 'নোটিশ', page: 'notice' },
      { id: 'reports', icon: 'fa-chart-line', label: 'রিপোর্ট', page: 'reports' },
      { id: 'profile', icon: 'fa-user-edit', label: 'প্রোফাইল', page: 'profile', isDropdown: true },
    ]
  };
  
  // ==================== COMPONENT LOADER ====================
  const ComponentLoader = {
    profileData: {
      name: '',
      phone: '',
      role: 'user',
      total: 0,
      pending: 0
    },
    
    // ===== রেন্ডার =====
    render(componentName, containerId, options = {}) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container #${containerId} not found`);
        return false;
      }
      
      if (!templates[componentName]) {
        console.error(`Component "${componentName}" not found`);
        return false;
      }
      
      container.innerHTML = templates[componentName];
      
      if (options.title && componentName === 'header') {
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) titleEl.textContent = options.title;
      }
      
      this.initialize(componentName);
      return true;
    },
    
    // ===== ইনিশিয়ালাইজ =====
    initialize(componentName) {
      switch(componentName) {
        case 'header':
          this.initHeader();
          break;
        case 'sidebar':
          this.initSidebar();
          this.initProfile();
          this.initDropdown();
          this.initLogout();
          this.loadUserRole();
          break;
      }
    },
    
    // ===== HEADER =====
    initHeader() {
      const mobileBtn = document.getElementById('mobileMenuBtn');
      if (mobileBtn) {
        mobileBtn.addEventListener('click', () => this.toggleSidebar());
      }
      this.createMobileOverlay();
    },
    
    // ===== SIDEBAR =====
    initSidebar() {
      const currentPage = this.getCurrentPage();
      const links = document.querySelectorAll('.sidebar-link');
      
      links.forEach(link => {
        link.classList.remove('active');
        const page = link.getAttribute('data-page');
        if (page === currentPage) {
          link.classList.add('active');
        }
        
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = link.getAttribute('data-page'); 
          if (page) {
            window.location.href = `${page}`;
          }
          if (window.innerWidth <= 768) {
            ComponentLoader.toggleSidebar(false);
          }
        });
      });
    },
    
// ===== প্রোফাইল =====
initProfile() {
  const phone = sessionStorage.getItem('userPhone') || sessionStorage.getItem('loggedInUser') || '01XXXXXXXXX';
  const role = sessionStorage.getItem('userRole') || 'user';
  
  // 🔥 প্রথমে sessionStorage থেকে নাম নেওয়ার চেষ্টা
  let name = sessionStorage.getItem('userName');
  
  // 🔥 যদি নাম না থাকে, Firebase থেকে লোড করুন
  if (!name && phone && phone !== '01XXXXXXXXX') {
    this.loadNameFromFirebase(phone);
    name = 'লোড হচ্ছে...'; // লোড হওয়া পর্যন্ত দেখাবে
  }
  
  // 🔥 যদি কিছুই না থাকে, ডিফল্ট
  if (!name) name = 'রোগী';
  
  document.getElementById('sidebarPhone').innerHTML = `<i class="fas fa-phone-alt"></i> ${phone}`;
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('headerRole').textContent = this.getRoleLabel(role);
  
  // রোল অনুযায়ী ব্যাজ
  const badge = document.getElementById('sidebarBadge');
  const roleColors = {
    user: { bg: '#dcfce7', color: '#15803d', label: '👤 ইউজার' },
    admin: { bg: '#dbeafe', color: '#2563eb', label: '🛡️ অ্যাডমিন' },
    owner: { bg: '#fef3c7', color: '#d97706', label: '👑 ওনার' }
  };
  const r = roleColors[role] || roleColors.user;
  badge.style.background = r.bg;
  badge.style.color = r.color;
  badge.innerHTML = `<i class="fas fa-user-check"></i> ${r.label}`;
  
  // স্ট্যাট ফাংশন
  window.updateSidebarStats = function(total, pending) {
    document.getElementById('sideTotal').textContent = total || 0;
    document.getElementById('sidePending').textContent = pending || 0;
  };
  
  // তারিখ
  const now = new Date();
  document.getElementById('sideDate').textContent = now.toLocaleDateString('bn-BD', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  
  // এডিট বাটন - প্রোফাইল আপডেট পেজে নিয়ে যাবে
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigateTo('profile');
    });
  }
  
  // এভাটার ক্লিক
  const avatar = document.getElementById('sidebarAvatar');
  if (avatar) {
    avatar.addEventListener('click', () => {
      this.navigateTo('profile');
    });
  }
  
  // নাম ক্লিক
  document.getElementById('sidebarName').addEventListener('click', () => {
    this.navigateTo('profile');
  });
},

// 🔥 Firebase থেকে নাম লোড করার ফাংশন (যোগ করতে হবে)
async loadNameFromFirebase(phone) {
  try {
    // Firebase চেক করুন
    if (typeof db === 'undefined' || !db) {
      console.warn('Firebase initialized নয়');
      return;
    }
    
    const doc = await db.collection('users').doc(phone).get();
    if (doc.exists) {
      const data = doc.data();
      const name = data.name || 'ইউজার';
      
      // sessionStorage-এ সেভ করুন
      sessionStorage.setItem('userName', name);
      
      // সাইডবার আপডেট করুন
      const nameEl = document.getElementById('sidebarName');
      if (nameEl) {
        nameEl.textContent = name;
      }
      
      console.log('✅ নাম লোড হয়েছে:', name);
    } else {
      console.warn('⚠️ ইউজার ডকুমেন্ট পাওয়া যায়নি:', phone);
    }
  } catch (error) {
    console.error('❌ Firebase থেকে নাম লোড করতে সমস্যা:', error);
  }
},
    
    // ===== রোল-বেসড মেনু লোড =====
    loadUserRole() {
      const role = sessionStorage.getItem('userRole') || 'user';
      const menuContainer = document.getElementById('sidebarMenu');
      if (!menuContainer) return;
      
      const menus = MENU_CONFIG[role] || MENU_CONFIG.user;
      let html = '';
      
      menus.forEach(item => {
        if (item.isDropdown) {
          // প্রোফাইল ড্রপডাউন
          html += `
            <li class="nav-dropdown">
              <a href="#" class="dropdown-toggle" id="profileDropdownToggle">
                <i class="fas ${item.icon}"></i> ${item.label}
                <i class="fas fa-chevron-down"></i>
              </a>
              <ul class="dropdown-menu" id="profileDropdownMenu">
                <li><a href="#" data-page="profile" class="dropdown-item">
                  <i class="fas fa-id-card"></i> প্রোফাইল আপডেট
                </a></li>
                <li><a href="#" data-page="change-password" class="dropdown-item">
                  <i class="fas fa-key"></i> পাসওয়ার্ড পরিবর্তন
                </a></li>
              </ul>
            </li>
          `;
        } else {
          html += `
            <li>
              <a href="#" class="sidebar-link" data-page="${item.page}">
                <i class="fas ${item.icon}"></i> ${item.label}
              </a>
            </li>
          `;
        }
      });
      
      menuContainer.innerHTML = html;
      
      // ড্রপডাউন রি-ইনিশিয়ালাইজ
      this.initDropdown();
      this.initSidebar();
    },
    
    // ===== ড্রপডাউন =====
    initDropdown() {
      const toggle = document.getElementById('profileDropdownToggle');
      const menu = document.getElementById('profileDropdownMenu');
      
      if (toggle && menu) {
        // পুরোনো ইভেন্ট রিমুভ
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          this.classList.toggle('open');
          const m = document.getElementById('profileDropdownMenu');
          if (m) m.classList.toggle('open');
        });
        
        const items = menu.querySelectorAll('.dropdown-item');
        items.forEach(item => {
          item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = item.getAttribute('data-page'); 
            if (page) {
              window.location.href = `${page}`;
            }
            const t = document.getElementById('profileDropdownToggle');
            const m = document.getElementById('profileDropdownMenu');
            if (t) t.classList.remove('open');
            if (m) m.classList.remove('open');
          });
        });
      }
    },
    
    // ===== লগআউট =====
    initLogout() {
      const logoutBtn = document.getElementById('sidebarLogoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', this.handleLogout);
      }
    },
    
    // ===== হ্যান্ডেল লগআউট =====
    handleLogout() {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'লগআউট!',
          text: 'আপনি কি নিশ্চিত যে লগআউট করতে চান?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#64748b',
          confirmButtonText: '✅ হ্যাঁ, লগআউট',
          cancelButtonText: '❌ বাতিল'
        }).then((result) => {
          if (result.isConfirmed) {
            sessionStorage.clear();
            window.location.href = 'login.html';
          }
        });
      } else {
        if (confirm('আপনি কি লগআউট করতে চান?')) {
          sessionStorage.clear();
          window.location.href = 'login.html';
        }
      }
    },
    
    // ===== প্রোফাইল আপডেট ফাংশন =====
    updateProfile(name, phone, age, gender) {
      return new Promise((resolve, reject) => {
        const userPhone = sessionStorage.getItem('userPhone') || sessionStorage.getItem('loggedInUser');
        if (!userPhone) {
          reject(new Error('ইউজার খুঁজে পাওয়া যায়নি'));
          return;
        }
        
        // Firebase ডেটাবেস আপডেট
        if (typeof db !== 'undefined' && db) {
          db.collection('users').doc(userPhone).update({
            name: name,
            age: age || '',
            gender: gender || 'Male',
            updatedAt: new Date()
          })
          .then(() => {
            // সেশন আপডেট
            sessionStorage.setItem('userName', name);
            // সাইডবার আপডেট
            document.getElementById('sidebarName').textContent = name;
            resolve({ success: true, message: 'প্রোফাইল আপডেট করা হয়েছে!' });
          })
          .catch((error) => {
            reject(error);
          });
        } else {
          // Firebase না থাকলে লোকাল স্টোরেজে সেভ
          localStorage.setItem('userProfile', JSON.stringify({ name, phone, age, gender }));
          sessionStorage.setItem('userName', name);
          document.getElementById('sidebarName').textContent = name;
          resolve({ success: true, message: 'প্রোফাইল আপডেট করা হয়েছে (লোকাল)!' });
        }
      });
    },
    
    // ===== পাসওয়ার্ড পরিবর্তন ফাংশন =====
    changePassword(currentPassword, newPassword) {
      return new Promise((resolve, reject) => {
        const userPhone = sessionStorage.getItem('userPhone') || sessionStorage.getItem('loggedInUser');
        if (!userPhone) {
          reject(new Error('ইউজার খুঁজে পাওয়া যায়নি'));
          return;
        }
        
        if (newPassword.length < 6) {
          reject(new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'));
          return;
        }
        
        if (typeof db !== 'undefined' && db) {
          // প্রথমে বর্তমান পাসওয়ার্ড চেক
          db.collection('users').doc(userPhone).get()
            .then((doc) => {
              if (!doc.exists) {
                throw new Error('ইউজার খুঁজে পাওয়া যায়নি');
              }
              const userData = doc.data();
              if (userData.password !== currentPassword) {
                throw new Error('বর্তমান পাসওয়ার্ড ভুল');
              }
              // পাসওয়ার্ড আপডেট
              return db.collection('users').doc(userPhone).update({
                password: newPassword,
                passwordUpdatedAt: new Date()
              });
            })
            .then(() => {
              resolve({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' });
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          // Firebase না থাকলে লোকাল স্টোরেজে সেভ
          const stored = localStorage.getItem('userPassword');
          if (stored && stored !== currentPassword) {
            reject(new Error('বর্তমান পাসওয়ার্ড ভুল'));
            return;
          }
          localStorage.setItem('userPassword', newPassword);
          resolve({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে (লোকাল)!' });
        }
      });
    },
    
    // ===== টগল সাইডবার =====
    toggleSidebar(show = null) {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.querySelector('.mobile-menu-overlay');
      
      if (!sidebar || window.innerWidth > 768) return;
      
      if (show === null) {
        sidebar.classList.toggle('mobile-open');
        if (overlay) overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
      } else {
        if (show) {
          sidebar.classList.add('mobile-open');
          if (overlay) overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        } else {
          sidebar.classList.remove('mobile-open');
          if (overlay) overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      }
      
      const btn = document.getElementById('mobileMenuBtn');
      if (btn) {
        btn.innerHTML = sidebar.classList.contains('mobile-open') ? 
          '<i class="fas fa-times"></i>' : 
          '<i class="fas fa-bars"></i>';
      }
    },
    
    // ===== মোবাইল ওভারলে =====
    createMobileOverlay() {
      if (document.querySelector('.mobile-menu-overlay')) return;
      
      const overlay = document.createElement('div');
      overlay.className = 'mobile-menu-overlay';
      overlay.addEventListener('click', () => this.toggleSidebar(false));
      document.body.appendChild(overlay);
    },
    
    // ===== নেভিগেট =====
    navigateTo(page) {
      if (window.innerWidth <= 768) {
        this.toggleSidebar(false);
      }
      window.location.href = `${page}`;
    },
    
 // ===== কারেন্ট পেজ =====
   getCurrentPage() {
     let path = window.location.pathname.toLowerCase().replace('.html', '');
     if (path.endsWith('/')) {
       path = path.slice(0, -1);
     }
     
     const currentPageName = path.split("/").pop();
     
     const pages = ['dashboard', 'my-serials', 'book-serial', 'profile', 'change-password',
                    'tokenmanagement', 'notice', 'allserial', 'management','admin-chat', 'admincontrol', 'reports'];
     
     if (pages.includes(currentPageName)) {
       return currentPageName;
     }

     return 'dashboard';
   },
    
    // ===== রোল লেবেল =====
    getRoleLabel(role) {
      const labels = {
        user: '👤 ইউজার',
        admin: '🛡️ অ্যাডমিন',
        owner: '👑 ওনার'
      };
      return labels[role] || '👤 ইউজার';
    },
    
    // ===== সব কম্পোনেন্ট লোড =====
    loadAllComponents(pageTitle = 'ড্যাশবোর্ড') {
      this.render('header', 'header-container', { title: pageTitle });
      this.render('sidebar', 'sidebar-container');
      this.render('footer', 'footer-container');
      
      setTimeout(() => {
        this.initProfile();
        this.loadUserRole();
        this.initDropdown();
        this.initLogout();
      }, 100);
      
      // রেসপনসিভ
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
          const sidebar = document.getElementById('sidebar');
          const overlay = document.querySelector('.mobile-menu-overlay');
          if (sidebar) sidebar.classList.remove('mobile-open');
          if (overlay) overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
      
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          if (window.innerWidth > 768) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.mobile-menu-overlay');
            if (sidebar) sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
          }
        }, 300);
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.toggleSidebar(false);
      });
    }
  };

// ==================== REALTIME SIDEBAR STATS ====================
ComponentLoader.initGlobalSidebarStats = function() {
  let userPhone = sessionStorage.getItem('userPhone') || sessionStorage.getItem('loggedInUser');
  if (!userPhone) return;

  const sideTotalEl = document.getElementById('sideTotal');
  const sidePendingEl = document.getElementById('sidePending');
  if (!sideTotalEl || !sidePendingEl) return;

  if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    const db = firebase.firestore();
    
    // ✅ archiveDb রেফারেন্স নেওয়া
    let archiveDb = null;
    try {
      const archiveApp = firebase.apps.find(app => app.name === "archiveApp");
      if (archiveApp) {
        archiveDb = archiveApp.firestore();
      }
    } catch(e) {
      console.warn('Archive DB not available:', e);
    }

    let totalCount = 0;
    let pendingCount = 0;

    // 🔥 উভয় DB থেকে ডাটা ট্র্যাক করার ফাংশন
    function processSnapshot(querySnapshot, source) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const appointmentPhone = data.phone ? data.phone.toString().trim() : '';
        const adminPhone = data.adminPhone ? data.adminPhone.toString().trim() : '';
        const statusText = data.status ? data.status.toString().trim().toLowerCase() : '';

        if (appointmentPhone === userPhone || adminPhone === userPhone) {
          totalCount++;
          
          // pending চেক
          const isPending = statusText === 'pending' || statusText === 'পেন্ডিং';
          const tokenGiven = data.tokenGiven === true || data.tokenStatus === 'given';
          const isVisited = data.status === 'visited';
          
          // expired চেক
          let isExpired = false;
          const appointmentDate = data.appointmentDate || data.date;
          if (appointmentDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const appDate = new Date(appointmentDate);
            appDate.setHours(0, 0, 0, 0);
            if (appDate < today) isExpired = true;
          }

          // ✅ pending কাউন্ট: pending স্ট্যাটাস, token দেওয়া হয়নি, visited নয়, expired নয়
          if (isPending && !tokenGiven && !isVisited && !isExpired) {
            pendingCount++;
          }
        }
      });
    }

    // 🔥 primary DB লিসেনার
    db.collection('appointments')
      .onSnapshot((querySnapshot) => {
        // রিসেট
        totalCount = 0;
        pendingCount = 0;
        
        // প্রাইমারি প্রসেস
        processSnapshot(querySnapshot, 'primary');
        
        // আর্কাইভ প্রসেস (যদি থাকে)
        if (archiveDb) {
          archiveDb.collection('archived_appointments')
            .get()
            .then((archiveSnap) => {
              processSnapshot(archiveSnap, 'archive');
              updateUI(totalCount, pendingCount);
            })
            .catch((err) => {
              console.warn('Archive fetch error:', err);
              updateUI(totalCount, pendingCount);
            });
        } else {
          updateUI(totalCount, pendingCount);
        }
      }, (error) => {
        console.error("Sidebar stats error: ", error);
      });
  }
};

// UI আপডেট ফাংশন
function updateUI(total, pending) {
  const sideTotalEl = document.getElementById('sideTotal');
  const sidePendingEl = document.getElementById('sidePending');
  if (sideTotalEl) sideTotalEl.textContent = total;
  if (sidePendingEl) sidePendingEl.textContent = pending;
}
  
  // ==================== GLOBAL ====================
  window.ComponentLoader = ComponentLoader;
  
  // ==================== AUTO LOAD ====================
  document.addEventListener('DOMContentLoaded', function() {
    if (document.body.hasAttribute('data-auto-load-components')) {
      const pageTitle = document.title || 'ড্যাশবোর্ড';
      ComponentLoader.loadAllComponents(pageTitle);
    }
  });
  
})();