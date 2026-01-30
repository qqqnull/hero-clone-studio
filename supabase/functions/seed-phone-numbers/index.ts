import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 完整的国家规则
const COUNTRY_RULES: Record<string, { prefix: string; length: number }> = {
  'US': { prefix: '1', length: 10 },
  'CA': { prefix: '1', length: 10 },
  'CN': { prefix: '86', length: 11 },
  'TW': { prefix: '886', length: 9 },
  'HK': { prefix: '852', length: 8 },
  'JP': { prefix: '81', length: 10 },
  'KR': { prefix: '82', length: 10 },
  'SG': { prefix: '65', length: 8 },
  'TH': { prefix: '66', length: 9 },
  'VN': { prefix: '84', length: 9 },
  'ID': { prefix: '62', length: 9 },
  'PH': { prefix: '63', length: 10 },
  'MY': { prefix: '60', length: 9 },
  'IN': { prefix: '91', length: 10 },
  'BD': { prefix: '880', length: 9 },
  'PK': { prefix: '92', length: 9 },
  'LK': { prefix: '94', length: 9 },
  'AU': { prefix: '61', length: 9 },
  'NZ': { prefix: '64', length: 9 },
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
  'SE': { prefix: '46', length: 9 },
  'NO': { prefix: '47', length: 8 },
  'FI': { prefix: '358', length: 9 },
  'DK': { prefix: '45', length: 8 },
  'RU': { prefix: '7', length: 10 },
  'PL': { prefix: '48', length: 9 },
  'UA': { prefix: '380', length: 9 },
  'CZ': { prefix: '420', length: 9 },
  'RO': { prefix: '40', length: 9 },
  'HU': { prefix: '36', length: 9 },
  'GR': { prefix: '30', length: 10 },
  'AE': { prefix: '971', length: 9 },
  'SA': { prefix: '966', length: 9 },
  'TR': { prefix: '90', length: 10 },
  'EG': { prefix: '20', length: 10 },
  'ZA': { prefix: '27', length: 9 },
  'NG': { prefix: '234', length: 10 },
  'KE': { prefix: '254', length: 9 },
  'BR': { prefix: '55', length: 10 },
  'MX': { prefix: '52', length: 10 },
  'AR': { prefix: '54', length: 10 },
  'CO': { prefix: '57', length: 10 },
  'CL': { prefix: '56', length: 9 },
  'PE': { prefix: '51', length: 9 },
  'VE': { prefix: '58', length: 10 },
}

// 中国号段
const CHINA_SEGMENTS = [
  '134', '135', '136', '137', '138', '139', '147', '150', '151', '152',
  '157', '158', '159', '182', '183', '184', '187', '188', '195', '198',
  '130', '131', '132', '145', '155', '156', '166', '185', '186', '196',
  '133', '149', '153', '173', '177', '180', '181', '189', '190', '191', '193', '199'
]

function randomDigits(n: number): string {
  let result = ''
  for (let i = 0; i < n; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

function generatePhoneNumber(countryCode: string): string {
  const code = countryCode.toUpperCase()

  if (code === 'CN') {
    const pre = CHINA_SEGMENTS[Math.floor(Math.random() * CHINA_SEGMENTS.length)]
    const phone = pre + randomDigits(8)
    return `+(86)${phone}`
  }

  if (code === 'SG') {
    const rule = COUNTRY_RULES['SG']
    const thirdDigit = Math.random() < 0.5 ? '8' : '9'
    const phone = thirdDigit + randomDigits(rule.length - 1)
    return `+(${rule.prefix})${phone}`
  }

  const rule = COUNTRY_RULES[code]
  if (!rule) {
    return `+(0)${randomDigits(10)}`
  }

  const phone = randomDigits(rule.length)
  return `+(${rule.prefix})${phone}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { countPerCountry = 100 } = await req.json().catch(() => ({}))

    // 获取所有活跃国家
    const { data: countries, error: countriesError } = await supabaseClient
      .from('countries')
      .select('id, code')
      .eq('is_active', true)

    if (countriesError) {
      throw new Error(`Failed to fetch countries: ${countriesError.message}`)
    }

    const results: { countryCode: string; generated: number; total: number }[] = []
    let totalGenerated = 0

    // 为每个国家生成号码（共享号码库，不绑定服务）
    for (const country of countries || []) {
      // 获取该国家现有号码
      const { data: existingNumbers } = await supabaseClient
        .from('phone_numbers')
        .select('number')
        .eq('country_id', country.id)

      const existingSet = new Set(existingNumbers?.map(n => n.number) || [])

      // 如果已有足够号码，跳过
      if (existingSet.size >= countPerCountry) {
        results.push({
          countryCode: country.code,
          generated: 0,
          total: existingSet.size
        })
        continue
      }

      const needToGenerate = countPerCountry - existingSet.size

      // 生成新号码
      const newNumbers: { number: string; country_id: string; price: number; status: string }[] = []
      let attempts = 0
      const maxAttempts = needToGenerate * 10

      while (newNumbers.length < needToGenerate && attempts < maxAttempts) {
        const number = generatePhoneNumber(country.code)
        if (!existingSet.has(number)) {
          existingSet.add(number)
          newNumbers.push({
            number,
            country_id: country.id,
            price: 0.05,
            status: 'available'
          })
        }
        attempts++
      }

      // 批量插入
      if (newNumbers.length > 0) {
        const { error: insertError } = await supabaseClient
          .from('phone_numbers')
          .insert(newNumbers)

        if (insertError) {
          console.error(`Insert error for ${country.code}:`, insertError)
          continue
        }

        results.push({
          countryCode: country.code,
          generated: newNumbers.length,
          total: existingSet.size
        })
        totalGenerated += newNumbers.length
      }
    }

    console.log(`Seed complete: generated ${totalGenerated} phone numbers across ${results.length} countries`)

    return new Response(
      JSON.stringify({
        success: true,
        totalGenerated,
        countriesProcessed: results.length,
        details: results,
        message: `Successfully generated ${totalGenerated} phone numbers across ${results.length} countries`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
