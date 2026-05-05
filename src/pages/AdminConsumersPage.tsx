import PageHero from '../components/PageHero'
import { useLanguage, type Language } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

type ConsumerSegment = 'bargain' | 'impulse' | 'dropshipper' | 'quality' | 'explorer'
type FrequencyBand = 'weekly' | 'monthly' | 'occasional'
type IncomeBand = 'low' | 'medium' | 'high'
type DeviceBand = 'mobile' | 'desktop' | 'mixed'
type LikelihoodBand = 'high' | 'medium' | 'low'

type ConsumerOrderAggregate = {
  key: string
  personaName: string
  buyerEmail: string
  location: string
  orderCount: number
  totalSpend: number
  categories: Map<string, number>
  paymentMethods: Set<string>
}

type LocalizedConsumerCopy = {
  heroKicker: string
  heroTitle: string
  heroSummary: string
  asideLabel: string
  asideSummary: string
  overviewKicker: string
  overviewTitle: string
  overviewCards: {
    activeBuyers: string
    repeatBuyers: string
    avgOrderValue: string
    topSegment: string
  }
  segmentsKicker: string
  segmentsTitle: string
  personasKicker: string
  personasTitle: string
  noConsumers: string
  notCollected: string
  fieldLabels: {
    personaName: string
    ageRange: string
    gender: string
    location: string
    income: string
    purchaseFrequency: string
    averageOrderValue: string
    preferredCategories: string
    deviceUsed: string
    shoppingTriggers: string
    goals: string
    motivations: string
    painPoints: string
    trustFactors: string
    buyingTriggers: string
    platformUsage: string
    paymentMethods: string
    buyerType: string
    lifetimeValue: string
    conversionLikelihood: string
    retentionProbability: string
  }
  genderUnspecified: string
  frequencies: Record<FrequencyBand, string>
  incomeBands: Record<IncomeBand, string>
  deviceBands: Record<DeviceBand, string>
  likelihoodBands: Record<LikelihoodBand, string>
  segmentLabels: Record<ConsumerSegment, string>
  segmentSummaries: Record<ConsumerSegment, string>
  motivationsBySegment: Record<ConsumerSegment, string[]>
  triggersBySegment: Record<ConsumerSegment, string[]>
  platformsBySegment: Record<ConsumerSegment, string[]>
  ageRangesBySegment: Record<ConsumerSegment, string>
  painPoints: string[]
  trustFactors: string[]
}

