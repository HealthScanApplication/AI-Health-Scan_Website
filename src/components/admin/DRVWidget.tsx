import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface DRVData {
  age_group: string;
  basis: string;
  male?: {
    deficiency?: {
      threshold: number;
      mild?: { symptoms: string[] };
      severe?: { symptoms: string[] };
    };
    optimal?: {
      minimum: number;
      recommended: number;
      maximum: number;
      benefits: string[];
    };
    excess?: {
      daily_limit?: { value: number; symptoms?: string[] };
      acute_limit?: { value: number; symptoms?: string[] };
    };
  };
  female?: {
    deficiency?: {
      threshold: number;
      mild?: { symptoms: string[] };
      severe?: { symptoms: string[] };
    };
    optimal?: {
      minimum: number;
      recommended: number;
      maximum: number;
      benefits: string[];
    };
    excess?: {
      daily_limit?: { value: number; symptoms?: string[] };
      acute_limit?: { value: number; symptoms?: string[] };
    };
    pregnancy?: {
      optimal?: {
        minimum: number;
        recommended: number;
        maximum: number;
        benefits?: string[];
      };
      excess?: {
        daily_limit?: { value: number; symptoms?: string[] };
      };
    };
    breastfeeding?: {
      optimal?: {
        minimum: number;
        recommended: number;
        maximum: number;
        benefits?: string[];
      };
      excess?: {
        daily_limit?: { value: number; symptoms?: string[] };
      };
    };
  };
}

interface AgeRanges {
  europe?: DRVData[];
  north_america?: DRVData[];
  average?: DRVData[];
}

interface FoodStrategy {
  animal?: string;
  plant?: string;
  fortified?: string;
  fermented?: string;
  other?: string;
}

interface DRVWidgetProps {
  ageRanges?: AgeRanges;
  foodStrategy?: FoodStrategy;
  dailyRecommendedAdult?: {
    male?: { value: number; unit: string };
    female?: { value: number; unit: string };
  };
  unit?: string;
}

