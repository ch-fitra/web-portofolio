/**
 * portfolio.js
 * Visitor Portfolio Showcase Controller:
 * Tailored for Fashion Design / Tata Busana Lookbook & Collections.
 * Handles rendering items, categories, media mode filters, live search, and lightbox.
 */

import { db } from './db.js';

export class PortfolioShowcase {
  constructor() {
    this.items = [];
    this.categories = [];
    this.profile = null;
    this.services = [];
    this.settings = {};

    this.activeCategory = 'all';
    this.activeMediaType = 'all'; // 'all' | 'photo' | 'video'
    this.searchQuery = '';
    this.currentLightboxIndex = 0;
    this.filteredItems = [];

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    // Brand & Header Elements
    this.brandLogoText = document.getElementById('brand-logo-text');
    this.footerBrandName = document.getElementById('footer-brand-name');
    this.footerCustomText = document.getElementById('footer-custom-text');
    this.adminBtnLabel = document.getElementById('admin-btn-label');

    // Hero & Profile Elements
    this.heroBanner = document.getElementById('hero-banner-bg');
    this.profileAvatar = document.getElementById('hero-avatar');
    this.profileName = document.getElementById('hero-name');
    this.profileTitle = document.getElementById('hero-title');
    this.profileBio = document.getElementById('hero-bio');
    this.statusBadge = document.getElementById('status-badge-text');
    this.socialLinksContainer = document.getElementById('social-links-bar');
    this.expStat = document.getElementById('stat-exp');
    this.projStat = document.getElementById('stat-proj');
    this.clientStat = document.getElementById('stat-clients');
    this.totalItemsStat = document.getElementById('stat-total-items');

    // Portfolio Gallery Elements
    this.galleryGrid = document.getElementById('portfolio-grid');
    this.categoryPillsContainer = document.getElementById('category-pills');
    this.mediaTypePillsContainer = document.querySelector('.media-type-pills');
    this.mediaTypeButtons = document.querySelectorAll('.media-type-btn');
    this.searchInput = document.getElementById('portfolio-search');
    this.searchClearBtn = document.getElementById('search-clear-btn');
    this.resultsCountEl = document.getElementById('results-count');

    // Services Elements
    this.servicesGrid = document.getElementById('services-grid');

    // Lightbox Elements
    this.lightboxModal = document.getElementById('lightbox-modal');
    this.lightboxMediaBox = document.getElementById('lightbox-media-box');
    this.lightboxTitle = document.getElementById('lightbox-title');
    this.lightboxDescription = document.getElementById('lightbox-desc');
    this.lightboxCategoryBadge = document.getElementById('lightbox-category');
    this.lightboxYear = document.getElementById('lightbox-year');
    this.lightboxClient = document.getElementById('lightbox-client');
    this.lightboxTools = document.getElementById('lightbox-tools');
    this.lightboxProjectLink = document.getElementById('lightbox-project-link');
    this.lightboxLikeBtn = document.getElementById('lightbox-like-btn');
    this.lightboxLikeCount = document.getElementById('lightbox-like-count');
    this.lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    this.lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
    this.lightboxNextBtn = document.getElementById('lightbox-next-btn');

    // Contact Elements
    this.contactForm = document.getElementById('contact-form');
    this.contactEmailEl = document.getElementById('contact-email-val');
    this.contactPhoneEl = document.getElementById('contact-phone-val');
    this.contactLocationEl = document.getElementById('contact-loc-val');
    this.whatsappDirectBtn = document.getElementById('whatsapp-direct-btn');
  }