const consumerCopyByLanguage: Record<Language, LocalizedConsumerCopy> = {
  en: {
    heroKicker: 'Consumer statistics',
    heroTitle: 'Track buyer personas, motivations, and trust signals from live order behavior.',
    heroSummary: 'This admin view translates marketplace demand into actionable consumer segments. It groups live orders into persona-style insights covering demographics, shopping behavior, motivations, pain points, trust factors, and business value.',
    asideLabel: 'Methodology',
    asideSummary: 'Age, income, device, and persona type are estimated from real order patterns. Location, categories, payment methods, frequency, and value are pulled from recorded orders.',
    overviewKicker: 'Consumer overview',
    overviewTitle: 'The highest-signal buyer metrics from current marketplace activity.',
    overviewCards: {
      activeBuyers: 'Active buyers',
      repeatBuyers: 'Repeat buyers',
      avgOrderValue: 'Average order value',
      topSegment: 'Top buyer segment',
    },
    segmentsKicker: 'Segments',
    segmentsTitle: 'How current consumers cluster by shopping style.',
    personasKicker: 'Personas',
    personasTitle: 'Persona-style consumer cards generated from current buyer activity.',
    noConsumers: 'No completed consumer activity is available yet. Consumer statistics will appear once orders are created.',
    notCollected: 'Not collected yet',
    fieldLabels: {
      personaName: 'Persona',
      ageRange: 'Age range',
      gender: 'Gender',
      location: 'Location',
      income: 'Income level',
      purchaseFrequency: 'Purchase frequency',
      averageOrderValue: 'Average order value',
      preferredCategories: 'Preferred categories',
      deviceUsed: 'Device used',
      shoppingTriggers: 'Shopping triggers',
      goals: 'Goals',
      motivations: 'Motivations',
      painPoints: 'Pain points',
      trustFactors: 'Trust factors',
      buyingTriggers: 'Buying triggers',
      platformUsage: 'Tech and platform usage',
      paymentMethods: 'Payment methods',
      buyerType: 'Buyer type',
      lifetimeValue: 'Lifetime value',
      conversionLikelihood: 'Conversion likelihood',
      retentionProbability: 'Retention probability',
    },
    genderUnspecified: 'Not specified',
    frequencies: {
      weekly: 'Weekly',
      monthly: 'Monthly',
      occasional: 'Occasional',
    },
    incomeBands: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    },
    deviceBands: {
      mobile: 'Mobile-first',
      desktop: 'Desktop-first',
      mixed: 'Mobile + desktop mix',
    },
    likelihoodBands: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    segmentLabels: {
      bargain: 'Bargain Hunter',
      impulse: 'Impulse Buyer',
      dropshipper: 'Dropshipper / Reseller',
      quality: 'Quality Seeker',
      explorer: 'Explorer',
    },
    segmentSummaries: {
      bargain: 'Price-sensitive buyers who wait for value, savings, and free-shipping combinations.',
      impulse: 'Trend-led buyers who move fast when products look timely, social, and easy to buy.',
      dropshipper: 'Commercial buyers using the marketplace for repeat sourcing or resale margin.',
      quality: 'Higher-intent buyers who study proof, reviews, and product consistency before purchasing.',
      explorer: 'Curious buyers who browse for unique or uncommon items that are hard to source locally.',
    },
    motivationsBySegment: {
      bargain: ['Save money', 'Stretch budget', 'Get more items per checkout'],
      impulse: ['Catch trends early', 'Buy what is popular now', 'Feel quick purchase satisfaction'],
      dropshipper: ['Source profitable inventory', 'Start or scale a side business', 'Keep margins healthy'],
      quality: ['Reduce risk', 'Buy once and avoid disappointment', 'Get reliable value from trusted sellers'],
      explorer: ['Find unique items', 'Discover hard-to-find products', 'Try categories not available locally'],
    },
    triggersBySegment: {
      bargain: ['Big discount banners', 'Free shipping', 'Bundle savings'],
      impulse: ['Limited-time offers', 'Trending products', 'Social media exposure'],
      dropshipper: ['Bulk-friendly pricing', 'Repeat-stock availability', 'Consistent supplier quality'],
      quality: ['Strong review evidence', 'Detailed images and videos', 'Seller reputation'],
      explorer: ['Unique catalog finds', 'Rare categories', 'Novel product discovery'],
    },
    platformsBySegment: {
      bargain: ['AliExpress-style app browsing', 'Promo email alerts', 'Mobile wallet or card checkout'],
      impulse: ['TikTok trend discovery', 'Instagram product discovery', 'Mobile app checkout'],
      dropshipper: ['Desktop sourcing sessions', 'Spreadsheet/catalog review', 'Card payment for repeat procurement'],
      quality: ['Desktop product comparison', 'Review-heavy browsing', 'Secure card payment'],
      explorer: ['Mixed browsing across app and desktop', 'Social discovery', 'Card or wallet checkout'],
    },
    ageRangesBySegment: {
      bargain: '25-34',
      impulse: '18-24',
      dropshipper: '25-44',
      quality: '35-44',
      explorer: '25-34',
    },
    painPoints: [
      'Long shipping times',
      'Product quality inconsistency',
      'Trust issues from misleading images or fake reviews',
      'Complicated returns and refunds',
    ],
    trustFactors: [
      'Photo reviews and ratings',
      'Seller reputation and consistency',
      'Clear product images and videos',
      'Buyer protection and refund confidence',
    ],
  },
  ar: {
    heroKicker: 'إحصاءات المستهلكين',
    heroTitle: 'تابع شخصيات المشترين ودوافعهم وعوامل الثقة اعتمادًا على سلوك الطلبات الفعلي.',
    heroSummary: 'تحول هذه الصفحة الإدارية الطلب الحالي في المتجر إلى شرائح مستهلكين قابلة للتنفيذ. وهي تجمع الطلبات الحية في رؤى تشبه الشخصيات وتشمل الديموغرافيا وسلوك الشراء والدوافع ونقاط الألم والثقة والقيمة التجارية.',
    asideLabel: 'المنهجية',
    asideSummary: 'يتم تقدير العمر والدخل والجهاز ونوع المشتري من أنماط الطلبات الفعلية. أما الموقع والفئات وطرق الدفع والتكرار والقيمة فتؤخذ من بيانات الطلبات المسجلة.',
    overviewKicker: 'نظرة عامة على المستهلك',
    overviewTitle: 'أهم مؤشرات المشترين من نشاط المتجر الحالي.',
    overviewCards: {
      activeBuyers: 'المشترون النشطون',
      repeatBuyers: 'المشترون المتكررون',
      avgOrderValue: 'متوسط قيمة الطلب',
      topSegment: 'أكبر شريحة شراء',
    },
    segmentsKicker: 'الشرائح',
    segmentsTitle: 'كيف يتجمع المستهلكون الحاليون حسب أسلوب الشراء.',
    personasKicker: 'الشخصيات',
    personasTitle: 'بطاقات شخصيات المستهلكين المولدة من نشاط المشترين الحالي.',
    noConsumers: 'لا توجد بعد بيانات نشاط استهلاكي كافية. ستظهر الإحصاءات هنا بعد إنشاء الطلبات.',
    notCollected: 'غير متوفر بعد',
    fieldLabels: {
      personaName: 'الشخصية',
      ageRange: 'الفئة العمرية',
      gender: 'النوع',
      location: 'الموقع',
      income: 'مستوى الدخل',
      purchaseFrequency: 'تكرار الشراء',
      averageOrderValue: 'متوسط قيمة الطلب',
      preferredCategories: 'الفئات المفضلة',
      deviceUsed: 'الجهاز المستخدم',
      shoppingTriggers: 'محفزات الشراء',
      goals: 'الأهداف',
      motivations: 'الدوافع',
      painPoints: 'نقاط الألم',
      trustFactors: 'عوامل الثقة',
      buyingTriggers: 'محفزات اتخاذ القرار',
      platformUsage: 'استخدام التقنية والمنصات',
      paymentMethods: 'طرق الدفع',
      buyerType: 'نوع المشتري',
      lifetimeValue: 'القيمة العمرية',
      conversionLikelihood: 'احتمال التحويل',
      retentionProbability: 'احتمال الاحتفاظ',
    },
    genderUnspecified: 'غير محدد',
    frequencies: {
      weekly: 'أسبوعي',
      monthly: 'شهري',
      occasional: 'متقطع',
    },
    incomeBands: {
      low: 'منخفض',
      medium: 'متوسط',
      high: 'مرتفع',
    },
    deviceBands: {
      mobile: 'الهاتف أولًا',
      desktop: 'سطح المكتب أولًا',
      mixed: 'هاتف + سطح مكتب',
    },
    likelihoodBands: {
      high: 'مرتفع',
      medium: 'متوسط',
      low: 'منخفض',
    },
    segmentLabels: {
      bargain: 'باحث عن الصفقات',
      impulse: 'مشتري اندفاعي',
      dropshipper: 'دروبشيبير / بائع إعادة',
      quality: 'باحث عن الجودة',
      explorer: 'مستكشف',
    },
    segmentSummaries: {
      bargain: 'مستهلك حساس للسعر ينتظر التوفير والعروض والشحن المجاني.',
      impulse: 'مستهلك تقوده الصيحات ويتخذ القرار بسرعة عندما يبدو المنتج رائجًا وسهل الشراء.',
      dropshipper: 'مشتري تجاري يستخدم المتجر لتوريد متكرر أو لإعادة البيع.',
      quality: 'مستهلك مرتفع النية يراجع الدليل والتقييمات واتساق الجودة قبل الشراء.',
      explorer: 'مستهلك فضولي يتصفح بحثًا عن عناصر مميزة أو غير متوفرة محليًا.',
    },
    motivationsBySegment: {
      bargain: ['توفير المال', 'الاستفادة القصوى من الميزانية', 'الحصول على عدد أكبر من المنتجات في الطلب الواحد'],
      impulse: ['اللحاق بالصيحات مبكرًا', 'شراء ما هو رائج الآن', 'إشباع سريع من الشراء'],
      dropshipper: ['توريد مخزون مربح', 'بدء أو توسيع مشروع جانبي', 'الحفاظ على هامش ربح جيد'],
      quality: ['تقليل المخاطر', 'شراء موثوق دون خيبة أمل', 'الحصول على قيمة ثابتة من بائع موثوق'],
      explorer: ['العثور على منتجات مميزة', 'اكتشاف عناصر يصعب إيجادها', 'تجربة فئات غير متوفرة محليًا'],
    },
    triggersBySegment: {
      bargain: ['خصومات كبيرة', 'شحن مجاني', 'توفير عند الجمع'],
      impulse: ['عروض محدودة الوقت', 'منتجات رائجة', 'تأثير وسائل التواصل'],
      dropshipper: ['تسعير مناسب للكميات', 'توفر مخزون متكرر', 'ثبات جودة المورد'],
      quality: ['أدلة تقييم قوية', 'صور وفيديوهات تفصيلية', 'سمعة بائع جيدة'],
      explorer: ['منتجات فريدة', 'فئات نادرة', 'اكتشاف جديد للمنتجات'],
    },
    platformsBySegment: {
      bargain: ['تصفح شبيه بتطبيقات الصفقات', 'تنبيهات العروض بالبريد', 'محفظة أو بطاقة عبر الجوال'],
      impulse: ['اكتشاف عبر تيك توك', 'اكتشاف عبر إنستغرام', 'إتمام الشراء عبر التطبيق'],
      dropshipper: ['جلسات توريد من سطح المكتب', 'مراجعة جداول وكاتالوجات', 'بطاقة للدفع المتكرر'],
      quality: ['مقارنة عبر سطح المكتب', 'تصفح مكثف للتقييمات', 'دفع ببطاقة آمنة'],
      explorer: ['تصفح مختلط بين التطبيق والكمبيوتر', 'اكتشاف عبر الشبكات الاجتماعية', 'بطاقة أو محفظة إلكترونية'],
    },
    ageRangesBySegment: {
      bargain: '25-34',
      impulse: '18-24',
      dropshipper: '25-44',
      quality: '35-44',
      explorer: '25-34',
    },
    painPoints: [
      'طول مدة الشحن',
      'تفاوت جودة المنتجات',
      'مشكلات الثقة بسبب الصور المضللة أو التقييمات المزيفة',
      'تعقيد الإرجاع والاسترداد',
    ],
    trustFactors: [
      'تقييمات وصور المشترين',
      'سمعة البائع واستمراريته',
      'وضوح الصور والفيديوهات',
      'حماية المشتري والثقة في الاسترداد',
    ],
  },
}

