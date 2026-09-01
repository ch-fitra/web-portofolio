/**
 * admin.js
 * Content Management System (CMS) Dashboard Controller:
 * Tailored for Fashion Design / Atelier / Tata Busana Collections.
 * Handles PIN auth, item CRUD, lookbook media mode settings, profile branding, and export/import.
 */

import { db } from './db.js';

export class AdminCMS {
  constructor(portfolioShowcase) {
    this.showcase = portfolioShowcase;
    this.isAuthenticated = sessionStorage.getItem('app_admin_auth') === 'true';
    this.currentPinInput = '';
    this.editingItemId = null;
    this.uploadedMediaData = null; // base64 / url

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    // Auth & Navigation
    this.openCmsBtn = document.getElementById('open-cms-btn');
    this.closeCmsBtn = document.getElementById('close-cms-btn');
    this.cmsOverlay = document.getElementById('cms-overlay');
    this.pinModal = document.getElementById('pin-modal');
    this.pinDisplayDots = document.querySelectorAll('.pin-dot');
    this.pinErrorMsg = document.getElementById('pin-error-msg');
    this.cmsNavBtns = document.querySelectorAll('.cms-nav-btn');
    this.cmsTabPanes = document.querySelectorAll('.cms-tab-pane');
    this.cmsLogoutBtn = document.getElementById('cms-logout-btn');
    this.cmsBrandName = document.getElementById('cms-brand-name');

    // CMS Dashboard Stats
    this.cmsTotalItems = document.getElementById('cms-stat-items');
    this.cmsTotalPhotos = document.getElementById('cms-stat-photos');
    this.cmsTotalVideos = document.getElementById('cms-stat-videos');
    this.cmsTotalInquiries = document.getElementById('cms-stat-inquiries');

    // Items Manager Elements
    this.cmsItemsTableBody = document.getElementById('cms-items-table-body');
    this.cmsSearchInput = document.getElementById('cms-search-items');
    this.cmsCategoryFilter = document.getElementById('cms-filter-category');
    this.addNewItemBtn = document.getElementById('add-new-item-btn');
    this.itemModal = document.getElementById('item-modal');
    this.itemForm = document.getElementById('item-form');
    this.itemModalTitle = document.getElementById('item-modal-title');
    this.closeItemModalBtn = document.getElementById('close-item-modal-btn');
    this.cancelItemBtn = document.getElementById('cancel-item-btn');

    // Media Upload & Dropzone
    this.mediaDropzone = document.getElementById('media-dropzone');
    this.mediaFileInput = document.getElementById('media-file-input');
    this.mediaUrlInput = document.getElementById('item-media-url');
    this.mediaPreviewContainer = document.getElementById('dropzone-preview');
    this.mediaTypeSelect = document.getElementById('item-media-type');

    // Profile Settings Form
    this.profileForm = document.getElementById('cms-profile-form');
    this.profileAvatarInput = document.getElementById('profile-avatar-input');
    this.profileCoverInput = document.getElementById('profile-cover-input');
    this.profileAvatarPreview = document.getElementById('profile-avatar-preview');
    this.profileCoverPreview = document.getElementById('profile-cover-preview');

    // Categories Manager
    this.categoriesListEl = document.getElementById('cms-categories-list');
    this.addCategoryForm = document.getElementById('add-category-form');

    // Services Manager
    this.servicesListEl = document.getElementById('cms-services-list');
    this.addServiceForm = document.getElementById('add-service-form');

    // Inquiries / Inbox
    this.inboxTableBody = document.getElementById('cms-inbox-table-body');
    this.inboxBadge = document.getElementById('inbox-nav-badge');
    this.messageModal = document.getElementById('message-modal');
    this.messageContentEl = document.getElementById('message-modal-content');
    this.closeMessageModalBtn = document.getElementById('close-message-modal-btn');

    // Data Export / Import / Reset
    this.exportJsonBtn = document.getElementById('export-json-btn');
    this.importJsonInput = document.getElementById('import-json-input');
    this.resetDataBtn = document.getElementById('reset-demo-data-btn');

    // Settings Form
    this.settingsForm = document.getElementById('cms-settings-form');
  }

