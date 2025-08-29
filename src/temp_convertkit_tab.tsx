{/* ConvertKit Integration Test Tab */}
        <TabsContent value="convertkit" className="space-y-4 lg:space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">ConvertKit Integration</h2>
                <p className="text-gray-600">Test and manage your ConvertKit email marketing integration</p>
              </div>
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('navigateToPage', { detail: 'convertkit-test' }))}
                className="btn-major bg-green-600 hover:bg-green-700 text-white"
              >
                <Mail className="h-4 w-4 mr-2" />
                Open Full Test Suite
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-600" />
                  Integration Overview
                </CardTitle>
                <CardDescription>
                  Your ConvertKit integration automatically syncs waitlist signups to your email marketing platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">How It Works:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Users join your waitlist via the signup form</li>
                      <li>• Email is saved to Supabase database</li>
                      <li>• Simultaneously subscribed to ConvertKit form</li>
                      <li>• Tagged based on user status and referrals</li>
                      <li>• Custom fields updated with position data</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Benefits:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Automatic email list building</li>
                      <li>• Targeted marketing campaigns</li>
                      <li>• User segmentation with tags</li>
                      <li>• Personalized communications</li>
                      <li>• Reliable backup to Supabase</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Configuration Status</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Form ID: <code className="bg-blue-100 px-1 rounded">293a519eba</code></p>
                    <p>• API Key: {'{'}Environment Variable{'}'}</p>
                    <p>• Endpoint: <code className="bg-blue-100 px-1 rounded">/email-waitlist</code></p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.dispatchEvent(new CustomEvent('navigateToPage', { detail: 'convertkit-test' }))}
                    className="btn-standard"
                  >
                    Test Integration
                  </Button>
                  <Button variant="outline" className="btn-standard" asChild>
                    <a href="https://app.convertkit.com" target="_blank" rel="noopener noreferrer">
                      Open ConvertKit
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>