const valueCategorySet = new Set(['Accessories', 'Beauty', 'Clothing'])
const qualityCategorySet = new Set(['Electronics', 'Furniture', 'Jewelry'])

const inferFrequencyBand = (orderCount: number): FrequencyBand => {
  if (orderCount >= 5) {
    return 'weekly'
  }

  if (orderCount >= 2) {
    return 'monthly'
  }

  return 'occasional'
}

const inferIncomeBand = (averageOrderValue: number): IncomeBand => {
  if (averageOrderValue >= 35) {
    return 'high'
  }

  if (averageOrderValue >= 15) {
    return 'medium'
  }

  return 'low'
}

const inferDeviceBand = (segment: ConsumerSegment, averageOrderValue: number): DeviceBand => {
  if (segment === 'impulse' || segment === 'bargain') {
    return 'mobile'
  }

  if (segment === 'dropshipper' || averageOrderValue >= 35) {
    return 'desktop'
  }

  return 'mixed'
}

const inferSegment = (
  orderCount: number,
  averageOrderValue: number,
  topCategory: string | undefined,
): ConsumerSegment => {
  if (orderCount >= 4 && averageOrderValue >= 30) {
    return 'dropshipper'
  }

  if (topCategory && valueCategorySet.has(topCategory) && averageOrderValue <= 20) {
    return 'impulse'
  }

  if (orderCount >= 2 && averageOrderValue <= 15) {
    return 'bargain'
  }

  if ((topCategory && qualityCategorySet.has(topCategory)) || averageOrderValue >= 45) {
    return 'quality'
  }

  return 'explorer'
}

