import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import PageHero from '../components/PageHero'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import type { Listing } from '../types'

type LocalizedText = {
  en: string
  ar: string
}

type ProductGalleryItem = {
  label: LocalizedText
  note: LocalizedText
  tone: 'blue' | 'amber' | 'teal'
}

type ProductSpecification = {
  label: LocalizedText
  value: LocalizedText
}

type ProductVariationGroup = {
  name: LocalizedText
  options: LocalizedText[]
}

type ProductReview = {
  author: string
  rating: number
  title: LocalizedText
  comment: LocalizedText
  date: string
}

type ProductDetailContent = {
  gallery: ProductGalleryItem[]
  originalPrice: number
  discountLabel: LocalizedText
  promotions: LocalizedText[]
  descriptionBullets: LocalizedText[]
  specifications: ProductSpecification[]
  variations: ProductVariationGroup[]
  reviews: ProductReview[]
  shippingPolicy: LocalizedText[]
  shoppingTips: LocalizedText[]
}

const productDetailLabels = {
  en: {
    gallery: 'Product gallery',
    priceInfo: 'Price information',
    originalPrice: 'Original price',
    promotions: 'Live promotions',
    description: 'Product description',
    specifications: 'Specifications',
    variations: 'Product variations',
    reviews: 'Customer reviews and ratings',
    sellerInfo: 'Seller information',
    yearsOnPlatform: 'Years on platform',
    followers: 'Followers',
    responseRate: 'Response rate',
    positiveFeedback: 'Positive feedback',
    shippingPolicy: 'Shipping policy',
    shoppingTips: 'Smart shopping tips',
    reviewSummary: (count: number, score: number) => `${count} buyer reviews • ${score.toFixed(1)} average rating`,
    storeName: 'Official storefront',
  },
  ar: {
    gallery: 'معرض المنتج',
    priceInfo: 'معلومات السعر',
    originalPrice: 'السعر الأصلي',
    promotions: 'العروض الحالية',
    description: 'وصف المنتج',
    specifications: 'المواصفات',
    variations: 'خيارات المنتج',
    reviews: 'تقييمات وآراء العملاء',
    sellerInfo: 'معلومات البائع',
    yearsOnPlatform: 'سنوات على المنصة',
    followers: 'المتابعون',
    responseRate: 'معدل الاستجابة',
    positiveFeedback: 'التقييم الإيجابي',
    shippingPolicy: 'سياسة الشحن',
    shoppingTips: 'نصائح تسوق ذكية',
    reviewSummary: (count: number, score: number) => `${count} مراجعة • متوسط التقييم ${score.toFixed(1)}`,
    storeName: 'المتجر الرسمي',
  },
} as const