  bindEvents() {
    // Open CMS / Admin triggers
    if (this.openCmsBtn) {
      this.openCmsBtn.addEventListener('click', () => this.handleOpenCms());
    }

    const footerAdminTrigger = document.getElementById('footer-admin-trigger');
    if (footerAdminTrigger) {
      footerAdminTrigger.addEventListener('click', () => this.handleOpenCms());
    }

    // Double click hero avatar or name to open CMS
    const heroAvatar = document.getElementById('hero-avatar');
    if (heroAvatar) {
      heroAvatar.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.handleOpenCms();
      });
    }

    const heroName = document.getElementById('hero-name');
    if (heroName) {
      heroName.addEventListener('dblclick', (e) => {
        e.preventDefault();
        this.handleOpenCms();
      });
    }

    // Keyboard shortcut: Alt + A or Ctrl + Shift + A
    window.addEventListener('keydown', (e) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault();
        this.handleOpenCms();
      }
    });

    // Hash change trigger: #admin or #studio
    const checkHash = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#studio') {
        this.handleOpenCms();
      }
    };
    window.addEventListener('hashchange', checkHash);
    checkHash();

    if (this.closeCmsBtn) {
      this.closeCmsBtn.addEventListener('click', () => this.closeCms());
    }

    if (this.cmsLogoutBtn) {
      this.cmsLogoutBtn.addEventListener('click', () => this.logout());
    }

    // PIN Keypad buttons
    document.querySelectorAll('.pin-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.key;
        if (val === 'clear') {
          this.currentPinInput = '';
        } else if (val === 'backspace') {
          this.currentPinInput = this.currentPinInput.slice(0, -1);
        } else if (this.currentPinInput.length < 4) {
          this.currentPinInput += val;
        }
        this.updatePinDisplay();
      });
    });

    // Keyboard support for PIN modal
    window.addEventListener('keydown', (e) => {
      if (!this.pinModal || !this.pinModal.classList.contains('active')) return;
      if (e.key >= '0' && e.key <= '9' && this.currentPinInput.length < 4) {
        this.currentPinInput += e.key;
        this.updatePinDisplay();
      } else if (e.key === 'Backspace') {
        this.currentPinInput = this.currentPinInput.slice(0, -1);
        this.updatePinDisplay();
      } else if (e.key === 'Escape') {
        this.closePinModal();
      }
    });

    // Close PIN modal on backdrop
    const closePinBtn = document.getElementById('close-pin-modal-btn');
    if (closePinBtn) closePinBtn.addEventListener('click', () => this.closePinModal());

    // Tab Navigation
    this.cmsNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Items CRUD Actions
    if (this.addNewItemBtn) {
      this.addNewItemBtn.addEventListener('click', () => this.openItemModal(null));
    }

    if (this.closeItemModalBtn) {
      this.closeItemModalBtn.addEventListener('click', () => this.closeItemModal());
    }

    if (this.cancelItemBtn) {
      this.cancelItemBtn.addEventListener('click', () => this.closeItemModal());
    }

    if (this.itemForm) {
      this.itemForm.addEventListener('submit', (e) => this.handleSaveItem(e));
    }

    // Media Dropzone & File Upload
    if (this.mediaDropzone) {
      this.mediaDropzone.addEventListener('click', () => this.mediaFileInput.click());
      this.mediaDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.mediaDropzone.classList.add('dragover');
      });
      this.mediaDropzone.addEventListener('dragleave', () => {
        this.mediaDropzone.classList.remove('dragover');
      });
      this.mediaDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.mediaDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });
    }

    if (this.mediaFileInput) {
      this.mediaFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    if (this.mediaUrlInput) {
      this.mediaUrlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
          this.uploadedMediaData = url;
          this.renderMediaPreview(url, this.mediaTypeSelect.value);
        }
      });
    }

    if (this.mediaTypeSelect) {
      this.mediaTypeSelect.addEventListener('change', () => {
        if (this.uploadedMediaData) {
          this.renderMediaPreview(this.uploadedMediaData, this.mediaTypeSelect.value);
        }
      });
    }

    // CMS Items filter & search
    if (this.cmsSearchInput) {
      this.cmsSearchInput.addEventListener('input', () => this.renderItemsTable());
    }
    if (this.cmsCategoryFilter) {
      this.cmsCategoryFilter.addEventListener('change', () => this.renderItemsTable());
    }

    // Profile Form Submit
    if (this.profileForm) {
      this.profileForm.addEventListener('submit', (e) => this.handleSaveProfile(e));
    }

    // Category Form Submit
    if (this.addCategoryForm) {
      this.addCategoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));
    }

    // Service Form Submit
    if (this.addServiceForm) {
      this.addServiceForm.addEventListener('submit', (e) => this.handleAddService(e));
    }

    // Settings Form Submit
    if (this.settingsForm) {
      this.settingsForm.addEventListener('submit', (e) => this.handleSaveSettings(e));
    }

    // Data Export
    if (this.exportJsonBtn) {
      this.exportJsonBtn.addEventListener('click', () => this.handleExportData());
    }

    // Data Import
    if (this.importJsonInput) {
      this.importJsonInput.addEventListener('change', (e) => this.handleImportData(e));
    }

    // Reset Data
    if (this.resetDataBtn) {
      this.resetDataBtn.addEventListener('click', () => this.handleResetData());
    }

    // Message modal close
    if (this.closeMessageModalBtn) {
      this.closeMessageModalBtn.addEventListener('click', () => {
        this.messageModal.classList.remove('active');
      });
    }
  }

  // --- Auth & Navigation Flow ---

  handleOpenCms() {
    if (this.isAuthenticated) {
      this.openCms();
    } else {
      this.openPinModal();
    }
  }

  openPinModal() {
    this.currentPinInput = '';
    this.updatePinDisplay();
    if (this.pinErrorMsg) this.pinErrorMsg.textContent = '';
    this.pinModal.classList.add('active');
  }

  closePinModal() {
    this.pinModal.classList.remove('active');
  }

  updatePinDisplay() {
    this.pinDisplayDots.forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < this.currentPinInput.length);
    });

    if (this.currentPinInput.length === 4) {
      setTimeout(() => this.verifyEnteredPin(), 120);
    }
  }

  verifyEnteredPin() {
    if (db.verifyAdminPin(this.currentPinInput)) {
      this.isAuthenticated = true;
      sessionStorage.setItem('app_admin_auth', 'true');
      this.closePinModal();
      this.openCms();
      if (window.showToast) window.showToast('Login Pengelola Atelier Berhasil!', 'success');
    } else {
      if (this.pinErrorMsg) {
        this.pinErrorMsg.textContent = 'PIN Salah! Default PIN adalah 1234';
      }
      this.currentPinInput = '';
      this.updatePinDisplay();
      if (window.showToast) window.showToast('PIN tidak sesuai!', 'error');
    }
  }

  openCms() {
    this.cmsOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.loadAllCmsData();
  }

  closeCms() {
    this.cmsOverlay.classList.remove('active');
    document.body.style.overflow = '';
    this.showcase.loadAndRender();
  }

  logout() {
    this.isAuthenticated = false;
    sessionStorage.removeItem('app_admin_auth');
    this.closeCms();
    if (window.showToast) window.showToast('Berhasil keluar dari mode pengelola', 'info');
  }

  switchTab(tabId) {
    this.cmsNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    this.cmsTabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    const activeBtn = document.querySelector(`.cms-nav-btn[data-tab="${tabId}"]`);
    const titleEl = document.getElementById('cms-current-view-title');
    if (titleEl && activeBtn) {
      titleEl.textContent = activeBtn.textContent.trim();
    }
  }

  async loadAllCmsData() {
    const profile = db.getProfile();
    if (this.cmsBrandName) {
      this.cmsBrandName.textContent = profile.brandName || profile.name || 'Studio Manager';
    }

    await this.renderDashboardStats();
    await this.renderItemsTable();
    this.populateProfileForm();
    this.populateCategoriesList();
    this.populateServicesList();
    this.renderInbox();
    this.populateSettingsForm();
  }

  // --- Dashboard Stats ---

  async renderDashboardStats() {
    const items = await db.getAllItems();
    const photos = items.filter(i => i.mediaType === 'photo').length;
    const videos = items.filter(i => i.mediaType === 'video').length;
    const inquiries = db.getInquiries();
    const unreadInquiries = inquiries.filter(i => !i.read).length;

    if (this.cmsTotalItems) this.cmsTotalItems.textContent = items.length;
    if (this.cmsTotalPhotos) this.cmsTotalPhotos.textContent = photos;
    if (this.cmsTotalVideos) this.cmsTotalVideos.textContent = videos;
    if (this.cmsTotalInquiries) this.cmsTotalInquiries.textContent = inquiries.length;

    if (this.inboxBadge) {
      this.inboxBadge.textContent = unreadInquiries;
      this.inboxBadge.style.display = unreadInquiries > 0 ? 'inline-block' : 'none';
    }
  }

  // --- Portfolio Items Manager ---

  async renderItemsTable() {
    if (!this.cmsItemsTableBody) return;

    let items = await db.getAllItems();
    const categories = db.getCategories();

    if (this.cmsCategoryFilter) {
      let optionsHtml = '<option value="all">Semua Kategori Koleksi</option>';
      categories.forEach(cat => {
        if (cat.id !== 'all') {
          optionsHtml += `<option value="${cat.id}">${cat.name}</option>`;
        }
      });
      this.cmsCategoryFilter.innerHTML = optionsHtml;
    }

    const formCategorySelect = document.getElementById('item-category');
    if (formCategorySelect) {
      let catOptions = '';
      categories.forEach(cat => {
        if (cat.id !== 'all') {
          catOptions += `<option value="${cat.id}">${cat.name}</option>`;
        }
      });
      formCategorySelect.innerHTML = catOptions;
    }

    const searchQuery = (this.cmsSearchInput ? this.cmsSearchInput.value : '').toLowerCase().trim();
    const categoryFilter = this.cmsCategoryFilter ? this.cmsCategoryFilter.value : 'all';

    if (categoryFilter !== 'all') {
      items = items.filter(i => i.category === categoryFilter);
    }

    if (searchQuery) {
      items = items.filter(i => (i.title || '').toLowerCase().includes(searchQuery));
    }

    if (items.length === 0) {
      this.cmsItemsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Tidak ada koleksi busana yang ditemukan.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    items.forEach(item => {
      const isVideo = item.mediaType === 'video';
      const categoryObj = categories.find(c => c.id === item.category);
      const catName = categoryObj ? categoryObj.name : item.category;
      const mediaThumb = item.thumbnailUrl || item.videoPoster || item.mediaUrl;

      html += `
        <tr>
          <td>
            <img src="${mediaThumb}" alt="${item.title}" class="item-thumb-preview">
          </td>
          <td>
            <strong>${item.title}</strong>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${item.year || '2024'} • ${item.client || '-'}</div>
          </td>
          <td>
            <span class="badge ${isVideo ? 'badge-video' : 'badge-photo'}">
              <i class="fas ${isVideo ? 'fa-play' : 'fa-camera'}"></i> ${isVideo ? 'Video Runway' : 'Foto'}
            </span>
          </td>
          <td>
            <span class="badge badge-primary">${catName}</span>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">
              <i class="far fa-heart" style="color: var(--accent-secondary);"></i> ${item.likes || 0}
              &nbsp;
              <i class="far fa-eye" style="color: var(--accent-cyan);"></i> ${item.views || 0}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary btn-sm edit-item-btn" data-id="${item.id}" title="Edit Busana">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-danger btn-sm delete-item-btn" data-id="${item.id}" title="Hapus Busana">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    this.cmsItemsTableBody.innerHTML = html;

    this.cmsItemsTableBody.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        this.openItemModal(id);
      });
    });

    this.cmsItemsTableBody.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Apakah Anda yakin ingin menghapus koleksi busana ini?')) {
          await db.deleteItem(id);
          if (window.showToast) window.showToast('Koleksi berhasil dihapus.', 'success');
          this.loadAllCmsData();
        }
      });
    });
  }

  // --- Modal Add / Edit Portfolio Item ---

  async openItemModal(itemId = null) {
    this.editingItemId = itemId;
    this.uploadedMediaData = null;
    this.itemForm.reset();
    this.mediaPreviewContainer.classList.remove('has-media');
    this.mediaPreviewContainer.innerHTML = '';

    if (itemId) {
      this.itemModalTitle.textContent = 'Edit Busana / Karya';
      const item = await db.getItemById(itemId);
      if (item) {
        document.getElementById('item-title').value = item.title || '';
        document.getElementById('item-category').value = item.category || 'couture';
        document.getElementById('item-media-type').value = item.mediaType || 'photo';
        document.getElementById('item-media-url').value = item.mediaUrl || '';
        document.getElementById('item-excerpt').value = item.excerpt || '';
        document.getElementById('item-description').value = item.description || '';
        document.getElementById('item-client').value = item.client || '';
        document.getElementById('item-year').value = item.year || '2024';
        document.getElementById('item-tools').value = Array.isArray(item.tools) ? item.tools.join(', ') : (item.tools || '');
        document.getElementById('item-project-url').value = item.projectUrl || '';
        document.getElementById('item-featured').checked = !!item.featured;

        this.uploadedMediaData = item.mediaUrl;
        this.renderMediaPreview(item.mediaUrl, item.mediaType);
      }
    } else {
      this.itemModalTitle.textContent = 'Tambah Koleksi Busana Baru';
      document.getElementById('item-year').value = new Date().getFullYear().toString();
    }

    this.itemModal.classList.add('active');
  }

  closeItemModal() {
    this.itemModal.classList.remove('active');
  }

  handleFileSelected(file) {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      if (window.showToast) window.showToast('Format file harus berupa foto atau video!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedMediaData = e.target.result;
      if (this.mediaTypeSelect) {
        this.mediaTypeSelect.value = isVideo ? 'video' : 'photo';
      }
      this.renderMediaPreview(this.uploadedMediaData, isVideo ? 'video' : 'photo');
      if (window.showToast) window.showToast(`File ${file.name} siap diunggah`, 'info');
    };
    reader.readAsDataURL(file);
  }

  renderMediaPreview(url, type) {
    if (!url) return;
    this.mediaPreviewContainer.classList.add('has-media');

    if (type === 'video') {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        this.mediaPreviewContainer.innerHTML = `<div style="padding: 1rem; color: #fff;"><i class="fab fa-youtube" style="color:red; font-size:2rem;"></i> Video Runway YouTube Terhubung</div>`;
      } else {
        this.mediaPreviewContainer.innerHTML = `<video src="${url}" controls style="max-height: 200px; width: 100%;"></video>`;
      }
    } else {
      this.mediaPreviewContainer.innerHTML = `<img src="${url}" alt="Preview" style="max-height: 200px; object-fit: contain;">`;
    }
  }

  async handleSaveItem(e) {
    e.preventDefault();

    const title = document.getElementById('item-title').value.trim();
    const category = document.getElementById('item-category').value;
    const mediaType = document.getElementById('item-media-type').value;
    let mediaUrl = document.getElementById('item-media-url').value.trim();
    const excerpt = document.getElementById('item-excerpt').value.trim();
    const description = document.getElementById('item-description').value.trim();
    const client = document.getElementById('item-client').value.trim();
    const year = document.getElementById('item-year').value.trim();
    const toolsStr = document.getElementById('item-tools').value.trim();
    const projectUrl = document.getElementById('item-project-url').value.trim();
    const featured = document.getElementById('item-featured').checked;

    if (!title) {
      if (window.showToast) window.showToast('Nama/Judul busana wajib diisi!', 'error');
      return;
    }

    if (this.uploadedMediaData) {
      mediaUrl = this.uploadedMediaData;
    }

    if (!mediaUrl) {
      if (window.showToast) window.showToast('Silakan pilih file foto/video atau masukkan URL media!', 'error');
      return;
    }

    const tools = toolsStr ? toolsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    let existingItem = null;
    if (this.editingItemId) {
      existingItem = await db.getItemById(this.editingItemId);
    }

    const itemData = {
      ...(existingItem || {}),
      id: this.editingItemId || undefined,
      title,
      category,
      mediaType,
      mediaUrl,
      thumbnailUrl: mediaType === 'photo' ? mediaUrl : (existingItem ? existingItem.thumbnailUrl : mediaUrl),
      videoPoster: mediaType === 'video' ? (existingItem ? existingItem.videoPoster : '') : '',
      excerpt,
      description,
      client,
      year: year || new Date().getFullYear().toString(),
      tools,
      projectUrl,
      featured,
      likes: existingItem ? (existingItem.likes || 0) : 0,
      views: existingItem ? (existingItem.views || 0) : 0
    };

    await db.saveItem(itemData);
    this.closeItemModal();

    if (window.showToast) {
      window.showToast(this.editingItemId ? 'Koleksi busana berhasil diperbarui!' : 'Koleksi busana baru berhasil ditambahkan!', 'success');
    }

    await this.loadAllCmsData();
  }

  // --- Profile Settings ---

  populateProfileForm() {
    const profile = db.getProfile();
    if (!profile || !this.profileForm) return;

    document.getElementById('profile-name').value = profile.name || '';
    document.getElementById('profile-brand-name').value = profile.brandName || '';
    document.getElementById('profile-title-input').value = profile.title || '';
    document.getElementById('profile-status-text').value = profile.statusText || '';
    document.getElementById('profile-bio-input').value = profile.bio || '';
    document.getElementById('profile-about-input').value = profile.about || '';
    document.getElementById('profile-avatar-url').value = profile.avatar || '';
    document.getElementById('profile-cover-url').value = profile.coverImage || '';
    document.getElementById('profile-exp').value = profile.experienceYears || 0;
    document.getElementById('profile-proj').value = profile.projectsCount || 0;
    document.getElementById('profile-clients').value = profile.clientsCount || 0;

    document.getElementById('profile-location').value = profile.location || '';
    document.getElementById('profile-email').value = profile.email || '';
    document.getElementById('profile-phone').value = profile.phone || '';
    document.getElementById('profile-whatsapp').value = profile.whatsapp || '';

    // Socials
    if (profile.socialLinks) {
      if (document.getElementById('profile-instagram')) document.getElementById('profile-instagram').value = profile.socialLinks.instagram || '';
      if (document.getElementById('profile-youtube')) document.getElementById('profile-youtube').value = profile.socialLinks.youtube || '';
      if (document.getElementById('profile-behance')) document.getElementById('profile-behance').value = profile.socialLinks.behance || '';
      if (document.getElementById('profile-linkedin')) document.getElementById('profile-linkedin').value = profile.socialLinks.linkedin || '';
      if (document.getElementById('profile-twitter')) document.getElementById('profile-twitter').value = profile.socialLinks.twitter || profile.socialLinks.tiktok || '';
      if (document.getElementById('profile-dribbble')) document.getElementById('profile-dribbble').value = profile.socialLinks.dribbble || profile.socialLinks.website || '';
    }

    if (this.profileAvatarPreview && profile.avatar) {
      this.profileAvatarPreview.src = profile.avatar;
    }
  }

  handleSaveProfile(e) {
    e.preventDefault();

    const profile = db.getProfile();
    profile.name = document.getElementById('profile-name').value.trim();
    profile.brandName = document.getElementById('profile-brand-name').value.trim();
    profile.title = document.getElementById('profile-title-input').value.trim();
    profile.statusText = document.getElementById('profile-status-text').value.trim();
    profile.bio = document.getElementById('profile-bio-input').value.trim();
    profile.about = document.getElementById('profile-about-input').value.trim();
    profile.avatar = document.getElementById('profile-avatar-url').value.trim();
    profile.coverImage = document.getElementById('profile-cover-url').value.trim();
    profile.experienceYears = parseInt(document.getElementById('profile-exp').value, 10) || 0;
    profile.projectsCount = parseInt(document.getElementById('profile-proj').value, 10) || 0;
    profile.clientsCount = parseInt(document.getElementById('profile-clients').value, 10) || 0;

    profile.location = document.getElementById('profile-location').value.trim();
    profile.email = document.getElementById('profile-email').value.trim();
    profile.phone = document.getElementById('profile-phone').value.trim();
    profile.whatsapp = document.getElementById('profile-whatsapp').value.trim();

    profile.socialLinks = {
      instagram: (document.getElementById('profile-instagram')?.value || '').trim(),
      youtube: (document.getElementById('profile-youtube')?.value || '').trim(),
      behance: (document.getElementById('profile-behance')?.value || '').trim(),
      linkedin: (document.getElementById('profile-linkedin')?.value || '').trim(),
      twitter: (document.getElementById('profile-twitter')?.value || '').trim(),
      dribbble: (document.getElementById('profile-dribbble')?.value || '').trim()
    };

    db.saveProfile(profile);
    if (this.cmsBrandName) {
      this.cmsBrandName.textContent = profile.brandName || profile.name || 'Studio Manager';
    }

    if (window.showToast) window.showToast('Pengaturan Profil & Media Sosial berhasil disimpan!', 'success');
    this.showcase.loadAndRender();
  }

  // --- Category Management ---

  populateCategoriesList() {
    if (!this.categoriesListEl) return;
    const categories = db.getCategories();

    let html = '';
    categories.forEach(cat => {
      if (cat.id === 'all') return;
      html += `
        <div class="glass-card" style="padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
          <div style="display: flex; align-items: center; gap: 0.8rem;">
            <i class="${this.showcase.getCategoryIcon(cat.icon || cat.id)}" style="color: var(--accent-primary);"></i>
            <div>
              <strong>${cat.name}</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">ID Kategori: ${cat.id}</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm delete-cat-btn" data-id="${cat.id}" title="Hapus Kategori">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    });

    this.categoriesListEl.innerHTML = html;

    this.categoriesListEl.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.id;
        let cats = db.getCategories().filter(c => c.id !== catId);
        db.saveCategories(cats);
        this.populateCategoriesList();
        if (window.showToast) window.showToast('Kategori berhasil dihapus.', 'info');
      });
    });
  }

  handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value.trim();
    const icon = document.getElementById('new-cat-icon').value.trim() || 'scissors';

    if (!name) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const categories = db.getCategories();

    if (categories.some(c => c.id === id)) {
      if (window.showToast) window.showToast('Kategori ini sudah ada!', 'error');
      return;
    }

    categories.push({ id, name, icon });
    db.saveCategories(categories);
    this.addCategoryForm.reset();
    this.populateCategoriesList();
    if (window.showToast) window.showToast(`Kategori "${name}" berhasil ditambahkan!`, 'success');
  }

  // --- Services Management ---

  populateServicesList() {
    if (!this.servicesListEl) return;
    const services = db.getServices();

    let html = '';
    services.forEach(serv => {
      html += `
        <div class="glass-card" style="padding: 1.2rem; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <i class="${this.showcase.getCategoryIcon(serv.icon)}" style="color: var(--accent-primary);"></i>
              <strong>${serv.title}</strong>
            </div>
            <button class="btn btn-outline btn-sm delete-serv-btn" data-id="${serv.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary);">${serv.description}</p>
        </div>
      `;
    });

    this.servicesListEl.innerHTML = html;

    this.servicesListEl.querySelectorAll('.delete-serv-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        let servs = db.getServices().filter(s => s.id !== id);
        db.saveServices(servs);
        this.populateServicesList();
        if (window.showToast) window.showToast('Layanan berhasil dihapus.', 'info');
      });
    });
  }

  handleAddService(e) {
    e.preventDefault();
    const title = document.getElementById('new-serv-title').value.trim();
    const description = document.getElementById('new-serv-desc').value.trim();
    const icon = document.getElementById('new-serv-icon').value || 'scissors';

    if (!title || !description) return;

    const services = db.getServices();
    services.push({
      id: 'serv_' + Date.now(),
      title,
      description,
      icon
    });

    db.saveServices(services);
    this.addServiceForm.reset();
    this.populateServicesList();
    if (window.showToast) window.showToast('Layanan baru berhasil ditambahkan!', 'success');
  }

  // --- Inbox Messages ---

  renderInbox() {
    if (!this.inboxTableBody) return;
    const inquiries = db.getInquiries();

    if (inquiries.length === 0) {
      this.inboxTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Kotak masuk kosong. Belum ada pesan atau permintaan konsultasi dari pengunjung.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    inquiries.forEach(inq => {
      const dateStr = new Date(inq.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      html += `
        <tr style="${inq.read ? '' : 'background: rgba(99, 102, 241, 0.06); font-weight: 600;'}">
          <td>
            ${inq.read ? '' : '<span class="badge badge-primary" style="font-size:0.7rem;">Baru</span>'}
            ${dateStr}
          </td>
          <td>${inq.name}</td>
          <td>${inq.email || '-'}</td>
          <td>${inq.subject || '-'}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary btn-sm view-inq-btn" data-id="${inq.id}">
                <i class="fas fa-eye"></i> Buka
              </button>
              <button class="btn btn-danger btn-sm delete-inq-btn" data-id="${inq.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    this.inboxTableBody.innerHTML = html;

    this.inboxTableBody.querySelectorAll('.view-inq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const inq = db.getInquiries().find(i => i.id === btn.dataset.id);
        if (inq) {
          db.markInquiryAsRead(inq.id);
          this.showMessageModal(inq);
          this.renderInbox();
          this.renderDashboardStats();
        }
      });
    });

    this.inboxTableBody.querySelectorAll('.delete-inq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        db.deleteInquiry(btn.dataset.id);
        this.renderInbox();
        this.renderDashboardStats();
        if (window.showToast) window.showToast('Pesan dihapus.', 'info');
      });
    });
  }

  showMessageModal(inq) {
    if (!this.messageModal || !this.messageContentEl) return;

    this.messageContentEl.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin-bottom: 0.4rem;">${inq.subject || 'Pesan Konsultasi Busana'}</h3>
        <div style="font-size: 0.9rem; color: var(--text-muted);">
          Dari: <strong>${inq.name}</strong> (${inq.email}) • Telp/WA: ${inq.phone || '-'}
        </div>
      </div>
      <div style="padding: 1.25rem; background: var(--bg-tertiary); border-radius: var(--radius-md); border: 1px solid var(--border-color); white-space: pre-line; line-height: 1.7;">
        ${inq.message}
      </div>
      <div style="margin-top: 1.5rem; display: flex; gap: 0.8rem; justify-content: flex-end;">
        ${inq.phone ? `
          <a href="https://wa.me/${inq.phone.replace(/\D/g, '')}" target="_blank" class="btn btn-primary btn-sm">
            <i class="fab fa-whatsapp"></i> Balas via WhatsApp
          </a>
        ` : ''}
        ${inq.email ? `
          <a href="mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}" class="btn btn-secondary btn-sm">
            <i class="fas fa-envelope"></i> Balas Email
          </a>
        ` : ''}
      </div>
    `;

    this.messageModal.classList.add('active');
  }

  // --- Settings Form ---

  populateSettingsForm() {
    const settings = db.getSettings();
    if (!settings || !this.settingsForm) return;

    document.getElementById('settings-pin').value = settings.adminPin || '1234';
    document.getElementById('settings-theme').value = settings.theme || 'dark';
    document.getElementById('settings-site-title').value = settings.siteTitle || 'Portofolio Busana';
    document.getElementById('settings-btn-label').value = settings.adminButtonLabel || 'Studio Manager';
    document.getElementById('settings-footer-text').value = settings.footerText || 'Hak cipta busana & desain dilindungi undang-undang.';

    // Fashion media filter settings
    if (document.getElementById('settings-media-mode')) {
      document.getElementById('settings-media-mode').value = settings.mediaFilterMode || 'all';
    }
    if (document.getElementById('settings-show-media-btns')) {
      document.getElementById('settings-show-media-btns').checked = settings.showMediaFilterButtons !== false;
    }
    if (document.getElementById('settings-show-category-filter')) {
      document.getElementById('settings-show-category-filter').checked = settings.showCategoryFilter !== false;
    }
  }

  handleSaveSettings(e) {
    e.preventDefault();
    const settings = db.getSettings();
    const newPin = document.getElementById('settings-pin').value.trim();
    const newTheme = document.getElementById('settings-theme').value;
    const siteTitle = document.getElementById('settings-site-title').value.trim();
    const adminButtonLabel = document.getElementById('settings-btn-label').value.trim();
    const footerText = document.getElementById('settings-footer-text').value.trim();

    const mediaFilterMode = document.getElementById('settings-media-mode').value;
    const showMediaFilterButtons = document.getElementById('settings-show-media-btns').checked;
    const showCategoryFilter = document.getElementById('settings-show-category-filter').checked;

    if (!newPin || newPin.length < 4) {
      if (window.showToast) window.showToast('PIN harus minimal 4 karakter!', 'error');
      return;
    }

    settings.adminPin = newPin;
    settings.theme = newTheme;
    settings.siteTitle = siteTitle;
    settings.adminButtonLabel = adminButtonLabel || 'Studio Manager';
    settings.footerText = footerText;
    settings.mediaFilterMode = mediaFilterMode;
    settings.showMediaFilterButtons = showMediaFilterButtons;
    settings.showCategoryFilter = showCategoryFilter;

    db.saveSettings(settings);
    if (window.setTheme) window.setTheme(newTheme);
    document.title = siteTitle;

    if (window.showToast) window.showToast('Pengaturan tampilan galeri & sistem berhasil disimpan!', 'success');
    this.showcase.loadAndRender();
  }

  // --- Export, Import, Reset Data ---

  async handleExportData() {
    try {
      const data = await db.exportAllData();
      const profile = db.getProfile();
      const safeName = (profile.name || 'fashion_portfolio').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (window.showToast) window.showToast('Data Portofolio Busana berhasil diekspor ke JSON!', 'success');
    } catch (err) {
      console.error(err);
      if (window.showToast) window.showToast('Gagal mengekspor data!', 'error');
    }
  }

  async handleImportData(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          await db.importAllData(parsed);
          if (window.showToast) window.showToast('Data busana berhasil diimpor & dipulihkan!', 'success');
          await this.loadAllCmsData();
          this.showcase.loadAndRender();
        } catch (parseErr) {
          if (window.showToast) window.showToast('File JSON tidak valid!', 'error');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      if (window.showToast) window.showToast('Gagal membaca file JSON!', 'error');
    }
  }

  async handleResetData() {
    if (confirm('Apakah Anda yakin ingin mereset data ke contoh koleksi busana awal?')) {
      await db.resetToDefaultData();
      if (window.showToast) window.showToast('Data berhasil direset ke contoh koleksi busana.', 'info');
      await this.loadAllCmsData();
      this.showcase.loadAndRender();
    }
  }
}
