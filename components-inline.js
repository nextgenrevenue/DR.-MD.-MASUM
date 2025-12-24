// components-inline.js
// এই ফাইলটি আপনার সকল HTML পেজে include করবেন

(function() {
  'use strict';
  
  // ==================== HTML TEMPLATES ====================
  const templates = {
    header: `
      <header class="admin-header">
        <button class="mobile-menu-btn" id="mobileMenuBtn">☰</button>
        <h1 id="pageTitle">এডমিন ড্যাশবোর্ড</h1>
        <button class="logout-btn" id="logoutBtn">লগআউট</button>
      </header>
      
      <style>
        .admin-header {
          background-color: #1f2937;
          color: #ffffff;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 60px;
          box-sizing: border-box;
          /* রোটেশন ফিক্স - সঠিক উচ্চতা বজায় রাখা */
          min-height: 60px;
        }
        
        .admin-header h1 {
          font-size: 22px;
          font-family: 'Noto Sans Bengali', sans-serif;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }
        
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          color: #ffffff;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          z-index: 1001;
          position: relative;
        }
        
        .logout-btn {
          padding: 8px 16px;
          background-color: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Noto Sans Bengali', sans-serif;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .logout-btn:hover {
          background-color: #b91c1c;
        }
        
        /* মোবাইল স্টাইল */
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .admin-header {
            height: 60px;
            padding: 10px 15px;
          }
          
          .admin-header h1 {
            font-size: 18px;
            max-width: 50%;
          }
        }
        
        /* ল্যান্ডস্কেপ মোডে (ফোন রোটেট করলে) */
        @media (max-width: 768px) and (orientation: landscape) {
          .admin-header {
            height: 50px;
            padding: 8px 15px;
          }
          
          .admin-header h1 {
            font-size: 16px;
            max-width: 40%;
          }
          
          .logout-btn {
            padding: 6px 12px;
            font-size: 14px;
          }
          
          .mobile-menu-btn {
            width: 35px;
            height: 35px;
            font-size: 20px;
          }
        }
        
        /* খুব ছোট ডিভাইসের জন্য */
        @media (max-width: 480px) {
          .admin-header h1 {
            font-size: 16px;
            max-width: 45%;
          }
          
          .logout-btn {
            padding: 6px 12px;
            font-size: 14px;
          }
        }
        
        /* মোবাইল মেনু ওপেন থাকলে ওভারলে */
        .mobile-menu-overlay {
          display: none;
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 99;
        }
        
        .mobile-menu-overlay.active {
          display: block;
        }
        
        @media (max-width: 768px) and (orientation: landscape) {
          .mobile-menu-overlay {
            top: 50px;
          }
        }
      </style>
    `,
    
    sidebar: `
  <nav class="admin-sidebar" id="sidebar">
    <ul class="sidebar-menu">
      <li><a href="/dashboard" class="sidebar-link" data-page="dashboard"><i>📊</i> ড্যাশবোর্ড</a></li>
      <li><a href="/allserial" class="sidebar-link" data-page="allserial"><i>📅</i> অ্যাপয়েন্টমেন্ট</a></li>
      <li><a href="/livechat" class="sidebar-link" data-page="livechat"><i>👨‍⚕️</i> লাইভ অ্যাটেনডেন্স</a></li>
      <li><a href="/management" class="sidebar-link" data-page="management"><i>⏰</i> সিরিয়াল ম্যানেজমেন্ট</a></li>
      <li><a href="/notice" class="sidebar-link" data-page="notice"><i>👥</i> নোটিস</a></li>
      <li><a href="/settings" class="sidebar-link" data-page="settings"><i>⚙️</i> সেটিংস</a></li>
    </ul>
  </nav>
  
  <style>
    .admin-sidebar {
      width: 250px;
      background-color: #ffffff;
      border-right: 1px solid #e5e7eb;
      padding: 20px 0;
      transition: all 0.3s ease;
      height: calc(100vh - 60px);
      position: sticky;
      top: 60px;
      overflow-y: auto;
      flex-shrink: 0;
      z-index: 100;
    }
    
    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .sidebar-menu li {
      margin-bottom: 5px;
    }
    
    .sidebar-menu a {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #1f2937;
      text-decoration: none;
      transition: all 0.2s ease;
      font-weight: 500;
      font-family: 'Noto Sans Bengali', sans-serif;
    }
    
    .sidebar-menu a:hover, 
    .sidebar-menu a.active {
      background-color: #f3f4f6;
      color: #2563eb;
    }
    
    .sidebar-menu a i {
      margin-right: 10px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    
    /* ল্যান্ডস্কেপ মোডে সাইডবার */
    @media (max-width: 768px) and (orientation: landscape) {
      .admin-sidebar {
        height: calc(100vh - 50px);
        top: 50px;
      }
    }
    
    @media (max-width: 768px) {
      .admin-sidebar {
        position: fixed;
        top: 60px;
        left: -250px;
        z-index: 100;
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        height: calc(100vh - 60px);
      }
      
      .admin-sidebar.mobile-open {
        left: 0;
      }
    }
    
    @media (max-width: 768px) and (orientation: landscape) {
      .admin-sidebar {
        top: 50px;
        height: calc(100vh - 50px);
      }
    }
  </style>
`,
    
    footer: `
      <footer class="admin-footer">
        <p>© ${new Date().getFullYear()} Doctor Appointment System - Admin Panel</p>
      </footer>
      
      <style>
        .admin-footer {
          background-color: #1f2937;
          color: #ffffff;
          text-align: center;
          padding: 15px;
          margin-top: 20px;
          font-family: 'Noto Sans Bengali', sans-serif;
          position: relative;
          z-index: 1;
        }
        
        @media (max-width: 768px) {
          .admin-footer {
            padding: 10px;
            font-size: 14px;
          }
        }
      </style>
    `
  };
  
  // ==================== COMPONENT LOADER ====================
  const ComponentLoader = {
    // কম্পোনেন্ট রেন্ডার
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
      
      // অপশনাল টাইটেল সেট
      if (options.title && componentName === 'header') {
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
          titleEl.textContent = options.title;
        }
      }
      
      // কম্পোনেন্ট ইনিশিয়ালাইজ
      this.initialize(componentName);
      
      return true;
    },
    
    // কম্পোনেন্ট ইনিশিয়ালাইজেশন
    initialize(componentName) {
      switch(componentName) {
        case 'header':
          this.initHeader();
          break;
        case 'sidebar':
          this.initSidebar();
          break;
      }
    },
    
    // হেডার ইনিশিয়ালাইজ
    initHeader() {
      const logoutBtn = document.getElementById('logoutBtn');
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      
      if (logoutBtn) {
        logoutBtn.addEventListener('click', this.handleLogout);
      }
      
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // ইভেন্ট বাবলিং থামানো
          this.toggleSidebar();
        });
      }
      
      // মোবাইল ওভারলে যোগ করুন
      this.createMobileOverlay();
      
      // রোটেশন হ্যান্ডলিং
      this.handleViewportChanges();
    },
    
    // মোবাইল মেনু ওভারলে তৈরি
    createMobileOverlay() {
      // ওভারলে ইতিমধ্যে থাকলে রিটার্ন
      if (document.querySelector('.mobile-menu-overlay')) {
        return;
      }
      
      const overlay = document.createElement('div');
      overlay.className = 'mobile-menu-overlay';
      overlay.addEventListener('click', () => {
        this.toggleSidebar(false);
      });
      
      document.body.appendChild(overlay);
    },
    
    // সাইডবার ইনিশিয়ালাইজ
    initSidebar() {
      const currentPage = this.getCurrentPage();
      console.log('Current page:', currentPage); // ডিবাগিং
      
      const sidebarLinks = document.querySelectorAll('.sidebar-link');
      
      // সব লিঙ্ক থেকে active ক্লাস সরান
      sidebarLinks.forEach(link => {
        link.classList.remove('active');
      });
      
      // current page এর লিঙ্কে active ক্লাস যোগ করুন
      sidebarLinks.forEach(link => {
        const page = link.getAttribute('data-page');
        console.log('Checking link:', page, 'vs current:', currentPage); // ডিবাগিং
        
        if (page === currentPage) {
          link.classList.add('active');
          console.log('Active added to:', page); // ডিবাগিং
        }
        
        // মোবাইলে ক্লিক করলে সাইডবার বন্ধ
        link.addEventListener('click', (e) => {
          if (window.innerWidth <= 768) {
            this.toggleSidebar(false);
            e.stopPropagation();
          }
        });
      });
      
      // সাইডবারে ক্লিক করলে ইভেন্ট বাবলিং থামানো
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    },
    
    // রোটেশন এবং রিসাইজ হ্যান্ডলিং
    handleViewportChanges() {
      const header = document.querySelector('.admin-header');
      const sidebar = document.getElementById('sidebar');
      const overlay = document.querySelector('.mobile-menu-overlay');
      
      if (!header) return;
      
      // রিসাইজ/রোটেশন হলে মোবাইল মেনু ক্লোজ করুন
      if (window.innerWidth > 768) {
        // ডেস্কটপে মোবাইল মেনু ক্লোজ করুন
        if (sidebar && sidebar.classList.contains('mobile-open')) {
          this.toggleSidebar(false);
        }
        
        // ল্যান্ডস্কেপে ওভারলে সরান
        if (overlay) {
          overlay.classList.remove('active');
        }
      }
      
      // ফোন ল্যান্ডস্কেপ মোডে
      if (window.innerWidth > window.innerHeight && window.innerWidth <= 768) {
        // ল্যান্ডস্কেপ: হেডার ছোট করুন
        header.style.height = '50px';
        header.style.padding = '8px 15px';
        
        const title = document.getElementById('pageTitle');
        if (title) {
          title.style.fontSize = '16px';
        }
        
        // সাইডবার উচ্চতা সঠিক করুন
        if (sidebar) {
          sidebar.style.top = '50px';
          sidebar.style.height = 'calc(100vh - 50px)';
        }
        
        // ওভারলে উচ্চতা সঠিক করুন
        if (overlay) {
          overlay.style.top = '50px';
        }
      } else {
        // পোর্ট্রেট বা ডেস্কটপ: নরমাল সাইজ
        header.style.height = '';
        header.style.padding = '';
        
        const title = document.getElementById('pageTitle');
        if (title) {
          title.style.fontSize = '';
        }
        
        // সাইডবার উচ্চতা সঠিক করুন
        if (sidebar) {
          sidebar.style.top = '';
          sidebar.style.height = '';
        }
        
        // ওভারলে উচ্চতা সঠিক করুন
        if (overlay) {
          overlay.style.top = '';
        }
      }
    },
    
    // সাহায্যকারী ফাংশন - ফিক্সড!
    getCurrentPage() {
      const path = window.location.pathname;
      console.log('Current path:', path); // ডিবাগিং
      
      // URL সরাসরি চেক করুন
      if (path.includes('/settings') || path.endsWith('/settings')) return 'settings';
      if (path.includes('/notice') || path.endsWith('/notice')) return 'notice';
      if (path.includes('/management') || path.endsWith('/management')) return 'management';
      if (path.includes('/livechat') || path.endsWith('/livechat')) return 'livechat';
      if (path.includes('/allserial') || path.endsWith('/allserial')) return 'allserial';
      if (path.includes('/dashboard') || path === '/' || path === '' || path.endsWith('/')) return 'dashboard';
      
      // ডিফল্ট
      return 'dashboard';
    },
    
    toggleSidebar(show = null) {
      const sidebar = document.getElementById('sidebar');
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      const overlay = document.querySelector('.mobile-menu-overlay');
      
      if (!sidebar) return;
      
      // শুধু মোবাইল ডিভাইসে কাজ করা উচিত
      if (window.innerWidth > 768) {
        return;
      }
      
      if (show === null) {
        const isOpening = !sidebar.classList.contains('mobile-open');
        sidebar.classList.toggle('mobile-open');
        
        if (overlay) {
          overlay.classList.toggle('active');
        }
        
        // বডি স্ক্রল লক/আনলক
        if (isOpening) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      } else {
        if (show) {
          sidebar.classList.add('mobile-open');
          if (overlay) {
            overlay.classList.add('active');
          }
          document.body.style.overflow = 'hidden';
        } else {
          sidebar.classList.remove('mobile-open');
          if (overlay) {
            overlay.classList.remove('active');
          }
          document.body.style.overflow = '';
        }
      }
      
      // মোবাইল মেনু বাটনের টেক্সট/আইকন পরিবর্তন
      if (mobileMenuBtn) {
        if (sidebar.classList.contains('mobile-open')) {
          mobileMenuBtn.textContent = '✕'; // ক্লোজ আইকন
        } else {
          mobileMenuBtn.textContent = '☰'; // হ্যামবার্গার আইকন
        }
      }
    },
    
    handleLogout() {
      if (confirm('আপনি কি লগআউট করতে চান?')) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/login';
      }
    },
    
    // সব কম্পোনেন্ট একসাথে লোড
    loadAllComponents(pageTitle = 'এডমিন ড্যাশবোর্ড') {
      this.render('header', 'header-container', { title: pageTitle });
      this.render('sidebar', 'sidebar-container');
      this.render('footer', 'footer-container');
      
      // পেজ লোড হওয়ার পর সাইডবার আপডেট করুন
      setTimeout(() => {
        this.initSidebar(); // আবার কল করুন নিশ্চিত হওয়ার জন্য
      }, 100);
      
      // রোটেশন ইভেন্ট লিসেনার যোগ করুন
      const resizeHandler = () => {
        this.handleViewportChanges();
      };
      
      window.addEventListener('resize', resizeHandler);
      window.addEventListener('orientationchange', () => {
        setTimeout(resizeHandler, 100);
      });
      
      // ESC key চাপলে মেনু ক্লোজ
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.toggleSidebar(false);
        }
      });
      
      // URL পরিবর্তন হলে সাইডবার আপডেট
      let lastUrl = window.location.href;
      setInterval(() => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          this.initSidebar(); // নতুন URL এ সাইডবার আপডেট
        }
      }, 500);
    }
  };
  
  // ==================== GLOBAL EXPOSE ====================
  window.ComponentLoader = ComponentLoader;
  
  // DOMContentLoaded হলে অটো লোড
  document.addEventListener('DOMContentLoaded', function() {
    // যদি অটো-লোড করতে চান
    const shouldAutoLoad = document.body.hasAttribute('data-auto-load-components');
    if (shouldAutoLoad) {
      const pageTitle = document.title || 'এডমিন ড্যাশবোর্ড';
      ComponentLoader.loadAllComponents(pageTitle);
    }
  });
  
})();