import molLocale from './mol.json';

type TranslationParams = {
  [key: string]: string | number | boolean | Date | undefined;
};

type PluralCount = number | string;

interface LocaleData {
  [key: string]: any;
}

export class MolTranslator {
  private dictionaries: Record<string, LocaleData> = {};
  private currentLang: string = 'ru';
  private cache = new Map<string, string>();

  constructor(initialLang: string = 'ru') {
    this.dictionaries[initialLang] = molLocale;
    this.currentLang = initialLang;
  }

  /** Загрузка дополнительных языковых пакетов */
  public addLanguage(lang: string, dictionary: LocaleData): void {
    this.dictionaries[lang] = dictionary;
  }

  /** Смена текущего языка интерфейса */
  public changeLanguage(lang: string): boolean {
    if (this.dictionaries[lang]) {
      this.currentLang = lang;
      this.cache.clear();
      console.info(`[MolTranslator] Язык сменён → ${lang.toUpperCase()}`);
      return true;
    }
    console.warn(`[MolTranslator] Язык "${lang}" не загружен`);
    return false;
  }

  private getCurrentDictionary(): LocaleData {
    return this.dictionaries[this.currentLang] ?? this.dictionaries['ru'] ?? {};
  }

  // ====================== ТРАНСЛИТЕРАЦИЯ ======================
  private readonly translitRules: [string, string][] = [
    ['ch', 'к'], ['sh', 'ш'], ['zh', 'ж'],
    ['ia', 'я'], ['ea', 'я'], ['iu', 'ю'], ['io', 'ё'],
    ['a', 'а'], ['b', 'б'], ['v', 'в'], ['g', 'г'], ['d', 'д'],
    ['e', 'е'], ['j', 'ж'], ['z', 'з'], ['i', 'и'], ['k', 'к'],
    ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'],
    ['r', 'р'], ['s', 'с'], ['t', 'т'], ['u', 'у'], ['f', 'ф'],
    ['h', 'х'], ['c', 'к'], ['x', 'кс'], ['y', 'ы'], ['w', 'в'],
    // Специфические молдавские символы кириллицы
    ['ț', 'ц'], ['ș', 'ш'], ['ă', 'э'], ['î', 'ы'], ['â', 'ы']
  ];

  private fallbackTransliterate(text: string): string {
    if (!text) return '';
    let result = text.toLowerCase();

    for (const [from, to] of this.translitRules) {
      result = result.replaceAll(from, to);
    }

    if (text[0] === text[0].toUpperCase()) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result;
  }

  // ====================== PLURAL СИСТЕМА ======================
  private getPluralForm(count: number, lang: string): string {
    if (count === 0) return 'zero';
    if (count === 1) return 'one';

    if (lang === 'ru') {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return 'one';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'few';
      return 'many';
    }

    // Логика счёта для mol / mol-md (Правило рубежа 20 по канону Лумины)
    if (lang === 'mol' || lang === 'mol-md') {
      const mod100 = count % 100;
      if (mod100 >= 2 && mod100 <= 19) return 'few';
      return 'many';
    }

    return 'other';
  }

  // ====================== ОСНОВНОЙ МЕТОД t() ======================
  public t(
    path: string,
    params: TranslationParams & { count?: PluralCount; context?: string } = {}
  ): string {
    // Исправлено: Корректный синтаксис шаблонной строки для кэша
    const cacheKey = `${this.currentLang}:${path}:${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const keys = path.split('.');
    let node: any = this.getCurrentDictionary();

    for (const key of keys) {
      if (node?.[key] !== undefined) {
        node = node[key];
      } else {
        const fallback = this.fallbackTransliterate(keys.at(-1) || path);
        // Исправлено: Корректный лог предупреждения
        console.warn(`[MolTranslator] Ключ "${path}" не найден (${this.currentLang}) → ${fallback}`);
        
        const result = this.replaceParams(fallback, params);
        this.cache.set(cacheKey, result);
        return result;
      }
    }

    let translation = node;

    if (typeof translation === 'object' && translation !== null) {
      translation = this.resolvePluralAndContext(translation, params);
    }

    if (typeof translation !== 'string') {
      translation = this.fallbackTransliterate(keys.at(-1) || path);
    }

    const result = this.replaceParams(translation, params);
    this.cache.set(cacheKey, result);
    return result;
  }

  private resolvePluralAndContext(
    obj: Record<string, string>,
    params: TranslationParams & { count?: PluralCount; context?: string }
  ): string {
    const { count, context } = params;

    if (context && count !== undefined) {
      const plural = this.getPluralForm(Number(count), this.currentLang);
      // Исправлено: Корректная склейка контекстного ключа
      const combinedKey = `${plural}_${context}`;
      if (obj[combinedKey]) return obj[combinedKey];
    }

    if (context && obj[context]) return obj[context];

    if (count !== undefined) {
      const pluralKey = this.getPluralForm(Number(count), this.currentLang);
      if (obj[pluralKey]) return obj[pluralKey];
      if (obj.other) return obj.other;
    }

    return obj.other ?? obj.one ?? Object.values(obj)[0] ?? '';
  }

  // ====================== ДИНАМИЧЕСКИЕ ПАРАМЕТРЫ ======================
  private replaceParams(text: string, params: TranslationParams = {}): string {
    if (!text) return '';

    let result = text;

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return;

      let formatted = String(value);

      // Локальное форматирование дат и чисел без сторонних зависимостей
      if (value instanceof Date) {
        formatted = value.toLocaleDateString(this.currentLang === 'mol' ? 'ru-MD' : this.currentLang);
      } else if (typeof value === 'number' && key.toLowerCase().includes('number')) {
        formatted = value.toLocaleString(this.currentLang === 'mol' ? 'ru-MD' : this.currentLang);
      }

      result = result.replaceAll(`{{${key}}}`, formatted);
    });

    return result;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
