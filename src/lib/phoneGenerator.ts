// 完整的国家规则 - 基于 aidamoxing.com 的手机号生成规则（覆盖50+国家）
const COUNTRY_RULES: Record<string, { prefix: string; length: number }> = {
  // 北美
  'US': { prefix: '1', length: 10 },
  'CA': { prefix: '1', length: 10 },
  
  // 东亚
  'CN': { prefix: '86', length: 11 },
  'TW': { prefix: '886', length: 9 },
  'HK': { prefix: '852', length: 8 },
  'JP': { prefix: '81', length: 10 },
  'KR': { prefix: '82', length: 10 },
  
  // 东南亚
  'SG': { prefix: '65', length: 8 },
  'TH': { prefix: '66', length: 9 },
  'VN': { prefix: '84', length: 9 },
  'ID': { prefix: '62', length: 9 },
  'PH': { prefix: '63', length: 10 },
  'MY': { prefix: '60', length: 9 },
  
  // 南亚
  'IN': { prefix: '91', length: 10 },
  'BD': { prefix: '880', length: 9 },
  'PK': { prefix: '92', length: 9 },
  'LK': { prefix: '94', length: 9 },
  
  // 大洋洲
  'AU': { prefix: '61', length: 9 },
  'NZ': { prefix: '64', length: 9 },
  
  // 西欧
  'GB': { prefix: '44', length: 10 },
  'DE': { prefix: '49', length: 10 },
  'FR': { prefix: '33', length: 9 },
  'IT': { prefix: '39', length: 10 },
  'ES': { prefix: '34', length: 9 },
  'NL': { prefix: '31', length: 9 },
  'BE': { prefix: '32', length: 9 },
  'CH': { prefix: '41', length: 9 },
  'IE': { prefix: '353', length: 9 },
  'PT': { prefix: '351', length: 9 },
  
  // 北欧
  'SE': { prefix: '46', length: 9 },
  'NO': { prefix: '47', length: 8 },
  'FI': { prefix: '358', length: 9 },
  'DK': { prefix: '45', length: 8 },
  
  // 东欧
  'RU': { prefix: '7', length: 10 },
  'PL': { prefix: '48', length: 9 },
  'UA': { prefix: '380', length: 9 },
  'CZ': { prefix: '420', length: 9 },
  'RO': { prefix: '40', length: 9 },
  'HU': { prefix: '36', length: 9 },
  'GR': { prefix: '30', length: 10 },
  
  // 中东
  'AE': { prefix: '971', length: 9 },
  'SA': { prefix: '966', length: 9 },
  'TR': { prefix: '90', length: 10 },
  'EG': { prefix: '20', length: 10 },
  
  // 非洲
  'ZA': { prefix: '27', length: 9 },
  'NG': { prefix: '234', length: 10 },
  'KE': { prefix: '254', length: 9 },
  
  // 南美
  'BR': { prefix: '55', length: 10 },
  'MX': { prefix: '52', length: 10 },
  'AR': { prefix: '54', length: 10 },
  'CO': { prefix: '57', length: 10 },
  'CL': { prefix: '56', length: 9 },
  'PE': { prefix: '51', length: 9 },
  'VE': { prefix: '58', length: 10 },
};

// 中国号段 - 三大运营商
const CHINA_SEGMENTS = {
  mobile: ['134', '135', '136', '137', '138', '139', '147', '150', '151', '152',
           '157', '158', '159', '182', '183', '184', '187', '188', '195', '198'],
  unicom: ['130', '131', '132', '145', '155', '156', '166', '185', '186', '196'],
  telecom: ['133', '149', '153', '173', '177', '180', '181', '189', '190', '191', '193', '199']
};

// 生成n位随机数字
function randomDigits(n: number): string {
  let result = '';
  for (let i = 0; i < n; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

// 生成手机号
export function generatePhoneNumber(countryCode: string): string {
  const code = countryCode.toUpperCase();
  
  if (code === 'CN') {
    // 中国特殊处理 - 随机选择运营商
    const allSegments = [
      ...CHINA_SEGMENTS.mobile,
      ...CHINA_SEGMENTS.unicom,
      ...CHINA_SEGMENTS.telecom
    ];
    const pre = allSegments[Math.floor(Math.random() * allSegments.length)];
    const phone = pre + randomDigits(8);
    return `+(86)${phone}`;
  }

  if (code === 'SG') {
    // 新加坡特殊处理 - 以8或9开头
    const rule = COUNTRY_RULES['SG'];
    const thirdDigit = Math.random() < 0.5 ? '8' : '9';
    const phone = thirdDigit + randomDigits(rule.length - 1);
    return `+(${rule.prefix})${phone}`;
  }

  // 其他国家
  const rule = COUNTRY_RULES[code];
  if (!rule) {
    // 默认规则 - 使用通用格式
    return `+(0)${randomDigits(10)}`;
  }

  const phone = randomDigits(rule.length);
  return `+(${rule.prefix})${phone}`;
}

// 为指定国家生成多个手机号
export function generatePhoneNumbersForCountry(countryCode: string, count: number = 100): string[] {
  const numbers: string[] = [];
  const generatedSet = new Set<string>();
  
  while (numbers.length < count) {
    const number = generatePhoneNumber(countryCode);
    // 确保不重复
    if (!generatedSet.has(number)) {
      generatedSet.add(number);
      numbers.push(number);
    }
  }
  
  return numbers;
}

// 获取国家区号
export function getCountryPrefix(countryCode: string): string {
  const code = countryCode.toUpperCase();

  if (code === 'CN') {
    return '+86';
  }

  const rule = COUNTRY_RULES[code];
  return rule ? `+${rule.prefix}` : '+0';
}

// 获取规则信息
export function getCountryRule(countryCode: string): { prefix: string; length: number } | null {
  const code = countryCode.toUpperCase();
  if (code === 'CN') {
    return { prefix: '86', length: 11 };
  }
  return COUNTRY_RULES[code] || null;
}

// 导出国家规则供其他模块使用
export { COUNTRY_RULES, CHINA_SEGMENTS };