export const DRVWidget: React.FC<DRVWidgetProps> = ({
  ageRanges,
  foodStrategy,
  dailyRecommendedAdult,
  unit = 'μg',
}) => {
  const [selectedRegion, setSelectedRegion] = React.useState<'europe' | 'north_america' | 'average'>('europe');
  const [selectedGender, setSelectedGender] = React.useState<'male' | 'female'>('male');

  const regionData = ageRanges?.[selectedRegion] || [];

  return (
    <div className="space-y-4">
      {/* Daily Recommended Adult Summary */}
      {dailyRecommendedAdult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Recommended (Adult)</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            {dailyRecommendedAdult.male && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">♂ Male</Badge>
                <span className="font-semibold">{dailyRecommendedAdult.male.value} {dailyRecommendedAdult.male.unit}</span>
              </div>
            )}
            {dailyRecommendedAdult.female && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-pink-50">♀ Female</Badge>
                <span className="font-semibold">{dailyRecommendedAdult.female.value} {dailyRecommendedAdult.female.unit}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Food Strategy */}
      {foodStrategy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Food Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {foodStrategy.animal && (
              <div className="border-l-4 border-red-400 pl-3 py-1">
                <div className="text-xs font-semibold text-red-700">🥩 Animal Sources</div>
                <div className="text-sm text-gray-700">{foodStrategy.animal}</div>
              </div>
            )}
            {foodStrategy.plant && (
              <div className="border-l-4 border-green-400 pl-3 py-1">
                <div className="text-xs font-semibold text-green-700">🌱 Plant Sources</div>
                <div className="text-sm text-gray-700">{foodStrategy.plant}</div>
              </div>
            )}
            {foodStrategy.fortified && (
              <div className="border-l-4 border-blue-400 pl-3 py-1">
                <div className="text-xs font-semibold text-blue-700">🥛 Fortified Foods</div>
                <div className="text-sm text-gray-700">{foodStrategy.fortified}</div>
              </div>
            )}
            {foodStrategy.fermented && (
              <div className="border-l-4 border-purple-400 pl-3 py-1">
                <div className="text-xs font-semibold text-purple-700">🧀 Fermented Foods</div>
                <div className="text-sm text-gray-700">{foodStrategy.fermented}</div>
              </div>
            )}
            {foodStrategy.other && (
              <div className="border-l-4 border-gray-400 pl-3 py-1">
                <div className="text-xs font-semibold text-gray-700">💊 Other</div>
                <div className="text-sm text-gray-700">{foodStrategy.other}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DRV by Age/Gender/Region */}
      {ageRanges && regionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">DRV by Age, Gender & Region</CardTitle>
            <div className="flex gap-2 mt-2">
              {/* Region Selector */}
              <div className="flex gap-1">
                {(['europe', 'north_america', 'average'] as const).map((region) => (
                  ageRanges[region] && (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3 py-1 text-xs rounded ${
                        selectedRegion === region
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {region === 'europe' ? '🇪🇺 Europe' : region === 'north_america' ? '🇺🇸 N.America' : '🌍 Average'}
                    </button>
                  )
                ))}
              </div>
              {/* Gender Selector */}
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={() => setSelectedGender('male')}
                  className={`px-3 py-1 text-xs rounded ${
                    selectedGender === 'male'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ♂ Male
                </button>
                <button
                  onClick={() => setSelectedGender('female')}
                  className={`px-3 py-1 text-xs rounded ${
                    selectedGender === 'female'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ♀ Female
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 px-2 font-semibold">Age Group</th>
                    <th className="text-center py-2 px-2 font-semibold bg-red-50">Deficiency</th>
                    <th className="text-center py-2 px-2 font-semibold bg-green-50">Optimal Min</th>
                    <th className="text-center py-2 px-2 font-semibold bg-green-100">Recommended</th>
                    <th className="text-center py-2 px-2 font-semibold bg-green-50">Optimal Max</th>
                    <th className="text-center py-2 px-2 font-semibold bg-orange-50">Daily Limit</th>
                    <th className="text-left py-2 px-2 font-semibold bg-blue-50">Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  {regionData.map((ageGroup, idx) => {
                    const genderData = ageGroup[selectedGender];
                    if (!genderData) return null;

                    const femaleData = selectedGender === 'female' ? ageGroup.female : null;

                    return (
                      <React.Fragment key={idx}>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-2 px-2 font-medium">{ageGroup.age_group}</td>
                          <td className="text-center py-2 px-2 bg-red-50">
                            {genderData.deficiency?.threshold ? (
                              <span className="text-red-700 font-semibold">
                                &lt; {genderData.deficiency.threshold}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="text-center py-2 px-2 bg-green-50">
                            {genderData.optimal?.minimum ? (
                              <span className="font-semibold">{genderData.optimal.minimum}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="text-center py-2 px-2 bg-green-100">
                            {genderData.optimal?.recommended ? (
                              <span className="font-bold text-green-700">{genderData.optimal.recommended}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="text-center py-2 px-2 bg-green-50">
                            {genderData.optimal?.maximum ? (
                              <span className="font-semibold">{genderData.optimal.maximum}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="text-center py-2 px-2 bg-orange-50">
                            {genderData.excess?.daily_limit?.value ? (
                              <span className="text-orange-700 font-semibold">
                                {genderData.excess.daily_limit.value}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-2 bg-blue-50">
                            {genderData.optimal?.benefits && genderData.optimal.benefits.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {genderData.optimal.benefits.slice(0, 3).map((benefit: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-[10px] py-0 px-1">
                                    {benefit}
                                  </Badge>
                                ))}
                                {genderData.optimal.benefits.length > 3 && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1">
                                    +{genderData.optimal.benefits.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                        {/* Pregnancy row for female */}
                        {femaleData?.pregnancy && (
                          <tr className="border-b border-gray-200 bg-pink-50/30">
                            <td className="py-2 px-2 pl-6 font-medium text-pink-700">
                              🤰 {ageGroup.age_group} (Pregnancy)
                            </td>
                            <td className="text-center py-2 px-2">—</td>
                            <td className="text-center py-2 px-2">
                              {femaleData.pregnancy.optimal?.minimum || '—'}
                            </td>
                            <td className="text-center py-2 px-2 bg-pink-100">
                              <span className="font-bold text-pink-700">
                                {femaleData.pregnancy.optimal?.recommended || '—'}
                              </span>
                            </td>
                            <td className="text-center py-2 px-2">
                              {femaleData.pregnancy.optimal?.maximum || '—'}
                            </td>
                            <td className="text-center py-2 px-2 bg-orange-50">
                              {femaleData.pregnancy.excess?.daily_limit?.value || '—'}
                            </td>
                            <td className="py-2 px-2">
                              {femaleData.pregnancy.optimal?.benefits && femaleData.pregnancy.optimal.benefits.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {femaleData.pregnancy.optimal.benefits.slice(0, 3).map((benefit: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[10px] py-0 px-1">
                                      {benefit}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        )}
                        {/* Breastfeeding row for female */}
                        {femaleData?.breastfeeding && (
                          <tr className="border-b border-gray-200 bg-purple-50/30">
                            <td className="py-2 px-2 pl-6 font-medium text-purple-700">
                              🤱 {ageGroup.age_group} (Breastfeeding)
                            </td>
                            <td className="text-center py-2 px-2">—</td>
                            <td className="text-center py-2 px-2">
                              {femaleData.breastfeeding.optimal?.minimum || '—'}
                            </td>
                            <td className="text-center py-2 px-2 bg-purple-100">
                              <span className="font-bold text-purple-700">
                                {femaleData.breastfeeding.optimal?.recommended || '—'}
                              </span>
                            </td>
                            <td className="text-center py-2 px-2">
                              {femaleData.breastfeeding.optimal?.maximum || '—'}
                            </td>
                            <td className="text-center py-2 px-2 bg-orange-50">
                              {femaleData.breastfeeding.excess?.daily_limit?.value || '—'}
                            </td>
                            <td className="py-2 px-2">
                              {femaleData.breastfeeding.optimal?.benefits && femaleData.breastfeeding.optimal.benefits.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {femaleData.breastfeeding.optimal.benefits.slice(0, 3).map((benefit: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-[10px] py-0 px-1">
                                      {benefit}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
