/**
 * initialData.js
 * Default starter portfolio data, profile settings, categories, and services
 * specifically tailored for Fashion Design / Tata Busana / Modiste / Atelier.
 */

export const INITIAL_PROFILE = {
  name: "Aurelia Dananjaya",
  brandName: "Aurelia Atelier",
  title: "Fashion Designer & Couturier",
  status: "available", // 'available' | 'busy' | 'offline'
  statusText: "Menerima Pesanan Custom & Fitting",
  bio: "Spesialis dalam perancangan busana custom-made, haute couture, kebaya modern kontemporer, dan gaun pesta eksklusif dengan sentuhan detail jahitan presisi tinggi.",
  about: `Halo! Saya adalah seorang perancang busana (fashion designer) dengan pengalaman lebih dari 6 tahun di industri tata busana dan atelier couture. Saya mendedikasikan karya saya untuk menciptakan siluet pakaian yang anggun, nyaman, dan memancarkan kepribadian unik pemakainya.\n\nSetiap karya dibuat dengan pemilihan material kain premium—mulai dari sutra alami, brokat chantilly Perancis, hingga tenun dan batik nusantara—yang diolah dengan teknik draping dan beading tangan (hand-embroidered) berstandar adibusana.`,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  coverImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80",
  location: "Jakarta & Bandung, Indonesia",
  email: "aurelia.atelier@example.com",
  phone: "+62 812-9876-5432",
  whatsapp: "6281298765432",
  resumeUrl: "#",
  experienceYears: 6,
  projectsCount: 140,
  clientsCount: 95,
  socialLinks: {
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    behance: "https://behance.net",
    linkedin: "https://linkedin.com",
    github: "#",
    dribbble: "#",
    twitter: "https://twitter.com"
  }
};

export const INITIAL_CATEGORIES = [
  { id: "all", name: "Semua Koleksi", icon: "sparkles", count: 0 },
  { id: "couture", name: "Haute Couture & Gaun", icon: "scissors", color: "#ec4899" },
  { id: "kebaya", name: "Kebaya & Etnik Modern", icon: "gem", color: "#f59e0b" },
  { id: "bridal", name: "Bridal & Gaun Pengantin", icon: "ring", color: "#6366f1" },
  { id: "readytowear", name: "Ready-to-Wear & Kasual", icon: "shirt", color: "#3b82f6" },
  { id: "runway", name: "Runway & Fashion Video", icon: "video", color: "#10b981" }
];

export const INITIAL_SERVICES = [
  {
    id: "serv-1",
    icon: "scissors",
    title: "Custom Bespoke & Haute Couture",
    description: "Pembuatan busana adibusana eksklusif satu-satunya sesuai bentuk tubuh dan karakter Anda dengan fitting personal serta material kain impor premium."
  },
  {
    id: "serv-2",
    icon: "ring",
    title: "Bridal & Wedding Gown",
    description: "Perancangan gaun pengantin impian, gaun resepsi, busana sangjit, dan gaun bridesmaid dengan detail kristal swarovski dan beading buatan tangan."
  },
  {
    id: "serv-3",
    icon: "gem",
    title: "Kebaya & Busana Heritage Nusantara",
    description: "Eksplorasi kebaya modern, encim, kutubaru, dan aplikasi kain tradisional (Batik Tulis, Tenun Ikat) dengan potongan kontemporer yang elegan."
  },
  {
    id: "serv-4",
    icon: "sparkles",
    title: "Fashion Styling & Wardrobe Direction",
    description: "Konsultasi gaya busana menyeluruh untuk pemotretan editorial majalah, selebriti, video musik, hingga acara karpet merah (red carpet)."
  }
];

export const INITIAL_PORTFOLIO_ITEMS = [
  {
    id: "item-1",
    title: "Lumina Gown - Silk Organza Evening Dress",
    category: "couture",
    mediaType: "photo", // 'photo' | 'video'
    mediaUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=700&q=80",
    excerpt: "Gaun malam berstruktur dramatis dengan siluet A-line dari bahan pure silk organza dan taburan payet mutiara.",
    description: `Koleksi gaun malam haute couture yang terinspirasi oleh bias cahaya senja. Menggunakan teknik micro-pleating halus pada bagian bodice dan rok bervolume bertingkat dari 35 meter sutra organza premium.\n\nDetail pengerjaan: Full hand-sewn beading dengan kristal Swarovski dan mutiara air tawar di area neckline.`,
    client: "Jakarta Gala Night Collection",
    year: "2024",
    tools: ["Silk Organza", "Swarovski Elements", "French Tulle"],
    projectUrl: "#",
    featured: true,
    views: 1420,
    likes: 388,
    createdAt: "2024-04-10T10:00:00.000Z"
  },
  {
    id: "item-2",
    title: "The Royal Kebaya - Etnik Modern Nusantara",
    category: "kebaya",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=700&q=80",
    excerpt: "Perpaduan kebaya modern berbahan brokat Chantilly dengan sentuhan kain tenun sutra motif warisan budaya.",
    description: `Karya adibusana etnik kontemporer yang merefleksikan keanggunan wanita Indonesia. Didesain dengan siluet modern peplum berkerah tinggi, dipadukan dengan rok lilit kain tenun tangan sutra alami yang memikat.`,
    client: "Cultural Heritage Exhibition",
    year: "2024",
    tools: ["Chantilly Lace", "Tenun Sutra", "Bordir Manual"],
    projectUrl: "#",
    featured: true,
    views: 1850,
    likes: 512,
    createdAt: "2024-05-12T11:00:00.000Z"
  },
  {
    id: "item-3",
    title: "Elysian Bridal - Ivory Wedding Gown",
    category: "bridal",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=1200&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=700&q=80",
    excerpt: "Gaun pengantin berpalet warna ivory dengan ekor menjuntai 2 meter dan detail lace 3D floral bordir tangan.",
    description: `Gaun pengantin bespoke yang memadukan keanggunan abadi dan kenyamanan pemakaian sepanjang hari. Struktur korset dibuat dengan teknik boning internal yang menyempurnakan postur tubuh secara alami.`,
    client: "Private Wedding Client",
    year: "2024",
    tools: ["Duchess Satin", "3D Lace Floral", "Illusion Mesh"],
    projectUrl: "#",
    featured: true,
    views: 2310,
    likes: 670,
    createdAt: "2024-06-05T14:20:00.000Z"
  },
  {
    id: "item-4",
    title: "Spring Symphony - Fashion Runway Reel",
    category: "runway",
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    videoPoster: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=80",
    excerpt: "Video sinematik peragaan busana koleksi musim semi dengan permainan siluet fluid dan draping dinamis.",
    description: `Dokumentasi video runway peragaan busana koleksi Spring Symphony. Menampilkan dinamika jatuhnya kain sutra dan sifon saat model melangkah di atas panggung catwalk dengan pencahayaan hangat.`,
    client: "Indonesia Fashion Week Showcase",
    year: "2024",
    tools: ["Runway Showcase", "Silk Chiffon", "Draping Technique"],
    projectUrl: "#",
    featured: true,
    views: 3410,
    likes: 920,
    createdAt: "2024-06-28T16:00:00.000Z"
  },
  {
    id: "item-5",
    title: "Urban Minimalist - Linen & Cotton Capsule",
    category: "readytowear",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=700&q=80",
    excerpt: "Koleksi busana kasual elegan siap pakai berbahan serat alami linen ramie dengan potongan clean & breathable.",
    description: `Rangkaian busana harian modern untuk wanita aktif yang mengutamakan kenyamanan serat alami, potongan berstruktur rileks, dan palet warna earthy tones yang mudah dipadu-padankan.`,
    client: "Atelier Capsule Collection",
    year: "2024",
    tools: ["Organic Linen", "Cotton Twill", "Eco-friendly Dye"],
    projectUrl: "#",
    featured: false,
    views: 980,
    likes: 245,
    createdAt: "2024-07-08T09:30:00.000Z"
  },
  {
    id: "item-6",
    title: "Midnight Velvet - Sculptural Tuxedo Dress",
    category: "couture",
    mediaType: "photo",
    mediaUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=700&q=80",
    excerpt: "Gaun tuxedo berkarakter kuat dari bahan velvet sutra hitam dengan aksen lapel satin mengkilap.",
    description: `Eksplorasi perpaduan tailoring maskulin jas tuxedo klasik dan kelembutan lekuk feminin. Gaun ini memiliki struktur bahu tegas (padded shoulder) dengan belahan asimetris yang memikat.`,
    client: "Editorial Magazine Cover",
    year: "2024",
    tools: ["Silk Velvet", "Satin Duchess", "Tailored Interfacing"],
    projectUrl: "#",
    featured: true,
    views: 1740,
    likes: 490,
    createdAt: "2024-07-20T15:10:00.000Z"
  }
];

export const INITIAL_SETTINGS = {
  theme: "dark", // 'dark' | 'light' | 'cyber'
  adminPin: "1234",
  siteTitle: "Aurelia Dananjaya — Fashion Designer & Atelier",
  adminButtonLabel: "Studio Manager",
  footerText: "Hak cipta busana & desain dilindungi undang-undang.",
  
  // Media Filter & Display Configurations:
  // 'all' = Foto & Video
  // 'photo_only' = Hanya Tampilkan Foto (Lookbook Foto)
  // 'video_only' = Hanya Tampilkan Video (Runway / Reel Video)
  mediaFilterMode: "all",
  showMediaFilterButtons: true, // Tampilkan tombol Semua / Foto / Video
  showCategoryFilter: true     // Tampilkan tombol filter Kategori
};
