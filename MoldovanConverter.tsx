import React, { useState, useEffect } from 'react';

// Базовая карта транслитерации (стандартная кириллическая графика)
const LATIN_TO_CYRILLIC: Record<string, string> = {
  'A': 'А', 'a': 'а',
  'B': 'Б', 'b': 'б',
  'V': 'В', 'v': 'в',
  'G': 'Г', 'g': 'г',
  'D': 'Д', 'd': 'д',
  'E': 'Е', 'e': 'е',
  'J': 'Ж', 'j': 'ж',
  'Z': 'З', 'z': 'з',
  'I': 'И', 'i': 'и',
  'C': 'Ч', 'c': 'ч', // Базовое соответствие, сложные буквосочетания обработаем отдельно
  'K': 'К', 'k': 'к',
  'L': 'Л', 'l': 'л',
  'M': 'М', 'm': 'м',
  'N': 'Н', 'n': 'н',
  'O': 'О', 'o': 'о',
  'P': 'П', 'p': 'п',
  'R': 'Р', 'r': 'р',
  'S': 'С', 's': 'с',
  'T': 'Т', 't': 'т',
  'U': 'У', 'u': 'у',
  'F': 'Ф', 'f': 'ф',
  'H': 'Х', 'h': 'х',
  'Ț': 'Ц', 'ț': 'ц', 'Ts': 'Ц', 'ts': 'ц',
  'Ș': 'Ш', 'ș': 'ш', 'Sh': 'Ш', 'sh': 'ш',
  'Ă': 'Э', 'ă': 'э',
  'Â': 'Ы', 'â': 'ы', 'Î': 'Ы', 'î': 'ы'
};

// Обратная карта для Кириллическо-Латинского направления
const CYRILLIC_TO_LATIN: Record<string, string> = Object.fromEntries(
  Object.entries(LATIN_TO_CYRILLIC).map(([lat, cyr]) => [cyr, lat])
);

// Дополнительные специфичные правила для кириллицы
CYRILLIC_TO_LATIN['Я'] = 'Ia'; CYRILLIC_TO_LATIN['я'] = 'ia';
CYRILLIC_TO_LATIN['Ю'] = 'Iu'; CYRILLIC_TO_LATIN['ю'] = 'iu';
CYRILLIC_TO_LATIN['Е'] = 'E';  CYRILLIC_TO_LATIN['е'] = 'e';

export default function MoldovanConverter() {
  const [direction, setDirection] = useState<'lat-cyr' | 'cyr-lat'>('lat-cyr');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const convertText = (text: string, currentDirection: 'lat-cyr' | 'cyr-lat') => {
    if (!text) return '';

    if (currentDirection === 'lat-cyr') {
      // Сложные сочетания букв (диграфы) перед общей заменой
      let processed = text
        .replace(/cea/g, 'ча').replace(/Cea/g, 'Ча').replace(/CEA/g, 'ЧА')
        .replace(/cia/g, 'ча').replace(/Cia/g, 'Ча').replace(/CIA/g, 'ЧА')
        .replace(/che/g, 'ке').replace(/Che/g, 'Ке').replace(/CHE/g, 'КЕ')
        .replace(/chi/g, 'ки').replace(/Chi/g, 'Ки').replace(/CHI/g, 'КИ')
        .replace(/Ghe/g, 'Ге').replace(/ghe/g, 'ге').replace(/GHE/g, 'ГЕ')
        .replace(/Ghi/g, 'Ги').replace(/ghi/g, 'ги').replace(/GHI/g, 'ГИ')
        .replace(/Gi/g, 'Джи').replace(/gi/g, 'джи').replace(/GI/g, 'ДЖИ')
        .replace(/Ge/g, 'Дже').replace(/ge/g, 'дже').replace(/GE/g, 'ДЖЕ');

      return processed.split('').map(char => LATIN_TO_CYRILLIC[char] || char).join('');
    } else {
      // Конвертация из кириллицы в латиницу
      let processed = text;
      return processed.split('').map(char => CYRILLIC_TO_LATIN[char] || char).join('');
    }
  };

  useEffect(() => {
    setOutput(convertText(input, direction));
  }, [input, direction]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl p-6 mt-10 shadow-2xl border border-white/20">
        
        {/* Заголовок с флагом */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🇲🇩</div>
          <h1 className="text-2xl font-bold tracking-wide">Молдавский конвертер</h1>
          <p className="text-xs text-gray-300 mt-1">Latin ↔ Кириллица • Limba moldovenească</p>
        </div>

        {/* Переключатель направления */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-2xl mb-6">
          <button
            onClick={() => setDirection('lat-cyr')}
            className={`py-3 rounded-xl text-sm font-semibold transition-all ${
              direction === 'lat-cyr' ? 'bg-white text-indigo-900 shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            Latin → Кириллица
          </button>
          <button
            onClick={() => setDirection('cyr-lat')}
            className={`py-3 rounded-xl text-sm font-semibold transition-all ${
              direction === 'cyr-lat' ? 'bg-white text-indigo-900 shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            Кириллица → Latin
          </button>
        </div>

        {/* Блоки ввода/вывода */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              {direction === 'lat-cyr' ? '✏️ Latin (введите текст)' : '✏️ Кириллица (введите текст)'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Introduceți textul..."
              className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-wider">
              {direction === 'lat-cyr' ? '✅ Кириллица (результат)' : '✅ Latin (результат)'}
            </label>
            <textarea
              value={output}
              readOnly
              placeholder="Результат конвертации..."
              className="w-full h-32 bg-black/40 border border-white/5 rounded-xl p-3 text-emerald-300 focus:outline-none resize-none cursor-default"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