const inferLikelihoodBand = (orderCount: number, averageOrderValue: number): LikelihoodBand => {
  if (orderCount >= 4 || averageOrderValue >= 35) {
    return 'high'
  }

  if (orderCount >= 2) {
    return 'medium'
  }

  return 'low'
}

function AdminConsumersPage() {
  const { formatCurrency, language, translateCatalogText } = useLanguage()
  const { listings, orders } = useMarketplace()
  const localized = consumerCopyByLanguage[language]
  const listingsById = new Map(listings.map((listing) => [listing.id, listing]))

  const consumerProfiles = Array.from(
    orders.reduce<Map<string, ConsumerOrderAggregate>>((profiles, order) => {
      const key = order.buyerId || order.email || order.buyer
      const listing = listingsById.get(order.listingId)
      const aggregate =
        profiles.get(key) ??
        {
          key,
          personaName: order.buyer || order.email || key,
          buyerEmail: order.email,
          location: [order.city, order.country].filter(Boolean).join(', '),
          orderCount: 0,
          totalSpend: 0,
          categories: new Map<string, number>(),
          paymentMethods: new Set<string>(),
        }

      aggregate.orderCount += 1
      aggregate.totalSpend += order.total
      aggregate.location ||= [order.city, order.country].filter(Boolean).join(', ')

      if (listing?.category) {
        aggregate.categories.set(listing.category, (aggregate.categories.get(listing.category) ?? 0) + 1)
      }

      if (order.paymentMethod) {
        aggregate.paymentMethods.add(order.paymentMethod)
      }

      profiles.set(key, aggregate)
      return profiles
    }, new Map<string, ConsumerOrderAggregate>()).values(),
  )
    .map((profile) => {
      const sortedCategories = Array.from(profile.categories.entries()).sort((left, right) => right[1] - left[1])
      const topCategory = sortedCategories[0]?.[0]
      const averageOrderValue = profile.totalSpend / profile.orderCount
      const segment = inferSegment(profile.orderCount, averageOrderValue, topCategory)
      const conversionLikelihood = inferLikelihoodBand(profile.orderCount, averageOrderValue)
      const retentionProbability = profile.orderCount >= 3 ? 'high' : profile.orderCount === 2 ? 'medium' : 'low'

      return {
        ...profile,
        averageOrderValue,
        segment,
        frequency: inferFrequencyBand(profile.orderCount),
        incomeBand: inferIncomeBand(averageOrderValue),
        deviceBand: inferDeviceBand(segment, averageOrderValue),
        topCategories: sortedCategories.slice(0, 3).map(([category]) => translateCatalogText(category)),
        conversionLikelihood,
        retentionProbability: retentionProbability as LikelihoodBand,
      }
    })
    .sort((left, right) => right.totalSpend - left.totalSpend)

  const repeatBuyers = consumerProfiles.filter((profile) => profile.orderCount > 1).length
  const overallAverageOrderValue = orders.length === 0
    ? 0
    : orders.reduce((sum, order) => sum + order.total, 0) / orders.length

  const segmentCounts = consumerProfiles.reduce<Record<ConsumerSegment, number>>(
    (counts, profile) => {
      counts[profile.segment] += 1
      return counts
    },
    {
      bargain: 0,
      impulse: 0,
      dropshipper: 0,
      quality: 0,
      explorer: 0,
    },
  )

  const topSegment = (Object.entries(segmentCounts) as Array<[ConsumerSegment, number]>).sort(
    (left, right) => right[1] - left[1],
  )[0]?.[0] ?? 'explorer'

  const overviewCards = [
    { label: localized.overviewCards.activeBuyers, value: String(consumerProfiles.length) },
    { label: localized.overviewCards.repeatBuyers, value: String(repeatBuyers) },
    { label: localized.overviewCards.avgOrderValue, value: formatCurrency(overallAverageOrderValue) },
    { label: localized.overviewCards.topSegment, value: localized.segmentLabels[topSegment] },
  ]

  return (
    <main className="page-stack">
      <PageHero
        variant="admin"
        kicker={localized.heroKicker}
        title={localized.heroTitle}
        summary={localized.heroSummary}
        aside={
          <>
            <p className="card-label">{localized.asideLabel}</p>
            <p>{localized.asideSummary}</p>
          </>
        }
      />

      <section className="ops-board">
        <div className="section-heading compact">
          <p className="section-kicker">{localized.overviewKicker}</p>
          <h2>{localized.overviewTitle}</h2>
        </div>
        <div className="metric-grid admin-stock-grid">
          {overviewCards.map((item) => (
            <article className="metric-card" key={item.label}>
              <p className="card-label">{item.label}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="ops-board">
        <div className="section-heading compact">
          <p className="section-kicker">{localized.segmentsKicker}</p>
          <h2>{localized.segmentsTitle}</h2>
        </div>
        <div className="queue-grid admin-order-grid">
          {(Object.entries(segmentCounts) as Array<[ConsumerSegment, number]>).map(([segment, count]) => (
            <article className="queue-card" key={segment}>
              <p className="card-label">{localized.segmentLabels[segment]}</p>
              <h3>{count}</h3>
              <p>{localized.segmentSummaries[segment]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ops-board">
        <div className="section-heading compact">
          <p className="section-kicker">{localized.personasKicker}</p>
          <h2>{localized.personasTitle}</h2>
        </div>
        {consumerProfiles.length === 0 ? (
          <article className="queue-card">
            <p>{localized.noConsumers}</p>
          </article>
        ) : (
          <div className="queue-grid">
            {consumerProfiles.map((profile) => (
              <article className="queue-card" key={profile.key}>
                <div className="listing-footer review-header-row">
                  <div>
                    <p className="card-label">{localized.fieldLabels.personaName}</p>
                    <h3>{profile.personaName}</h3>
                  </div>
                  <span className="badge">{localized.segmentLabels[profile.segment]}</span>
                </div>

                <div className="product-details-grid">
                  <div>
                    <span className="product-label">{localized.fieldLabels.ageRange}</span>
                    <strong>{localized.ageRangesBySegment[profile.segment]}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.gender}</span>
                    <strong>{localized.genderUnspecified}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.location}</span>
                    <strong>{profile.location || localized.notCollected}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.income}</span>
                    <strong>{localized.incomeBands[profile.incomeBand]}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.purchaseFrequency}</span>
                    <strong>{localized.frequencies[profile.frequency]}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.averageOrderValue}</span>
                    <strong>{formatCurrency(profile.averageOrderValue)}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.deviceUsed}</span>
                    <strong>{localized.deviceBands[profile.deviceBand]}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.paymentMethods}</span>
                    <strong>{Array.from(profile.paymentMethods).join(', ') || localized.notCollected}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.buyerType}</span>
                    <strong>{localized.segmentLabels[profile.segment]}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.lifetimeValue}</span>
                    <strong>{formatCurrency(profile.totalSpend)}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.conversionLikelihood}</span>
                    <strong>{localized.likelihoodBands[profile.conversionLikelihood]}</strong>
                  </div>
                  <div>
                    <span className="product-label">{localized.fieldLabels.retentionProbability}</span>
                    <strong>{localized.likelihoodBands[profile.retentionProbability]}</strong>
                  </div>
                </div>

                <div className="section-heading compact product-section-spacing">
                  <p className="section-kicker">{localized.fieldLabels.preferredCategories}</p>
                </div>
                <div className="filter-strip">
                  {(profile.topCategories.length > 0 ? profile.topCategories : [localized.notCollected]).map((category) => (
                    <span key={category}>{category}</span>
                  ))}
                </div>

                <div className="section-heading compact product-section-spacing">
                  <p className="section-kicker">{localized.fieldLabels.shoppingTriggers}</p>
                </div>
                <ul className="feature-list compact">
                  {localized.triggersBySegment[profile.segment].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="section-heading compact product-section-spacing">
                  <p className="section-kicker">{localized.fieldLabels.goals}</p>
                </div>
                <ul className="feature-list compact">
                  {localized.motivationsBySegment[profile.segment].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="section-heading compact product-section-spacing">
                  <p className="section-kicker">{localized.fieldLabels.motivations}</p>
                </div>
                <ul className="feature-list compact">
                  {localized.segmentSummaries[profile.segment].split('. ').filter(Boolean).map((item) => (
                    <li key={item}>{item.replace(/\.$/, '')}</li>
                  ))}
                </ul>

                <div className="section-heading compact product-section-spacing">
                  <p className="section-kicker">{localized.fieldLabels.painPoints}</p>
                </div>
                <ul className="feature-list compact">
                  {localized.painPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="section-heading compact product-section-spacing">
                  <p className="section-kicker">{localized.fieldLabels.trustFactors}</p>
                </div>
                <ul className="feature-list compact">
                  {localized.trustFactors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="section-heading compact product-section-spacing">
                  <p className="section-kicker">{localized.fieldLabels.buyingTriggers}</p>
                </div>
                <ul className="feature-list compact">
                  {localized.triggersBySegment[profile.segment].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="section-heading compact product-section-spacing">
                  <p className="section-kicker">{localized.fieldLabels.platformUsage}</p>
                </div>
                <ul className="feature-list compact">
                  {localized.platformsBySegment[profile.segment].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminConsumersPage