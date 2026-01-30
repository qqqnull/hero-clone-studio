import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 国家代码到规则的映射
const COUNTRY_RULES: Record<string, { prefix: string; length: number }> = {
  'US': { prefix: '1', length: 10 },
  'JP': { prefix: '81', length: 10 },
  'KR': { prefix: '82', length: 10 },
  'IN': { prefix: '91', length: 10 },
  'AU': { prefix: '61', length: 9 },
  'SG': { prefix: '65', length: 8 },
  'GB': { prefix: '44', length: 10 },
  'DE': { prefix: '49', length: 10 },
  'FR': { prefix: '33', length: 9 },
  'CA': { prefix: '1', length: 10 },
  'RU': { prefix: '7', length: 10 },
  'BR': { prefix: '55', length: 10 },
  'ZA': { prefix: '27', length: 9 },
  'MX': { prefix: '52', length: 10 },
  'IT': { prefix: '39', length: 10 },
  'ES': { prefix: '34', length: 9 },
  'NL': { prefix: '31', length: 9 },
  'NZ': { prefix: '64', length: 9 },
  'TH': { prefix: '66', length: 9 },
  'VN': { prefix: '84', length: 9 },
  'ID': { prefix: '62', length: 9 },
  'PH': { prefix: '63', length: 10 },
  'TW': { prefix: '886', length: 9 },
  'HK': { prefix: '852', length: 8 },
  'AE': { prefix: '971', length: 9 },
  'SA': { prefix: '966', length: 9 },
  'EG': { prefix: '20', length: 10 },
  'TR': { prefix: '90', length: 10 },
  'SE': { prefix: '46', length: 9 },
  'CH': { prefix: '41', length: 9 },
  'BE': { prefix: '32', length: 9 },
  'NO': { prefix: '47', length: 8 },
  'FI': { prefix: '358', length: 9 },
  'DK': { prefix: '45', length: 8 },
  'IE': { prefix: '353', length: 9 },
  'PT': { prefix: '351', length: 9 },
  'PL': { prefix: '48', length: 9 },
  'GR': { prefix: '30', length: 10 },
  'HU': { prefix: '36', length: 9 },
  'CZ': { prefix: '420', length: 9 },
  'RO': { prefix: '40', length: 9 },
  'CL': { prefix: '56', length: 9 },
  'AR': { prefix: '54', length: 10 },
  'CO': { prefix: '57', length: 10 },
  'MY': { prefix: '60', length: 9 },
  'BD': { prefix: '880', length: 9 },
  'PK': { prefix: '92', length: 9 },
  'LK': { prefix: '94', length: 9 },
  'UA': { prefix: '380', length: 9 },
  'NG': { prefix: '234', length: 10 },
  'KE': { prefix: '254', length: 9 },
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

// 生成n位随机数字
function randomDigits(n: number): string {
  let result = ''
  for (let i = 0; i < n; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

// 生成手机号
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

    const { countryId, serviceId, count = 50 } = await req.json()

    if (!countryId || !serviceId) {
      return new Response(
        JSON.stringify({ error: 'countryId and serviceId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取国家信息
    const { data: country, error: countryError } = await supabaseClient
      .from('countries')
      .select('code')
      .eq('id', countryId)
      .single()

    if (countryError || !country) {
      return new Response(
        JSON.stringify({ error: 'Country not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取服务价格
    const { data: servicePrice } = await supabaseClient
      .from('service_prices')
      .select('price')
      .eq('country_id', countryId)
      .eq('service_id', serviceId)
      .maybeSingle()

    const price = servicePrice?.price || 0.05

    // 获取现有号码以避免重复
    const { data: existingNumbers } = await supabaseClient
      .from('phone_numbers')
      .select('number')
      .eq('country_id', countryId)
      .eq('service_id', serviceId)

    const existingSet = new Set(existingNumbers?.map(n => n.number) || [])

    // 生成新号码
    const newNumbers: { number: string; country_id: string; service_id: string; price: number; status: string }[] = []
    let attempts = 0
    const maxAttempts = count * 10

    while (newNumbers.length < count && attempts < maxAttempts) {
      const number = generatePhoneNumber(country.code)
      if (!existingSet.has(number)) {
        existingSet.add(number)
        newNumbers.push({
          number,
          country_id: countryId,
          service_id: serviceId,
          price,
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
        console.error('Insert error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to insert phone numbers', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 更新 service_prices 的库存
      const { data: currentStock } = await supabaseClient
        .from('service_prices')
        .select('stock')
        .eq('country_id', countryId)
        .eq('service_id', serviceId)
        .maybeSingle()

      await supabaseClient
        .from('service_prices')
        .update({ stock: (currentStock?.stock || 0) + newNumbers.length })
        .eq('country_id', countryId)
        .eq('service_id', serviceId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: newNumbers.length,
        countryCode: country.code,
        message: `Successfully generated ${newNumbers.length} phone numbers`
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