const categoryTemplates: Record<string, Omit<ProductDetailContent, 'originalPrice' | 'discountLabel'>> = {
  Home: {
    gallery: [
      {
        label: { en: 'Hero angle', ar: 'الزاوية الرئيسية' },
        note: { en: 'Styled in a bright tabletop setting.', ar: 'معروض ضمن إعداد طاولة مضيء.' },
        tone: 'blue',
      },
      {
        label: { en: 'Craft detail', ar: 'تفاصيل الصنع' },
        note: { en: 'Close-up of the hand-finished texture.', ar: 'لقطة قريبة لملمس التشطيب اليدوي.' },
        tone: 'amber',
      },
      {
        label: { en: 'Packaging view', ar: 'عرض التغليف' },
        note: { en: 'Protective wrapping for fragile delivery.', ar: 'تغليف واقٍ مناسب للشحن الحساس.' },
        tone: 'teal',
      },
    ],
    promotions: [
      { en: 'Store coupon unlocked on 2+ items.', ar: 'قسيمة المتجر متاحة عند شراء عنصرين أو أكثر.' },
      { en: 'Bundle discount applies at checkout.', ar: 'خصم التجميع يُطبَّق عند الدفع.' },
    ],
    descriptionBullets: [
      { en: 'Built to bring tactile, handmade character into everyday hosting.', ar: 'مصمم ليضيف طابعًا يدويًا ملموسًا إلى الاستخدام اليومي.' },
      { en: 'Balanced for gifting, display, and repeat use in the home.', ar: 'متوازن كخيار للهدايا والعرض والاستخدام المتكرر في المنزل.' },
      { en: 'Well suited for buyers comparing finish quality and shipping care.', ar: 'مناسب للمشترين الذين يقارنون جودة التشطيب والعناية بالشحن.' },
    ],
    specifications: [
      { label: { en: 'Category', ar: 'الفئة' }, value: { en: 'Home', ar: 'المنزل' } },
      { label: { en: 'Material', ar: 'الخامة' }, value: { en: 'Stoneware ceramic', ar: 'سيراميك حجري' } },
      { label: { en: 'Dimensions', ar: 'الأبعاد' }, value: { en: 'Serving scale for 2 to 4 guests', ar: 'مقاس تقديم مناسب من 2 إلى 4 أشخاص' } },
      { label: { en: 'Color options', ar: 'خيارات اللون' }, value: { en: 'Sand, chalk, charcoal', ar: 'رملي، طباشيري، فحمي' } },
      { label: { en: 'Usage', ar: 'الاستخدام' }, value: { en: 'Food-safe and dishwasher-safe', ar: 'آمن للطعام وآمن لغسالة الصحون' } },
    ],
    variations: [
      { name: { en: 'Color', ar: 'اللون' }, options: [{ en: 'Sand', ar: 'رملي' }, { en: 'Chalk', ar: 'طباشيري' }, { en: 'Charcoal', ar: 'فحمي' }] },
      { name: { en: 'Set size', ar: 'حجم المجموعة' }, options: [{ en: 'Single piece', ar: 'قطعة واحدة' }, { en: 'Serving duo', ar: 'طقم تقديم مزدوج' }, { en: 'Gift set', ar: 'طقم هدية' }] },
    ],
    reviews: [
      {
        author: 'Lina R.',
        rating: 5,
        title: { en: 'Exactly like the photos', ar: 'مطابق تمامًا للصور' },
        comment: { en: 'The finish feels premium and the packaging arrived without damage.', ar: 'التشطيب يبدو فاخرًا ووصل التغليف من دون أي ضرر.' },
        date: '2026-04-11',
      },
      {
        author: 'Nora A.',
        rating: 4,
        title: { en: 'Beautiful for hosting', ar: 'جميل جدًا للاستضافة' },
        comment: { en: 'I checked the dimensions carefully and they matched what I needed.', ar: 'راجعت الأبعاد بعناية وكانت مطابقة لما أحتاجه.' },
        date: '2026-03-28',
      },
    ],
    shippingPolicy: [
      { en: 'Estimated delivery window is shown before final payment.', ar: 'يظهر نطاق موعد التسليم قبل إتمام الدفع.' },
      { en: 'Fragile items ship with reinforced protection.', ar: 'يتم شحن القطع الحساسة بحماية معززة.' },
      { en: 'Free shipping can unlock based on cart value and destination.', ar: 'قد يتوفر شحن مجاني حسب قيمة السلة ووجهة التوصيل.' },
    ],
    shoppingTips: [
      { en: 'Zoom through every gallery frame before ordering.', ar: 'تفحّص كل إطار في المعرض قبل الطلب.' },
      { en: 'Compare current pricing with similar products in the same category.', ar: 'قارن السعر الحالي بمنتجات مشابهة في الفئة نفسها.' },
      { en: 'Save favorites if you want to compare colors or set sizes later.', ar: 'احفظ المنتج في المفضلة إذا أردت مقارنة الألوان أو الأحجام لاحقًا.' },
    ],
  },
  Vintage: {
    gallery: [
      { label: { en: 'Restored profile', ar: 'الواجهة بعد الترميم' }, note: { en: 'Main silhouette with rewired hardware.', ar: 'الشكل الرئيسي مع مكونات كهربائية مجددة.' }, tone: 'amber' },
      { label: { en: 'Switch and stem', ar: 'المفتاح والهيكل' }, note: { en: 'Closer look at material wear and finish.', ar: 'نظرة أقرب إلى تآكل الخامة والتشطيب.' }, tone: 'teal' },
      { label: { en: 'Desk placement', ar: 'الوضع على المكتب' }, note: { en: 'Context shot for workspace scale.', ar: 'صورة سياقية توضح الحجم ضمن مساحة العمل.' }, tone: 'blue' },
    ],
    promotions: [
      { en: 'Limited restored stock available this week.', ar: 'المخزون المجدد المتاح محدود هذا الأسبوع.' },
      { en: 'Seller occasionally adds insured shipping upgrades.', ar: 'يضيف البائع أحيانًا ترقيات للشحن المؤمن.' },
    ],
    descriptionBullets: [
      { en: 'Designed for buyers who care about character, age, and verified restoration work.', ar: 'مناسب للمشترين الذين يهتمون بالشخصية التاريخية والعمر وجودة الترميم الموثق.' },
      { en: 'Highlights condition notes and safe rewiring for daily use.', ar: 'يركز على ملاحظات الحالة وإعادة التوصيل الآمنة للاستخدام اليومي.' },
      { en: 'Useful when comparing authenticity against cheaper replicas.', ar: 'مفيد عند مقارنة الأصالة مع النسخ الأرخص.' },
    ],
    specifications: [
      { label: { en: 'Category', ar: 'الفئة' }, value: { en: 'Vintage', ar: 'منتجات عتيقة' } },
      { label: { en: 'Material', ar: 'الخامة' }, value: { en: 'Metal body with restored finish', ar: 'هيكل معدني بتشطيب مجدد' } },
      { label: { en: 'Dimensions', ar: 'الأبعاد' }, value: { en: 'Compact desk scale with angled arm', ar: 'حجم مكتبي مدمج بذراع مائل' } },
      { label: { en: 'Color options', ar: 'خيارات اللون' }, value: { en: 'Brass, matte black', ar: 'نحاسي، أسود مطفي' } },
      { label: { en: 'Usage', ar: 'الاستخدام' }, value: { en: 'Indoor desk lighting', ar: 'إضاءة مكتبية داخلية' } },
    ],
    variations: [
      { name: { en: 'Finish', ar: 'التشطيب' }, options: [{ en: 'Brass', ar: 'نحاسي' }, { en: 'Matte black', ar: 'أسود مطفي' }] },
      { name: { en: 'Plug type', ar: 'نوع المقبس' }, options: [{ en: 'US plug', ar: 'قابس أمريكي' }, { en: 'EU plug', ar: 'قابس أوروبي' }] },
    ],
    reviews: [
      { author: 'Sara M.', rating: 5, title: { en: 'Looks authentic and works well', ar: 'يبدو أصليًا ويعمل جيدًا' }, comment: { en: 'The condition matched the description and the seller packed it carefully.', ar: 'كانت الحالة مطابقة للوصف وقام البائع بالتغليف بعناية.' }, date: '2026-04-02' },
      { author: 'Yousef K.', rating: 4, title: { en: 'Great restoration work', ar: 'ترميم ممتاز' }, comment: { en: 'I compared several listings and this one gave the clearest condition details.', ar: 'قارنت عدة منتجات وكان هذا المنتج أوضحها من ناحية تفاصيل الحالة.' }, date: '2026-03-14' },
    ],
    shippingPolicy: [
      { en: 'Insured delivery options appear before payment confirmation.', ar: 'تظهر خيارات التوصيل المؤمن قبل تأكيد الدفع.' },
      { en: 'Transit time can vary with fragile-item handling.', ar: 'قد يختلف وقت النقل بسبب التعامل مع القطع الحساسة.' },
      { en: 'Check destination-specific fees before finalizing the order.', ar: 'تحقق من الرسوم الخاصة بوجهة التوصيل قبل إنهاء الطلب.' },
    ],
    shoppingTips: [
      { en: 'Review every close-up image for condition and patina.', ar: 'راجع كل الصور القريبة للحالة واللمعان الطبيعي.' },
      { en: 'Read buyer comments about authenticity and packaging.', ar: 'اقرأ تعليقات المشترين حول الأصالة والتغليف.' },
      { en: 'Compare insured shipping costs across similar restored items.', ar: 'قارن تكاليف الشحن المؤمن بين المنتجات المجددة المشابهة.' },
    ],
  },
}

