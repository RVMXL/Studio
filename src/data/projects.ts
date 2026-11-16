// ─── СТАНЦИЯ ВАЙБОВ: реестр сигналов ────────────────────────────────
// Кураторские данные проектов RVMXL (github.com/rvmxl).
// Все проекты объединены философией: офлайн-first, приватность, без серверов.

export type VizKind =
  | "station"
  | "pianoroll"
  | "endoscope"
  | "docrain"
  | "alarm"
  | "barcode"
  | "radar";

export type StageLayout =
  | "split-right"
  | "split-left"
  | "stack-wide"
  | "orbit-center"
  | "beam"
  | "radar-right";

export interface ProjectSignal {
  code: string; // CH-01
  freq: string; // 92.1
  name: string;
  glyph: string; // фоновый символ-паттерн
  category: string;
  subcategory: string;
  tagline: string; // короткий подзаголовок
  description: string;
  details: string[]; // строки "из журнала регистрации"
  tags: string[];
  link: string;
  demoLink?: string;
  accent: string; // основной акцент
  accentSoft: string; // мягкий акцент (панели)
  accentGlow: string; // свечение
  viz: VizKind;
  layout: StageLayout;
  language: string;
  offlineNote: string;
}

export const STATION = {
  callsign: "RVMXL",
  title: "СТАНЦИЯ ВАЙБОВ",
  subtitle: "студия вайбкодинга · приёмник сигналов из пурпурного вакуума",
  profileLink: "https://github.com/rvmxl",
  observatory: "ОБС. КАЗАНЬ · 55.7963°N 49.1088°E",
  band: "DEEP VIOLET BAND · 87—112 МГц",
  manifesto: [
    "Мы не строим облака. Мы строим то, что живёт на устройстве.",
    "Каждый сигнал здесь пойман вайбкодингом: человек задаёт направление — энергия делает остальное.",
    "Ноль серверов. Ноль аналитики. Ноль аккаунтов. Данные не покидают устройство.",
    "Приложение должно работать в самолёте, в подвале и на Марсе.",
  ],
  principles: [
    { icon: "server-off", label: "0 СЕРВЕРОВ", note: "вся логика на устройстве" },
    { icon: "fingerprint", label: "0 АНАЛИТИКИ", note: "никто не следит за вами" },
    { icon: "shield-check", label: "100% ОФЛАЙН", note: "работает без сети" },
    { icon: "lock", label: "PRIVACY FIRST", note: "данные не покидают телефон" },
  ],
};

