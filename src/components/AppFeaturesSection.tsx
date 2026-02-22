import React from 'react';
import { 
  Shield, 
  Heart, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Sparkles,
  TrendingUp,
  Search,
  Users,
  ChefHat,
  Brain
} from 'lucide-react';

const riskScreenshot = '';
const needScreenshot = '';
const productScanScreenshot = '';
const mealAnalysisScreenshot = '';

export function AppFeaturesSection() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-green-50"></div>
        
        {/* Floating blobs */}
        <div className="absolute w-80 h-80 rounded-full opacity-8 animate-blob-float-1"
             style={{
               background: `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.15) 50%, transparent 70%)`,
               top: "15%",
               right: "10%",
               filter: "blur(35px)",
             }}></div>
        
        <div className="absolute w-64 h-64 rounded-full opacity-6 animate-blob-float-2"
             style={{
               background: `radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.12) 50%, transparent 70%)`,
               top: "50%",
               left: "5%",
               filter: "blur(30px)",
             }}></div>
        
        <div className="absolute w-72 h-72 rounded-full opacity-7 animate-blob-float-3"
             style={{
               background: `radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(249, 115, 22, 0.1) 50%, transparent 70%)`,
               bottom: "20%",
               right: "20%",
               filter: "blur(40px)",
             }}></div>
        
        <div className="absolute w-48 h-48 rounded-full opacity-9 animate-blob-float-4"
             style={{
               background: `radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)`,
               top: "75%",
               left: "15%",
               filter: "blur(25px)",
             }}></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by AI
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Your Personal Health
            <span className="text-[var(--healthscan-green)]"> Scanner</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover what's really in your food with instant AI-powered analysis. 
            From ingredient tracking and nutritional insights to smart recipe suggestions 
            for your entire family, get the complete picture in seconds.
          </p>
        </div>

        {/* Feature 1: Meal Analysis (First) */}
        <div className="mb-32 py-20 px-8 rounded-3xl bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-50 relative overflow-hidden">
          {/* Blue theme background elements */}
          <div className="absolute inset-0">
            <div className="absolute w-96 h-96 rounded-full opacity-20 animate-blob-float-1"
                 style={{
                   background: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.15) 50%, transparent 70%)`,
                   top: "10%",
                   right: "5%",
                   filter: "blur(40px)",
                 }}></div>
            <div className="absolute w-64 h-64 rounded-full opacity-15 animate-blob-float-3"
                 style={{
                   background: `radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)`,
                   bottom: "15%",
                   left: "10%",
                   filter: "blur(30px)",
                 }}></div>
          </div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                <img 
                  src={productScanScreenshot} 
                  alt="HealthScan Product Scanning Interface"
                  loading="lazy"
                  className="relative w-80 sm:w-96 h-auto rounded-[40px] shadow-2xl border border-gray-200 transition-transform duration-300 ease-out hover:rotate-y-6 hover:rotate-x-3 hover:scale-105"
                  style={{ transformStyle: 'preserve-3d' }}
                />
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <Camera className="w-4 h-4" />
                Smart Scanning
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Instant Meal
                <span className="text-blue-600"> Analysis</span>
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Simply point your camera at any meal or product and get comprehensive nutritional 
                breakdown, ingredient analysis, and health insights. Know exactly what 
                you're eating and how it impacts your wellness goals.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Camera className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Visual Food Recognition</h4>
                    <p className="text-gray-600 text-sm">Advanced AI identifies ingredients and portions from photos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Search className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ingredient Detection</h4>
                    <p className="text-gray-600 text-sm">Identifies specific ingredients and their nutritional content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Health Score Rating</h4>
                    <p className="text-gray-600 text-sm">Instant wellness score with personalized improvement tips</p>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Feature 2: Nutrition Insights (Second) */}
        <div className="mb-32 py-20 px-8 rounded-3xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
          {/* Green theme background elements */}
          <div className="absolute inset-0">
            <div className="absolute w-96 h-96 rounded-full opacity-20 animate-blob-float-2"
                 style={{
                   background: `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.15) 50%, transparent 70%)`,
                   top: "15%",
                   left: "5%",
                   filter: "blur(40px)",
                 }}></div>
            <div className="absolute w-64 h-64 rounded-full opacity-15 animate-blob-float-4"
                 style={{
                   background: `radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)`,
                   bottom: "10%",
                   right: "10%",
                   filter: "blur(30px)",
                 }}></div>
          </div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                Nutrition Intelligence
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Personalized
                <span className="text-[var(--healthscan-green)]"> Nutrition Tracking</span>
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Discover exactly what nutrients your body needs most. Our AI analyzes your 
                meals and products to identify which ingredients provide specific nutrients, 
                how much you're getting, and tracks your intake over time for personalized recommendations.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Search className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ingredient-Level Tracking</h4>
                    <p className="text-gray-600 text-sm">See which specific ingredients provide nutrients and in what amounts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Consumption Over Time</h4>
                    <p className="text-gray-600 text-sm">Track your nutrient intake patterns and identify deficiencies</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Smart Food Pairing</h4>
                    <p className="text-gray-600 text-sm">AI-powered suggestions to maximize nutrient absorption from meals and products</p>
                  </div>
                </div>
              </div>


            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                <img 
                  src={needScreenshot} 
                  alt="HealthScan Nutrition Analysis Screen"
                  loading="lazy"
                  className="relative w-80 sm:w-96 h-auto rounded-[40px] shadow-2xl border border-gray-200 transition-transform duration-300 ease-out hover:-rotate-y-6 hover:rotate-x-2 hover:scale-105"
                  style={{ transformStyle: 'preserve-3d' }}
                />
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <Heart className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Risk Detection (Third) */}
        <div className="mb-32 py-20 px-8 rounded-3xl bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 relative overflow-hidden">
          {/* Red theme background elements */}
          <div className="absolute inset-0">
            <div className="absolute w-96 h-96 rounded-full opacity-20 animate-blob-float-1"
                 style={{
                   background: `radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.12) 50%, transparent 70%)`,
                   top: "10%",
                   right: "5%",
                   filter: "blur(40px)",
                 }}></div>
            <div className="absolute w-64 h-64 rounded-full opacity-15 animate-blob-float-3"
                 style={{
                   background: `radial-gradient(circle, rgba(251, 113, 133, 0.2) 0%, transparent 70%)`,
                   bottom: "15%",
                   left: "10%",
                   filter: "blur(30px)",
                 }}></div>
          </div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-red-200 to-pink-200 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                <img 
                  src={riskScreenshot} 
                  alt="HealthScan Risk Detection Screen"
                  loading="lazy"
                  className="relative w-80 sm:w-96 h-auto rounded-[40px] shadow-2xl border border-gray-200 transition-transform duration-300 ease-out hover:rotate-y-4 hover:-rotate-x-2 hover:scale-105"
                  style={{ transformStyle: 'preserve-3d' }}
                />
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-6">
                <AlertTriangle className="w-4 h-4" />
                Risk Detection
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Instant Toxin
                <span className="text-red-600"> Tracking</span>
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our AI instantly identifies harmful chemicals like phthalates, heavy metals, 
                and endocrine disruptors from your meal and product scans. See which specific 
                ingredients contain toxins, track your exposure levels over time, and get 
                personalized safety recommendations.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Search className="w-3 h-3 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ingredient-Level Detection</h4>
                    <p className="text-gray-600 text-sm">Identify which specific ingredients contain harmful substances</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Exposure Tracking Over Time</h4>
                    <p className="text-gray-600 text-sm">Monitor your toxin consumption patterns and cumulative exposure</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Personalized Safety Limits</h4>
                    <p className="text-gray-600 text-sm">Tailored recommendations based on your health profile and consumption history</p>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Feature 4: Smart Recipe Suggestions & Family Tracking (Fourth) */}
        <div className="mb-16 py-20 px-8 rounded-3xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
          {/* Orange theme background elements */}
          <div className="absolute inset-0">
            <div className="absolute w-96 h-96 rounded-full opacity-20 animate-blob-float-2"
                 style={{
                   background: `radial-gradient(circle, rgba(251, 146, 60, 0.3) 0%, rgba(249, 115, 22, 0.15) 50%, transparent 70%)`,
                   top: "15%",
                   left: "5%",
                   filter: "blur(40px)",
                 }}></div>
            <div className="absolute w-64 h-64 rounded-full opacity-15 animate-blob-float-4"
                 style={{
                   background: `radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)`,
                   bottom: "10%",
                   right: "10%",
                   filter: "blur(30px)",
                 }}></div>
          </div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
                <ChefHat className="w-4 h-4" />
                Smart Recipe Engine
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                AI-Powered
                <span className="text-orange-600"> Recipe Suggestions</span>
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Create personalized meal plans for your entire family. Our AI analyzes each 
                family member's nutritional needs, dietary preferences, and health goals to 
                suggest optimal recipes that satisfy everyone's requirements while maximizing 
                nutrition and minimizing exposure to harmful ingredients.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-3 h-3 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Family Member Profiles</h4>
                    <p className="text-gray-600 text-sm">Track individual nutritional needs, allergies, and preferences for each family member</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-3 h-3 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Smart Recipe Matching</h4>
                    <p className="text-gray-600 text-sm">AI suggests recipes that meet everyone's nutritional needs and taste preferences</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChefHat className="w-3 h-3 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Personalized Meal Plans</h4>
                    <p className="text-gray-600 text-sm">Weekly meal planning optimized for your family's health goals and dietary requirements</p>
                  </div>
                </div>
              </div>


            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-200 to-yellow-200 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                {/* Meal analysis interface showing recipe breakdown and nutritional insights */}
                <img 
                  src={mealAnalysisScreenshot} 
                  alt="HealthScan Bulgar Salad Recipe Analysis with Nutritional Breakdown"
                  loading="lazy"
                  className="relative w-80 sm:w-96 h-auto rounded-[40px] shadow-2xl border border-gray-200 transition-transform duration-300 ease-out hover:-rotate-y-6 hover:rotate-x-2 hover:scale-105"
                  style={{ transformStyle: 'preserve-3d' }}
                />
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-bounce">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 py-16 px-8 rounded-3xl relative overflow-hidden">
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0">
            {/* Base gradient */}
            
            

            
            {/* Animated floating blobs */}
            <div className="absolute w-64 h-64 rounded-full opacity-20 animate-blob-float-1"
                 style={{
                   background: `radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(34, 197, 94, 0.2) 50%, transparent 70%)`,
                   top: "10%",
                   right: "10%",
                   filter: "blur(30px)",
                 }}></div>
            
            <div className="absolute w-48 h-48 rounded-full opacity-25 animate-blob-float-3"
                 style={{
                   background: `radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, transparent 70%)`,
                   bottom: "20%",
                   left: "15%",
                   filter: "blur(25px)",
                 }}></div>
          </div>
          
          
        </div>

      </div>
    </section>
  );
}