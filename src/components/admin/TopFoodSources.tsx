import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ExternalLink, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface FoodSource {
  id: string;
  name: string;
  image_url?: string;
  quantity: number;
  unit: string;
  per_serving?: string;
  category?: string;
  type?: string;
}

interface TopFoodSourcesProps {
  elementId: string;
  elementName: string;
  accessToken?: string;
  onFoodClick?: (foodId: string) => void;
}

export const TopFoodSources: React.FC<TopFoodSourcesProps> = ({
  elementId,
  elementName,
  accessToken,
  onFoodClick,
}) => {
  const [foods, setFoods] = useState<FoodSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTopFoods = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query catalog_ingredients for foods containing this element
        // Filter for records where elements_content contains the element_id key
        const url = `https://${projectId}.supabase.co/rest/v1/catalog_ingredients?select=id,name,image_url,category,type,elements_content&elements_content->>${elementId}=not.is.null&limit=100`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
            apikey: publicAnonKey,
            Prefer: 'return=representation',
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch foods: ${res.statusText}`);
        }

        const data = await res.json();

        if (!cancelled) {
          // Transform and sort the data
          const transformedFoods: FoodSource[] = data
            .map((item: any) => {
              const elementData = item.elements_content?.[elementId];
              if (!elementData || !elementData.amount) return null;

              return {
                id: item.id,
                name: item.name,
                image_url: item.image_url,
                quantity: Number(elementData.amount) || 0,
                unit: elementData.unit || 'mg',
                per_serving: elementData.per || '100g',
                category: item.category,
                type: item.type,
              };
            })
            .filter(Boolean)
            .sort((a: FoodSource, b: FoodSource) => b.quantity - a.quantity)
            .slice(0, 10);

          setFoods(transformedFoods);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[TopFoodSources] Error fetching foods:', err);
          setError(err instanceof Error ? err.message : 'Failed to load food sources');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTopFoods();

    return () => {
      cancelled = true;
    };
  }, [elementId, accessToken]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Food Sources</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Food Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (foods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Food Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">
            No food sources found for {elementName}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Top 10 Food Sources of {elementName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {foods.map((food, index) => (
            <div
              key={food.id}
              className="group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
              onClick={() => onFoodClick?.(food.id)}
            >
              {/* Rank Badge */}
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                {index + 1}
              </div>

              {/* Food Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {food.image_url ? (
                  <img
                    src={food.image_url}
                    alt={food.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/64?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Food Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-700">
                      {food.name}
                    </h4>
                    {food.category && (
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {food.category}
                      </Badge>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                </div>

                {/* Quantity */}
                <div className="mt-1.5">
                  <div className="text-lg font-bold text-green-700">
                    {food.quantity}
                    <span className="text-xs font-medium ml-0.5 opacity-70">{food.unit}</span>
                  </div>
                  {food.per_serving && (
                    <div className="text-[10px] text-gray-500">per {food.per_serving}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
