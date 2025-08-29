// Define the AdminStats interface for the dashboard
export interface AdminStats {
  nutrients?: { total: number; withImages: number }
  ingredients?: { total: number; withImages: number }
  products?: { total: number; withImages: number }
  pollutants?: { total: number; withImages: number }
  scans?: { total: number; withImages: number }
  meals?: { total: number; withImages: number }
  parasites?: { total: number; withImages: number }
  users?: { total: number; confirmed: number }
}

export function transformServerStats(detailedStats: any): AdminStats {
  const transformed: AdminStats = {}
  
  Object.keys(detailedStats).forEach(key => {
    const stat = detailedStats[key]
    if (key === 'users') {
      transformed[key as keyof AdminStats] = {
        total: stat.current || 0,
        confirmed: stat.confirmed || 0
      }
    } else {
      transformed[key as keyof AdminStats] = {
        total: stat.current || 0,
        withImages: stat.withImages || 0
      }
    }
  })
  
  return transformed
}

export function getFallbackStats(): AdminStats {
  return {
    nutrients: { total: 0, withImages: 0 },
    ingredients: { total: 0, withImages: 0 },
    products: { total: 0, withImages: 0 },
    pollutants: { total: 0, withImages: 0 },
    scans: { total: 0, withImages: 0 },
    meals: { total: 0, withImages: 0 },
    parasites: { total: 0, withImages: 0 },
    users: { total: 0, confirmed: 0 }
  }
}

export function getCompletionPercentage(current: number, target: number = 100): number {
  return Math.min(Math.round((current / target) * 100), 100)
}

export function getStatusColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600'
  if (percentage >= 70) return 'text-yellow-600'
  return 'text-red-600'
}