  bindEvents() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        if (this.searchClearBtn) {
          this.searchClearBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
        this.renderGallery();
      });
    }

    if (this.searchClearBtn) {
      this.searchClearBtn.addEventListener('click', () => {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.searchClearBtn.style.display = 'none';
        this.renderGallery();
      });
    }

    // Media Type filter buttons (All / Photo / Video)
    this.mediaTypeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.mediaTypeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeMediaType = btn.dataset.type || 'all';
        this.renderGallery();
      });
    });

    // Lightbox Controls
    if (this.lightboxCloseBtn) {
      this.lightboxCloseBtn.addEventListener('click', () => this.closeLightbox());
    }

    if (this.lightboxPrevBtn) {
      this.lightboxPrevBtn.addEventListener('click', () => this.navigateLightbox(-1));
    }

    if (this.lightboxNextBtn) {
      this.lightboxNextBtn.addEventListener('click', () => this.navigateLightbox(1));
    }

    if (this.lightboxModal) {
      this.lightboxModal.addEventListener('click', (e) => {
        if (e.target === this.lightboxModal) {
          this.closeLightbox();
        }
      });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!this.lightboxModal.classList.contains('active')) return;
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
      if (e.key === 'ArrowRight') this.navigateLightbox(1);
    });

    // Contact Form submission
    if (this.contactForm) {
      this.contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
    }
  }

  async loadAndRender() {
    this.items = await db.getAllItems();
    this.categories = db.getCategories();
    this.profile = db.getProfile();
    this.services = db.getServices();
    this.settings = db.getSettings();

    // Configure media filter mode
    if (this.settings.mediaFilterMode === 'photo_only') {
      this.activeMediaType = 'photo';
    } else if (this.settings.mediaFilterMode === 'video_only') {
      this.activeMediaType = 'video';
    } else {
      this.activeMediaType = 'all';
    }

    this.applyFilterVisibility();
    this.renderProfile();
    this.renderCategoryPills();
    this.renderServices();
    this.renderGallery();
  }

  applyFilterVisibility() {
    // Show/Hide Media Type buttons row based on settings
    if (this.mediaTypePillsContainer) {
      const showMediaBtns = this.settings.showMediaFilterButtons !== false && this.settings.mediaFilterMode === 'all';
      this.mediaTypePillsContainer.style.display = showMediaBtns ? 'inline-flex' : 'none';
    }

    // Show/Hide Category pills row based on settings
    if (this.categoryPillsContainer) {
      const showCategoryRow = this.settings.showCategoryFilter !== false;
      this.categoryPillsContainer.style.display = showCategoryRow ? 'flex' : 'none';
    }
  }

  renderProfile() {
    if (!this.profile) return;
    const settings = this.settings || {};

    // Brand Logo Name in Header
    if (this.brandLogoText) {
      const displayName = this.profile.brandName || this.profile.name || 'Atelier';
      const parts = displayName.split(' ');
      if (parts.length > 1) {
        this.brandLogoText.innerHTML = `${parts[0]} <span class="gradient-text">${parts.slice(1).join(' ')}</span>`;
      } else {
        this.brandLogoText.innerHTML = `${displayName}<span class="gradient-text">.</span>`;
      }
    }

    // Footer Branding
    if (this.footerBrandName) {
      this.footerBrandName.textContent = this.profile.name || 'Fashion Atelier';
    }
    if (this.footerCustomText) {
      this.footerCustomText.textContent = settings.footerText || 'Hak cipta busana & desain dilindungi undang-undang.';
    }
    if (this.adminBtnLabel) {
      this.adminBtnLabel.textContent = settings.adminButtonLabel || 'Studio Manager';
    }

    // Hero Section Details
    if (this.heroBanner && this.profile.coverImage) {
      this.heroBanner.style.backgroundImage = `url('${this.profile.coverImage}')`;
    }
    if (this.profileAvatar && this.profile.avatar) {
      this.profileAvatar.src = this.profile.avatar;
      this.profileAvatar.alt = this.profile.name || 'Avatar';
    }
    if (this.profileName) this.profileName.textContent = this.profile.name || 'Fashion Designer';
    if (this.profileTitle) this.profileTitle.textContent = this.profile.title || '';
    if (this.profileBio) this.profileBio.textContent = this.profile.bio || '';
    if (this.statusBadge) this.statusBadge.textContent = this.profile.statusText || 'Menerima Pesanan Custom';

    if (this.expStat) this.expStat.textContent = `${this.profile.experienceYears || 0}+`;
    if (this.projStat) this.projStat.textContent = `${this.profile.projectsCount || 0}+`;
    if (this.clientStat) this.clientStat.textContent = `${this.profile.clientsCount || 0}+`;
    if (this.totalItemsStat) this.totalItemsStat.textContent = `${this.items.length}`;

    // Contact section details
    if (this.contactEmailEl) this.contactEmailEl.textContent = this.profile.email || '-';
    if (this.contactPhoneEl) this.contactPhoneEl.textContent = this.profile.phone || '-';
    if (this.contactLocationEl) this.contactLocationEl.textContent = this.profile.location || '-';

    if (this.whatsappDirectBtn && this.profile.whatsapp) {
      this.whatsappDirectBtn.href = `https://wa.me/${this.profile.whatsapp.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(this.profile.name)},%20saya%20tertarik%20untuk%20konsultasi%20desain%20busana.`;
    }

    // Social links bar (fully dynamic & auto-hidden if empty)
    if (this.socialLinksContainer) {
      const socialLinks = this.profile.socialLinks || {};
      const iconMap = {
        instagram: 'fab fa-instagram',
        youtube: 'fab fa-youtube',
        behance: 'fab fa-behance',
        linkedin: 'fab fa-linkedin-in',
        github: 'fab fa-github',
        dribbble: 'fab fa-dribbble',
        twitter: 'fab fa-x-twitter',
        tiktok: 'fab fa-tiktok',
        website: 'fas fa-globe'
      };

      let html = '';
      for (const [key, url] of Object.entries(socialLinks)) {
        if (url && typeof url === 'string') {
          const cleanUrl = url.trim();
          if (cleanUrl !== '' && cleanUrl !== '#') {
            const iconClass = iconMap[key.toLowerCase()] || 'fas fa-link';
            html += `
              <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="social-btn" title="${key.toUpperCase()}">
                <i class="${iconClass}"></i>
              </a>
            `;
          }
        }
      }

      this.socialLinksContainer.innerHTML = html;
      this.socialLinksContainer.style.display = html.trim() ? 'flex' : 'none';
    }
  }

  renderCategoryPills() {
    if (!this.categoryPillsContainer) return;

    let html = `
      <button class="category-pill ${this.activeCategory === 'all' ? 'active' : ''}" data-category="all">
        <i class="fas fa-sparkles"></i> Semua Koleksi
        <span class="pill-count">${this.items.length}</span>
      </button>
    `;

    this.categories.forEach(cat => {
      if (cat.id === 'all') return;
      const count = this.items.filter(item => item.category === cat.id).length;
      const iconClass = this.getCategoryIcon(cat.icon || cat.id);

      html += `
        <button class="category-pill ${this.activeCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
          <i class="${iconClass}"></i> ${cat.name}
          <span class="pill-count">${count}</span>
        </button>
      `;
    });

    this.categoryPillsContainer.innerHTML = html;

    // Attach click events
    this.categoryPillsContainer.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.categoryPillsContainer.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeCategory = pill.dataset.category || 'all';
        this.renderGallery();
      });
    });
  }

  getCategoryIcon(iconKey) {
    const map = {
      scissors: 'fas fa-scissors',
      couture: 'fas fa-scissors',
      gem: 'fas fa-gem',
      kebaya: 'fas fa-gem',
      ring: 'fas fa-ring',
      bridal: 'fas fa-ring',
      shirt: 'fas fa-shirt',
      readytowear: 'fas fa-shirt',
      video: 'fas fa-video',
      runway: 'fas fa-video',
      camera: 'fas fa-camera',
      sparkles: 'fas fa-sparkles'
    };
    return map[iconKey] || 'fas fa-tag';
  }

  renderServices() {
    if (!this.servicesGrid || !this.services) return;

    let html = '';
    this.services.forEach(serv => {
      const icon = this.getCategoryIcon(serv.icon);
      html += `
        <div class="service-card">
          <div class="service-icon-box">
            <i class="${icon}"></i>
          </div>
          <h3 class="service-title">${serv.title}</h3>
          <p class="service-desc">${serv.description}</p>
        </div>
      `;
    });
    this.servicesGrid.innerHTML = html;
  }

  renderGallery() {
    if (!this.galleryGrid) return;

    // Filter by Category
    let result = this.items.filter(item => {
      if (this.activeCategory === 'all') return true;
      return item.category === this.activeCategory;
    });

    // Enforce Media Filter Mode from settings if not 'all'
    let effectiveMediaType = this.activeMediaType;
    if (this.settings.mediaFilterMode === 'photo_only') {
      effectiveMediaType = 'photo';
    } else if (this.settings.mediaFilterMode === 'video_only') {
      effectiveMediaType = 'video';
    }

    if (effectiveMediaType !== 'all') {
      result = result.filter(item => item.mediaType === effectiveMediaType);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      result = result.filter(item => {
        const titleMatch = (item.title || '').toLowerCase().includes(this.searchQuery);
        const descMatch = (item.description || '').toLowerCase().includes(this.searchQuery);
        const excerptMatch = (item.excerpt || '').toLowerCase().includes(this.searchQuery);
        const clientMatch = (item.client || '').toLowerCase().includes(this.searchQuery);
        return titleMatch || descMatch || excerptMatch || clientMatch;
      });
    }

    this.filteredItems = result;

    if (this.resultsCountEl) {
      this.resultsCountEl.textContent = `Menampilkan ${result.length} busana`;
    }

    if (result.length === 0) {
      this.galleryGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i class="fas fa-scissors"></i></div>
          <h3>Tidak ada busana yang ditemukan</h3>
          <p>Coba kata kunci lain atau pilih filter kategori koleksi yang berbeda.</p>
        </div>
      `;
      return;
    }

    let html = '';
    result.forEach((item, index) => {
      const isVideo = item.mediaType === 'video';
      const isLiked = db.isItemLiked(item.id);
      const categoryObj = this.categories.find(c => c.id === item.category);
      const categoryName = categoryObj ? categoryObj.name : item.category;

      const mediaThumb = item.thumbnailUrl || item.videoPoster || item.mediaUrl;

      html += `
        <div class="portfolio-card" data-index="${index}" data-id="${item.id}">
          <div class="card-media-wrapper">
            <img src="${mediaThumb}" alt="${item.title}" class="card-thumbnail" loading="lazy">
            <div class="card-media-overlay"></div>
            
            <div class="card-badges-top">
              <span class="badge ${isVideo ? 'badge-video' : 'badge-photo'}">
                <i class="fas ${isVideo ? 'fa-play' : 'fa-camera'}"></i>
                ${isVideo ? 'Video Runway' : 'Lookbook'}
              </span>
              <span class="badge badge-primary">${categoryName}</span>
            </div>

            ${isVideo ? `
              <div class="card-play-indicator">
                <i class="fas fa-play"></i>
              </div>
            ` : ''}
          </div>

          <div class="card-info">
            <h3 class="card-title">${item.title}</h3>
            <p class="card-excerpt">${item.excerpt || item.description || ''}</p>
            
            <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center;">
              <span class="card-year"><i class="far fa-calendar-alt"></i> ${item.year || '2024'}</span>
              ${item.client ? `<span style="font-size: 0.8rem; color: var(--accent-primary);"><i class="fas fa-gem"></i> ${item.client}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    this.galleryGrid.innerHTML = html;

    // Attach card click handlers for lightbox
    this.galleryGrid.querySelectorAll('.portfolio-card').forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt(card.dataset.index, 10);
        this.openLightbox(index);
      });
    });
  }

  async handleToggleLike(itemId, btnEl) {
    const result = await db.toggleLike(itemId);
    if (btnEl) {
      btnEl.classList.toggle('liked', result.liked);
      const icon = btnEl.querySelector('i');
      if (icon) {
        icon.className = result.liked ? 'fas fa-heart' : 'far fa-heart';
      }
      const countEl = btnEl.querySelector('.likes-count');
      if (countEl) countEl.textContent = result.count;
    }
    
    const item = this.items.find(i => i.id === itemId);
    if (item) item.likes = result.count;
  }

  async openLightbox(index) {
    if (!this.filteredItems[index]) return;
    this.currentLightboxIndex = index;
    const item = this.filteredItems[index];

    this.renderLightboxContent(item);
    this.lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  renderLightboxContent(item) {
    const isVideo = item.mediaType === 'video';
    const categoryObj = this.categories.find(c => c.id === item.category);

    if (isVideo) {
      if (item.mediaUrl.includes('youtube.com') || item.mediaUrl.includes('youtu.be')) {
        let videoId = '';
        if (item.mediaUrl.includes('youtu.be/')) {
          videoId = item.mediaUrl.split('youtu.be/')[1].split('?')[0];
        } else if (item.mediaUrl.includes('v=')) {
          videoId = item.mediaUrl.split('v=')[1].split('&')[0];
        }
        this.lightboxMediaBox.innerHTML = `
          <iframe width="100%" height="450" src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
            title="${item.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
          </iframe>
        `;
      } else {
        this.lightboxMediaBox.innerHTML = `
          <video controls autoplay poster="${item.videoPoster || item.thumbnailUrl || ''}">
            <source src="${item.mediaUrl}" type="video/mp4">
            Browser Anda tidak mendukung tag video.
          </video>
        `;
      }
    } else {
      this.lightboxMediaBox.innerHTML = `
        <img src="${item.mediaUrl}" alt="${item.title}">
      `;
    }

    if (this.lightboxTitle) this.lightboxTitle.textContent = item.title;
    if (this.lightboxDescription) this.lightboxDescription.textContent = item.description || item.excerpt || '';
    if (this.lightboxCategoryBadge) {
      this.lightboxCategoryBadge.textContent = categoryObj ? categoryObj.name : item.category;
      this.lightboxCategoryBadge.className = `badge ${isVideo ? 'badge-video' : 'badge-photo'}`;
    }
    if (this.lightboxYear) this.lightboxYear.textContent = item.year || '-';
    if (this.lightboxClient) this.lightboxClient.textContent = item.client || '-';

    if (this.lightboxTools) {
      if (Array.isArray(item.tools) && item.tools.length > 0) {
        this.lightboxTools.innerHTML = item.tools.map(t => `<span class="tool-tag"><i class="fas fa-gem"></i> ${t}</span>`).join('');
      } else {
        this.lightboxTools.innerHTML = '<span class="tool-tag">Bespoke Couture</span>';
      }
    }

    if (this.lightboxProjectLink) {
      if (item.projectUrl && item.projectUrl !== '#') {
        this.lightboxProjectLink.href = item.projectUrl;
        this.lightboxProjectLink.style.display = 'inline-flex';
      } else {
        this.lightboxProjectLink.style.display = 'none';
      }
    }
  }

  navigateLightbox(direction) {
    let nextIndex = this.currentLightboxIndex + direction;
    if (nextIndex < 0) nextIndex = this.filteredItems.length - 1;
    if (nextIndex >= this.filteredItems.length) nextIndex = 0;
    this.openLightbox(nextIndex);
  }

  closeLightbox() {
    this.lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
    if (this.lightboxMediaBox) {
      this.lightboxMediaBox.innerHTML = '';
    }
  }

  handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(this.contactForm);
    const inquiry = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    db.saveInquiry(inquiry);
    this.contactForm.reset();

    if (window.showToast) {
      window.showToast('Pesan konsultasi berhasil dikirim! Kami akan segera menghubungi Anda.', 'success');
    }
  }
}