const pickText = (value: LocalizedText, language: 'en' | 'ar') => value[language]

const buildFallbackDetails = (listing: Listing): ProductDetailContent => ({
  gallery: [
    { label: { en: 'Main view', ar: 'العرض الرئيسي' }, note: { en: 'Primary visual for the product detail page.', ar: 'العرض الأساسي لصفحة تفاصيل المنتج.' }, tone: 'blue' },
    { label: { en: 'Close-up', ar: 'لقطة قريبة' }, note: { en: 'Focuses on finish, material, and build quality.', ar: 'يركز على التشطيب والخامة وجودة التصنيع.' }, tone: 'amber' },
    { label: { en: 'Usage scene', ar: 'مشهد الاستخدام' }, note: { en: 'Shows scale and fit in a realistic setting.', ar: 'يوضح الحجم والملاءمة في استخدام واقعي.' }, tone: 'teal' },
  ],
  originalPrice: Math.ceil(listing.price * 1.18),
  discountLabel: { en: 'Limited-time markdown', ar: 'خصم لفترة محدودة' },
  promotions: [
    { en: 'Seller coupon may apply at checkout.', ar: 'قد يتم تطبيق قسيمة البائع عند الدفع.' },
    { en: 'Free shipping eligibility depends on destination and cart value.', ar: 'أهلية الشحن المجاني تعتمد على الوجهة وقيمة السلة.' },
  ],
  descriptionBullets: [
    { en: listing.meta, ar: listing.meta },
    { en: `Built for buyers shopping within ${listing.category.toLowerCase()} with visible trust cues.`, ar: `مصمم للمشترين الباحثين ضمن فئة ${listing.category} مع مؤشرات ثقة واضحة.` },
    { en: `Current inventory supports ${listing.inventory} ready-to-ship units.`, ar: `المخزون الحالي يدعم ${listing.inventory} وحدات جاهزة للشحن.` },
  ],
  specifications: [
    { label: { en: 'Category', ar: 'الفئة' }, value: { en: listing.category, ar: listing.category } },
    { label: { en: 'Trust signal', ar: 'مؤشر الثقة' }, value: { en: listing.trust, ar: listing.trust } },
    { label: { en: 'Shipping', ar: 'الشحن' }, value: { en: listing.shipping, ar: listing.shipping } },
    { label: { en: 'Available stock', ar: 'المخزون المتاح' }, value: { en: `${listing.inventory} units`, ar: `${listing.inventory} وحدة` } },
  ],
  variations: [
    { name: { en: 'Style', ar: 'النمط' }, options: [{ en: 'Standard', ar: 'قياسي' }, { en: 'Premium', ar: 'فاخر' }] },
    { name: { en: 'Package', ar: 'الباقة' }, options: [{ en: 'Single item', ar: 'عنصر واحد' }, { en: 'Multi-buy', ar: 'شراء متعدد' }] },
  ],
  reviews: [
    { author: 'Mariam H.', rating: Math.round(listing.reviewScore), title: { en: 'Helpful listing details', ar: 'تفاصيل مفيدة في المنتج' }, comment: { en: 'The page gave enough information to compare it with similar options before ordering.', ar: 'قدمت الصفحة معلومات كافية لمقارنته مع الخيارات المشابهة قبل الطلب.' }, date: '2026-04-18' },
    { author: 'Omar T.', rating: Math.max(4, Math.round(listing.reviewScore - 0.2)), title: { en: 'Worth checking the shipping notes', ar: 'من المفيد مراجعة ملاحظات الشحن' }, comment: { en: 'I liked that the trust and shipping details were visible before checkout.', ar: 'أعجبني أن تفاصيل الثقة والشحن كانت واضحة قبل الدفع.' }, date: '2026-03-30' },
  ],
  shippingPolicy: [
    { en: 'Review shipping timelines before confirming the order.', ar: 'راجع مواعيد الشحن قبل تأكيد الطلب.' },
    { en: 'Additional delivery costs can vary by region.', ar: 'قد تختلف تكاليف التوصيل الإضافية حسب المنطقة.' },
    { en: 'Tracking visibility is shown when available.', ar: 'يتم عرض إمكانية التتبع عند توفرها.' },
  ],
  shoppingTips: [
    { en: 'Inspect all gallery frames, especially if finish or size matters.', ar: 'افحص كل عناصر المعرض خاصة إذا كان التشطيب أو الحجم مهمًا.' },
    { en: 'Read buyer reviews before deciding between similar products.', ar: 'اقرأ مراجعات المشترين قبل الاختيار بين المنتجات المشابهة.' },
    { en: 'Save the listing to favorites if you want to compare prices later.', ar: 'احفظ المنتج في المفضلة إذا أردت مقارنة الأسعار لاحقًا.' },
  ],
})

