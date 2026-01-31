import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Book, ShieldCheck, List, Code, AlertTriangle, Copy, Check } from 'lucide-react';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { id: 'introduction', icon: <Book className="h-4 w-4" />, titleKey: 'api.nav.introduction' },
  { id: 'authentication', icon: <ShieldCheck className="h-4 w-4" />, titleKey: 'api.nav.authentication' },
  { id: 'endpoints', icon: <List className="h-4 w-4" />, titleKey: 'api.nav.endpoints' },
  { id: 'examples', icon: <Code className="h-4 w-4" />, titleKey: 'api.nav.examples' },
  { id: 'errors', icon: <AlertTriangle className="h-4 w-4" />, titleKey: 'api.nav.errors' },
];

const endpoints = [
  { path: '/api/countries', method: 'GET', methodColor: 'bg-green-500', descKey: 'api.endpoints.countries' },
  { path: '/api/services/{country_id}', method: 'GET', methodColor: 'bg-green-500', descKey: 'api.endpoints.services' },
  { path: '/api/get_number', method: 'POST', methodColor: 'bg-blue-500', descKey: 'api.endpoints.getNumber' },
  { path: '/api/verify_code', method: 'POST', methodColor: 'bg-blue-500', descKey: 'api.endpoints.verifyCode' },
  { path: '/api/cancel_number', method: 'POST', methodColor: 'bg-red-500', descKey: 'api.endpoints.cancelNumber' },
  { path: '/api/balance', method: 'GET', methodColor: 'bg-green-500', descKey: 'api.endpoints.balance' },
];

const errors = [
  { code: 'AUTH_FAILED', descKey: 'api.errors.authFailed', solutionKey: 'api.errors.authFailedSolution' },
  { code: 'INVALID_PARAMS', descKey: 'api.errors.invalidParams', solutionKey: 'api.errors.invalidParamsSolution' },
  { code: 'INSUFFICIENT_BALANCE', descKey: 'api.errors.insufficientBalance', solutionKey: 'api.errors.insufficientBalanceSolution' },
  { code: 'SERVICE_UNAVAILABLE', descKey: 'api.errors.serviceUnavailable', solutionKey: 'api.errors.serviceUnavailableSolution' },
];

const pythonCode = `import requests

api_key = 'your-api-key'
headers = {'Authorization': f'Bearer {api_key}'}

# 获取国家列表
response = requests.get('https://api.herosms.com/countries', headers=headers)
countries = response.json()

# 获取服务列表
country_id = 1
response = requests.get(f'https://api.herosms.com/services/{country_id}', headers=headers)
services = response.json()

# 获取号码
data = {
    'country_id': country_id,
    'service_id': 1
}
response = requests.post('https://api.herosms.com/get_number', headers=headers, json=data)
number = response.json()`;

const javascriptCode = `const apiKey = 'your-api-key';
const headers = {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
};

// 获取国家列表
fetch('https://api.herosms.com/countries', { headers })
    .then(response => response.json())
    .then(countries => console.log(countries));

// 获取服务列表
const countryId = 1;
fetch(\`https://api.herosms.com/services/\${countryId}\`, { headers })
    .then(response => response.json())
    .then(services => console.log(services));

// 获取号码
fetch('https://api.herosms.com/get_number', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        country_id: countryId,
        service_id: 1
    })
})
    .then(response => response.json())
    .then(number => console.log(number));`;

export default function ApiDocsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('introduction');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast({
      title: t('api.copied'),
      description: t('api.copiedDesc'),
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="API文档"
        description="HEROSMS API开发文档，提供完整的接口说明、认证方式、代码示例。支持Python、JavaScript等多种语言。"
        keywords="HEROSMS API,接码API,虚拟号码API,短信验证码API,SMS API"
        url="/api"
      />
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    {t('api.docNav')}
                  </h3>
                  <div className="space-y-1">
                    {navItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                          activeSection === item.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {item.icon}
                        <span>{t(item.titleKey)}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Introduction */}
              {activeSection === 'introduction' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('api.introTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {t('api.introDesc')}
                    </p>
                    <ul className="space-y-3">
                      {['api.intro1', 'api.intro2', 'api.intro3', 'api.intro4'].map((key, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{t(key)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Authentication */}
              {activeSection === 'authentication' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('api.authTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{t('api.authDesc')}</p>
                    <div className="bg-muted rounded-lg p-4">
                      <code className="text-sm">
                        Authorization: Bearer YOUR_API_KEY
                      </code>
                    </div>
                    <p className="text-muted-foreground">{t('api.authNote')}</p>
                  </CardContent>
                </Card>
              )}

              {/* Endpoints */}
              {activeSection === 'endpoints' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('api.endpointsTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {endpoints.map((endpoint, index) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${endpoint.methodColor} text-white`}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm font-mono">{endpoint.path}</code>
                          </div>
                          <p className="text-sm text-muted-foreground">{t(endpoint.descKey)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Examples */}
              {activeSection === 'examples' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Python</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(pythonCode, 'python')}
                        >
                          {copiedCode === 'python' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                        <code>{pythonCode}</code>
                      </pre>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>JavaScript</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(javascriptCode, 'javascript')}
                        >
                          {copiedCode === 'javascript' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                        <code>{javascriptCode}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Errors */}
              {activeSection === 'errors' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('api.errorsTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {errors.map((error, index) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive">{error.code}</Badge>
                          </div>
                          <p className="text-sm text-foreground mb-1">{t(error.descKey)}</p>
                          <p className="text-sm text-muted-foreground">{t(error.solutionKey)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