export const SIGNALS: ProjectSignal[] = [
  {
    code: "CH-01",
    freq: "92.1",
    name: "HumNote",
    glyph: "♪",
    category: "AUDIO",
    subcategory: "СИГНАЛ ЗВУКОВОГО ДИАПАЗОНА",
    tagline: "ментальный диктофон мелодий",
    description:
      "Напойте или просвистите мелодию — станция распознает ноты (алгоритм YIN), выровняет их по сетке темпа и отдаст MIDI или WAV. Запись, синтез и история — полностью офлайн.",
    details: [
      "YIN pitch-детекция с параболической интерполяцией, кадры каждые 40 мс",
      "Piano roll с выравниванием по темпу, экспорт MIDI / WAV",
      "Android (Capacitor) + Web · данные не покидают устройство",
    ],
    tags: ["WebAudio", "YIN", "MIDI", "NextJS", "Capacitor", "offline-first"],
    link: "https://github.com/RVMXL/HumNote",
    accent: "#e879f9",
    accentSoft: "rgba(232,121,249,0.12)",
    accentGlow: "rgba(232,121,249,0.45)",
    viz: "pianoroll",
    layout: "split-right",
    language: "TypeScript",
    offlineNote: "запись и распознавание — без сети",
  },
  {
    code: "CH-02",
    freq: "96.4",
    name: "OTGLens",
    glyph: "◎",
    category: "OPTICS",
    subcategory: "СИГНАЛ ОПТИЧЕСКОГО ДИАПАЗОНА",
    tagline: "USB-эндоскоп для Android через OTG",
    description:
      "Подключение внешних UVC-эндоскопов без root: живое превью 720p, фото и видео со звуком, поворот кадра, диагностика USB по-русски прямо на экране.",
    details: [
      "UVC-стек на вендоренном libuvc, hot-plug, системный диалог разрешений",
      "MVVM + Hilt, Jetpack Compose, тёмная тема, управление одной рукой",
      "Сохранение через MediaStore: Pictures/OTGLens · Movies/OTGLens",
    ],
    tags: ["Kotlin", "Jetpack Compose", "libuvc", "UVC", "OTG", "no-root"],
    link: "https://github.com/RVMXL/OTGLens",
    accent: "#a78bfa",
    accentSoft: "rgba(167,139,250,0.12)",
    accentGlow: "rgba(167,139,250,0.45)",
    viz: "endoscope",
    layout: "split-left",
    language: "Kotlin",
    offlineNote: "весь поток видео — по проводу, без облака",
  },
  {
    code: "CH-03",
    freq: "100.7",
    name: "DocGen",
    glyph: "§",
    category: "LEGAL",
    subcategory: "СИГНАЛ ПРАВОВОГО ПОЛЯ",
    tagline: "генератор юридических документов",
    description:
      "Заявления, иски, претензии, доверенности, медицинские и школьные формы — по правовым нормам своей страны. 38 стран. Документы .docx/.pdf собираются прямо на устройстве.",
    details: [
      "38 стран: Россия и СНГ, США, Европа, Азия, Латинская Америка, Австралия",
      "Каталог шаблонов встроен в приложение, офлайн-сборка docx/pdf",
      "Android (Capacitor) + Desktop (Electron) + Web",
    ],
    tags: ["legaltech", "docx", "pdf", "38 стран", "Electron", "Capacitor"],
    link: "https://github.com/RVMXL/DocGen",
    accent: "#c084fc",
    accentSoft: "rgba(192,132,252,0.12)",
    accentGlow: "rgba(192,132,252,0.45)",
    viz: "docrain",
    layout: "stack-wide",
    language: "TypeScript",
    offlineNote: "ни один документ не отправляется в сеть",
  },
  {
    code: "CH-04",
    freq: "104.8",
    name: "Student-AutoAlarm",
    glyph: "◐",
    category: "TIME",
    subcategory: "СИГНАЛ ТОЧНОГО ВРЕМЕНИ",
    tagline: "автобудильник по расписанию КГЭУ",
    description:
      "Сам ставит будильники в стоковые часы по расписанию пар КГЭУ. Логика «одна ночь вперёд»: ночная сверка в 00:05 со страховками, замены пар учитываются.",
    details: [
      "Официальный API личного кабинета kabinet.kgeu.ru, слой провайдера изолирован",
      "Ставит будильник в стоковое приложение часов или собственный полноэкранный звонок",
      "Kotlin · Jetpack Compose · Material You · без аналитики и серверов",
    ],
    tags: ["Kotlin", "Material You", "КГЭУ", "расписание", "AlarmClock"],
    link: "https://github.com/RVMXL/Student-AutoAlarm",
    accent: "#f0abfc",
    accentSoft: "rgba(240,171,252,0.12)",
    accentGlow: "rgba(240,171,252,0.45)",
    viz: "alarm",
    layout: "orbit-center",
    language: "Kotlin",
    offlineNote: "ночная сверка — единственное касание сети",
  },
  {
    code: "CH-05",
    freq: "108.0",
    name: "SmartFridge-Chef",
    glyph: "▮",
    category: "FOOD",
    subcategory: "СИГНАЛ БЫТОВОГО КОНТУРА",
    tagline: "умный холодильник и шеф-планер",
    description:
      "Офлайн-трекинг сроков годности (скан штрих-кодов, OCR чеков, локальные пуши) и генерация меню на неделю с учётом КБЖУ, аллергий и диет — из того, что уже в холодильнике.",
    details: [
      "ML Kit: скан штрих-кодов + OCR чеков, база Open Food Facts локально",
      "Локальный планировщик меню со встроенной базой рецептов",
      "Flutter · Android · iOS · sqflite · без аналитики и аккаунтов",
    ],
    tags: ["Flutter", "ML Kit", "OCR чеков", "КБЖУ", "local-first"],
    link: "https://github.com/RVMXL/SmartFridge-Chef",
    accent: "#d8b4fe",
    accentSoft: "rgba(216,180,254,0.12)",
    accentGlow: "rgba(216,180,254,0.45)",
    viz: "barcode",
    layout: "beam",
    language: "Dart",
    offlineNote: "пуши о сроках — локальные, не серверные",
  },
  {
    code: "CH-06",
    freq: "111.9",
    name: "WarpScoutGUI-AWG",
    glyph: "※",
    category: "NETWORK",
    subcategory: "СИГНАЛ ДАЛЬНЕГО РАДИУСА",
    tagline: "радар WARP-эндпоинтов",
    description:
      "Графическая оболочка (Neutralino.js) для warpscout CLI: скан живых WARP-эндпоинтов, генерация .conf в формате AmneziaWG, QR-коды, валидация конфигов.",
    details: [
      "Суффикс -AWG: работа с конфигурациями AmneziaWG (awg31)",
      "Регистрация WARP-аккаунтов, импорт и валидация конфигов, QR",
      "Desktop + мобильный (WebView) · есть веб-демо на моках",
    ],
    tags: ["Neutralino.js", "AmneziaWG", "WARP", "WireGuard", "desktop"],
    link: "https://github.com/RVMXL/WarpScoutGUI-AWG",
    demoLink: "https://rvmxl.github.io/WarpScoutGUI-AWG/",
    accent: "#8b5cf6",
    accentSoft: "rgba(139,92,246,0.14)",
    accentGlow: "rgba(139,92,246,0.5)",
    viz: "radar",
    layout: "radar-right",
    language: "TypeScript",
    offlineNote: "скан прямым UDP-зондом, без посредников",
  },
];