const buildProductDetails = (listing: Listing): ProductDetailContent => {
  const template = categoryTemplates[listing.category]
  const detailContent: ProductDetailContent = template
    ? {
        ...template,
        originalPrice: Math.ceil(listing.price * 1.18),
        discountLabel: { en: 'Ali-style deal', ar: 'عرض مميز' },
      }
    : buildFallbackDetails(listing)

  return {
    ...detailContent,
    originalPrice: Math.max(detailContent.originalPrice, listing.price + 8),
  }
}

const buildSellerInsights = (listing: Listing) => ({
  storeName: `${listing.seller} Store`,
  yearsOnPlatform: Math.max(2, Math.round(listing.reviewScore + 1)),
  followers: `${(listing.inventory * 130).toLocaleString()}+`,
  responseRate: `${Math.min(99, Math.round(listing.reviewScore * 20))}%`,
  positiveFeedback: `${Math.min(99, Math.round(listing.reviewScore * 20 + 1))}%`,
})

const renderStars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating)

function ProductPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { copy, formatCurrency, language, translateCatalogText, translateListingStatus } = useLanguage()
  const { cartIds, favoriteIds, isReady, listingStatuses, listings, session, toggleCart, toggleFavorite } =
    useMarketplace()

  if (!isReady) {
    return <main className="loading-shell">{copy.common.loading}</main>
  }

  const listing = listings.find((item) => item.id === listingId)

  if (!listing) {
    return <Navigate to="/browse" replace />
  }

  const relatedListings = listings.filter(
    (item) => item.category === listing.category && item.id !== listing.id,
  )

  const currentStatus = listingStatuses[listing.id] ?? listing.status
  const isInCart = cartIds.includes(listing.id)
  const isFavorite = favoriteIds.includes(listing.id)
  const labels = productDetailLabels[language]
  const details = buildProductDetails(listing)
  const sellerInsights = buildSellerInsights(listing)
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0)
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({})

  useEffect(() => {
    setSelectedGalleryIndex(0)
    setSelectedVariations(
      Object.fromEntries(
        details.variations.map((variation) => [
          pickText(variation.name, language),
          pickText(variation.options[0], language),
        ]),
      ),
    )
  }, [details.variations, language, listing.id])

  const activeGallery = details.gallery[selectedGalleryIndex] ?? details.gallery[0]

  return (
    <main className="page-stack">
      <PageHero
        variant="product"
        kicker={copy.product.kicker}
        title={translateCatalogText(listing.title)}
        summary={translateCatalogText(listing.description)}
        aside={
          <>
            <p className="card-label">{copy.product.snapshotLabel}</p>
            <ul className="feature-list compact">
              <li>{translateCatalogText(listing.category)}</li>
              <li>{translateCatalogText(listing.shipping)}</li>
              <li>{copy.common.sellerScore(listing.reviewScore.toFixed(1))}</li>
            </ul>
          </>
        }
      />

      <section className="product-layout">
        <article className="product-panel">
          <div className="section-heading compact">
            <p className="section-kicker">{labels.gallery}</p>
            <h2>{translateCatalogText(listing.trust)}</h2>
          </div>
          <div className={`gallery-stage gallery-stage-${activeGallery.tone}`}>
            {listing.imageUrl ? (
              <img
                className="product-gallery-image"
                src={listing.imageUrl}
                alt={translateCatalogText(listing.title)}
              />
            ) : null}
            <p className="card-label">{pickText(activeGallery.label, language)}</p>
            <h3>{translateCatalogText(listing.title)}</h3>
            <p>{pickText(activeGallery.note, language)}</p>
          </div>
          <div className="gallery-thumb-grid">
            {details.gallery.map((item, index) => (
              <button
                key={pickText(item.label, language)}
                type="button"
                className={index === selectedGalleryIndex ? 'gallery-thumb gallery-thumb-active' : 'gallery-thumb'}
                onClick={() => setSelectedGalleryIndex(index)}
              >
                <strong>{pickText(item.label, language)}</strong>
                <span>{pickText(item.note, language)}</span>
              </button>
            ))}
          </div>
          <div className="product-details-grid product-topline-grid">
            <div>
              <span className="product-label">{copy.product.shippingLabel}</span>
              <strong>{translateCatalogText(listing.shipping)}</strong>
            </div>
            <div>
              <span className="product-label">{copy.product.inventoryLabel}</span>
              <strong>{copy.common.units(listing.inventory)}</strong>
            </div>
            <div>
              <span className="product-label">{copy.product.statusLabel}</span>
              <strong>{translateListingStatus(currentStatus)}</strong>
            </div>
          </div>
        </article>

        <aside className="purchase-panel">
          <p className="card-label">{labels.priceInfo}</p>
          <div className="product-price-stack">
            <strong className="purchase-price">{formatCurrency(listing.price)}</strong>
            <p className="price-strike">{labels.originalPrice}: {formatCurrency(details.originalPrice)}</p>
            <span className="badge product-discount-badge">{pickText(details.discountLabel, language)}</span>
          </div>
          <p>{copy.product.purchaseSummary}</p>
          <div className="section-heading compact product-mini-heading">
            <p className="section-kicker">{labels.promotions}</p>
          </div>
          <ul className="promo-list">
            {details.promotions.map((item) => (
              <li key={pickText(item, language)}>{pickText(item, language)}</li>
            ))}
          </ul>
          <div className="card-actions vertical-actions">
            <button type="button" className="button button-secondary" onClick={() => void toggleCart(listing.id)}>
              {isInCart ? copy.product.removeFromCart : copy.product.addToCart}
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate(session ? `/checkout/${listing.id}` : '/sign-in')}
            >
              {copy.product.goToCheckout}
            </button>
            <button type="button" className="button button-ghost" onClick={() => void toggleFavorite(listing.id)}>
              {isFavorite ? copy.product.savedToFavorites : copy.product.saveForLater}
            </button>
          </div>
          <Link className="inline-link" to="/browse">
            {copy.product.backToBrowse}
          </Link>
        </aside>
      </section>

      <section className="product-layout">
        <article className="product-panel product-rich-panel">
          <div className="section-heading compact">
            <p className="section-kicker">{labels.description}</p>
            <h2>{translateCatalogText(listing.title)}</h2>
          </div>
          <p>{translateCatalogText(listing.description)}</p>
          <ul className="feature-list product-description-list">
            {details.descriptionBullets.map((item) => (
              <li key={pickText(item, language)}>{pickText(item, language)}</li>
            ))}
          </ul>

          <div className="section-heading compact product-section-spacing">
            <p className="section-kicker">{labels.specifications}</p>
            <h2>{translateCatalogText(listing.meta)}</h2>
          </div>
          <div className="product-spec-grid">
            {details.specifications.map((spec) => (
              <article className="spec-card" key={pickText(spec.label, language)}>
                <span className="product-label">{pickText(spec.label, language)}</span>
                <strong>{pickText(spec.value, language)}</strong>
              </article>
            ))}
          </div>

          <div className="section-heading compact product-section-spacing">
            <p className="section-kicker">{labels.variations}</p>
            <h2>{copy.product.purchaseFlowLabel}</h2>
          </div>
          <div className="variation-grid">
            {details.variations.map((variation) => {
              const variationName = pickText(variation.name, language)

              return (
                <div className="variation-group" key={variationName}>
                  <span className="product-label">{variationName}</span>
                  <div className="variation-options">
                    {variation.options.map((option) => {
                      const optionLabel = pickText(option, language)

                      return (
                        <button
                          key={optionLabel}
                          type="button"
                          className={selectedVariations[variationName] === optionLabel ? 'variation-chip variation-chip-active' : 'variation-chip'}
                          onClick={() =>
                            setSelectedVariations((current) => ({
                              ...current,
                              [variationName]: optionLabel,
                            }))
                          }
                        >
                          {optionLabel}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <aside className="purchase-panel product-support-panel">
          <div className="section-heading compact">
            <p className="section-kicker">{labels.sellerInfo}</p>
            <h2>{sellerInsights.storeName}</h2>
          </div>
          <div className="seller-info-grid">
            <article className="spec-card">
              <span className="product-label">{copy.product.snapshotLabel}</span>
              <strong>{copy.common.sellerScore(listing.reviewScore.toFixed(1))}</strong>
            </article>
            <article className="spec-card">
              <span className="product-label">{labels.yearsOnPlatform}</span>
              <strong>{sellerInsights.yearsOnPlatform}</strong>
            </article>
            <article className="spec-card">
              <span className="product-label">{labels.followers}</span>
              <strong>{sellerInsights.followers}</strong>
            </article>
            <article className="spec-card">
              <span className="product-label">{labels.responseRate}</span>
              <strong>{sellerInsights.responseRate}</strong>
            </article>
            <article className="spec-card">
              <span className="product-label">{labels.positiveFeedback}</span>
              <strong>{sellerInsights.positiveFeedback}</strong>
            </article>
            <article className="spec-card">
              <span className="product-label">{labels.storeName}</span>
              <strong>{listing.seller}</strong>
            </article>
          </div>

          <div className="section-heading compact product-section-spacing">
            <p className="section-kicker">{labels.shippingPolicy}</p>
          </div>
          <ul className="guidance-list">
            {details.shippingPolicy.map((item) => (
              <li key={pickText(item, language)}>{pickText(item, language)}</li>
            ))}
          </ul>

          <div className="section-heading compact product-section-spacing">
            <p className="section-kicker">{labels.shoppingTips}</p>
          </div>
          <ul className="guidance-list">
            {details.shoppingTips.map((item) => (
              <li key={pickText(item, language)}>{pickText(item, language)}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="market-grid">
        <div className="section-heading compact">
          <p className="section-kicker">{labels.reviews}</p>
          <h2>{labels.reviewSummary(details.reviews.length, listing.reviewScore)}</h2>
        </div>
        <div className="review-grid">
          {details.reviews.map((review) => (
            <article className="review-card" key={`${review.author}-${review.date}`}>
              <div className="listing-footer review-header-row">
                <div>
                  <strong>{review.author}</strong>
                  <p className="microcopy">{new Date(review.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                </div>
                <span className="badge">{renderStars(review.rating)}</span>
              </div>
              <h3>{pickText(review.title, language)}</h3>
              <p>{pickText(review.comment, language)}</p>
            </article>
          ))}
        </div>
      </section>

      {relatedListings.length > 0 ? (
        <section className="market-grid">
          <div className="section-heading compact">
            <p className="section-kicker">{copy.product.relatedKicker}</p>
            <h2>{copy.product.relatedTitle(translateCatalogText(listing.category))}</h2>
          </div>
          <div className="listing-grid">
            {relatedListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default ProductPage