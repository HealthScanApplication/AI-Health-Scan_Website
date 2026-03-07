import React, { useEffect, useState } from 'react';
import { ExternalLink, CheckCircle, XCircle, AlertCircle, TrendingUp, Package, FlaskConical, Pill, ShoppingCart, DollarSign, Globe, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface HealthScanProductsOverviewProps {
  accessToken?: string;
}

interface HsTest {
  id: string;
  slug: string;
  name: string;
  category: string;
  retail_price_eur: number;
  buy_url?: string;
  sample_order_url?: string;
  provider_eu?: string;
  provider_uk?: string;
  provider_us?: string;
  provider_au?: string;
  api_dropship_available?: boolean;
  api_dropship_connected?: boolean;
  is_active: boolean;
  icon_url?: string;
  image_url?: string;
}

interface HsSupplement {
  id: string;
  slug: string;
  name: string;
  retail_price: number;
  currency: string;
  buy_url?: string;
  amazon_url?: string;
  iherb_url?: string;
  affiliate_url?: string;
  is_active: boolean;
  icon_url?: string;
  image_url?: string;
}

interface HsProduct {
  id: string;
  slug: string;
  name: string;
  product_type: string;
  category: string;
  retail_price: number;
  currency: string;
  buy_url?: string;
  source_url?: string;
  source_platform?: string;
  affiliate_available?: boolean;
  affiliate_connected?: boolean;
  is_active: boolean;
  is_featured: boolean;
  icon_url?: string;
  image_url?: string;
}

export function HealthScanProductsOverview({ accessToken }: HealthScanProductsOverviewProps) {
  const [tests, setTests] = useState<HsTest[]>([]);
  const [supplements, setSupplements] = useState<HsSupplement[]>([]);
  const [products, setProducts] = useState<HsProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { apikey: publicAnonKey };
      const [testsRes, suppsRes, prodsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/rest/v1/hs_tests?select=*&order=name`, { headers }),
        fetch(`https://${projectId}.supabase.co/rest/v1/hs_supplements?select=*&order=name`, { headers }),
        fetch(`https://${projectId}.supabase.co/rest/v1/hs_products?select=*&order=name`, { headers }),
      ]);
      const [testsData, suppsData, prodsData] = await Promise.all([
        testsRes.json(),
        suppsRes.json(),
        prodsRes.json(),
      ]);
      setTests(testsData || []);
      setSupplements(suppsData || []);
      setProducts(prodsData || []);
    } catch (err) {
      console.error('Failed to fetch HS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const testStats = {
    total: tests.length,
    active: tests.filter(t => t.is_active).length,
    withBuyLink: tests.filter(t => t.buy_url).length,
    withSampleLink: tests.filter(t => t.sample_order_url).length,
    withApiDropship: tests.filter(t => t.api_dropship_available).length,
    apiConnected: tests.filter(t => t.api_dropship_connected).length,
    withImages: tests.filter(t => t.icon_url || t.image_url).length,
    totalRevenue: tests.reduce((sum, t) => sum + (t.retail_price_eur || 0), 0),
  };

  const suppStats = {
    total: supplements.length,
    active: supplements.filter(s => s.is_active).length,
    withBuyLink: supplements.filter(s => s.buy_url || s.affiliate_url).length,
    withAmazon: supplements.filter(s => s.amazon_url).length,
    withIHerb: supplements.filter(s => s.iherb_url).length,
    withImages: supplements.filter(s => s.icon_url || s.image_url).length,
    totalRevenue: supplements.reduce((sum, s) => sum + (s.retail_price || 0), 0),
  };

  const prodStats = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    featured: products.filter(p => p.is_featured).length,
    withBuyLink: products.filter(p => p.buy_url).length,
    withSourceLink: products.filter(p => p.source_url).length,
    affiliateAvailable: products.filter(p => p.affiliate_available).length,
    affiliateConnected: products.filter(p => p.affiliate_connected).length,
    withImages: products.filter(p => p.icon_url || p.image_url).length,
    totalRevenue: products.reduce((sum, p) => sum + (p.retail_price || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HealthScan Products Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Live status, links, and sales readiness for all HealthScan products</p>
        </div>
        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
          {testStats.total + suppStats.total + prodStats.total} Total Products
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tests Card */}
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="w-5 h-5 text-indigo-600" />
              <span>Tests</span>
              <Badge className="ml-auto bg-indigo-600">{testStats.active}/{testStats.total}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Buy Links</span>
              <span className="font-semibold">{testStats.withBuyLink}/{testStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sample Links</span>
              <span className="font-semibold">{testStats.withSampleLink}/{testStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">API Dropship</span>
              <span className="font-semibold text-green-600">{testStats.apiConnected}/{testStats.withApiDropship}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">With Images</span>
              <span className="font-semibold">{testStats.withImages}/{testStats.total}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Total Value</span>
              <span className="font-bold text-indigo-700">€{testStats.totalRevenue.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Supplements Card */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="w-5 h-5 text-emerald-600" />
              <span>Supplements</span>
              <Badge className="ml-auto bg-emerald-600">{suppStats.active}/{suppStats.total}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Buy Links</span>
              <span className="font-semibold">{suppStats.withBuyLink}/{suppStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amazon Links</span>
              <span className="font-semibold">{suppStats.withAmazon}/{suppStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">iHerb Links</span>
              <span className="font-semibold">{suppStats.withIHerb}/{suppStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">With Images</span>
              <span className="font-semibold">{suppStats.withImages}/{suppStats.total}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Total Value</span>
              <span className="font-bold text-emerald-700">€{suppStats.totalRevenue.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-teal-600" />
              <span>Products</span>
              <Badge className="ml-auto bg-teal-600">{prodStats.active}/{prodStats.total}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Featured</span>
              <span className="font-semibold">{prodStats.featured}/{prodStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Buy Links</span>
              <span className="font-semibold">{prodStats.withBuyLink}/{prodStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Affiliate Ready</span>
              <span className="font-semibold text-green-600">{prodStats.affiliateConnected}/{prodStats.affiliateAvailable}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">With Images</span>
              <span className="font-semibold">{prodStats.withImages}/{prodStats.total}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Total Value</span>
              <span className="font-bold text-teal-700">€{prodStats.totalRevenue.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Product Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tests List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              Tests ({tests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {tests.map(test => (
              <div key={test.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                {test.icon_url || test.image_url ? (
                  <img src={test.icon_url || test.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-5 h-5 text-indigo-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{test.name}</div>
                  <div className="text-[10px] text-gray-500">€{test.retail_price_eur}</div>
                  <div className="flex gap-1 mt-1">
                    {test.buy_url && (
                      <a href={test.buy_url} target="_blank" rel="noopener noreferrer" className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
                        Buy
                      </a>
                    )}
                    {test.sample_order_url && (
                      <a href={test.sample_order_url} target="_blank" rel="noopener noreferrer" className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        Sample
                      </a>
                    )}
                    {test.api_dropship_connected && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">API</span>
                    )}
                  </div>
                </div>
                {!test.is_active && <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Supplements List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              Supplements ({supplements.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {supplements.map(supp => (
              <div key={supp.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                {supp.icon_url || supp.image_url ? (
                  <img src={supp.icon_url || supp.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{supp.name}</div>
                  <div className="text-[10px] text-gray-500">{supp.currency} {supp.retail_price}</div>
                  <div className="flex gap-1 mt-1">
                    {(supp.buy_url || supp.affiliate_url) && (
                      <a href={supp.buy_url || supp.affiliate_url} target="_blank" rel="noopener noreferrer" className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                        Buy
                      </a>
                    )}
                    {supp.amazon_url && (
                      <a href={supp.amazon_url} target="_blank" rel="noopener noreferrer" className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                        Amazon
                      </a>
                    )}
                    {supp.iherb_url && (
                      <a href={supp.iherb_url} target="_blank" rel="noopener noreferrer" className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">
                        iHerb
                      </a>
                    )}
                  </div>
                </div>
                {!supp.is_active && <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-600" />
              Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {products.map(prod => (
              <div key={prod.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                {prod.icon_url || prod.image_url ? (
                  <img src={prod.icon_url || prod.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-teal-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{prod.name}</div>
                  <div className="text-[10px] text-gray-500">{prod.currency} {prod.retail_price} · {prod.product_type}</div>
                  <div className="flex gap-1 mt-1">
                    {prod.buy_url && (
                      <a href={prod.buy_url} target="_blank" rel="noopener noreferrer" className="text-[9px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded hover:bg-teal-200">
                        Buy
                      </a>
                    )}
                    {prod.source_url && (
                      <a href={prod.source_url} target="_blank" rel="noopener noreferrer" className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        Source
                      </a>
                    )}
                    {prod.affiliate_connected && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Affiliate</span>
                    )}
                    {prod.is_featured && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">★</span>
                    )}
                  </div>
                </div>
                {!prod.is_active && <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {testStats.withBuyLink < testStats.total && (
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-700">{testStats.total - testStats.withBuyLink} tests missing buy links</span>
            </div>
          )}
          {testStats.withImages < testStats.total && (
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-700">{testStats.total - testStats.withImages} tests missing images</span>
            </div>
          )}
          {suppStats.withBuyLink < suppStats.total && (
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-700">{suppStats.total - suppStats.withBuyLink} supplements missing buy links</span>
            </div>
          )}
          {prodStats.withBuyLink < prodStats.total && (
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-700">{prodStats.total - prodStats.withBuyLink} products missing buy links</span>
            </div>
          )}
          {testStats.withApiDropship > testStats.apiConnected && (
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-700">{testStats.withApiDropship - testStats.apiConnected} tests with API dropship available but not connected</span>
            </div>
          )}
          {prodStats.affiliateAvailable > prodStats.affiliateConnected && (
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span className="text-gray-700">{prodStats.affiliateAvailable - prodStats.affiliateConnected} products with affiliate available but not connected</span>
            </div>
          )}
          {testStats.withBuyLink === testStats.total && suppStats.withBuyLink === suppStats.total && prodStats.withBuyLink === prodStats.total && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">All products have buy links! 🎉</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
