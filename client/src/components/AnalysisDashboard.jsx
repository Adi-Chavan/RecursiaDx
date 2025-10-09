import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Zap,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts'

export function AnalysisDashboard({ onNext }) {
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('preprocessing')
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [results, setResults] = useState(null)

  // Mock analysis data
  const bloodTestResults = [
    { test: 'Hemoglobin', value: 13.8, unit: 'g/dL', range: '12.0-15.5', status: 'normal' },
    { test: 'RBC Count', value: 4.2, unit: 'million/µL', range: '3.8-5.2', status: 'normal' },
    { test: 'WBC Count', value: 8.9, unit: 'thousand/µL', range: '4.0-11.0', status: 'normal' },
    { test: 'Platelet Count', value: 180, unit: 'thousand/µL', range: '150-450', status: 'normal' },
    { test: 'Blood Sugar', value: 95, unit: 'mg/dL', range: '70-100', status: 'normal' }
  ]

  const confidenceData = [
    { category: 'Cell Detection', confidence: 96.8, color: '#22c55e' },
    { category: 'Morphology Analysis', confidence: 94.2, color: '#3b82f6' },
    { category: 'Anomaly Detection', confidence: 87.5, color: '#f59e0b' },
    { category: 'Classification', confidence: 91.3, color: '#8b5cf6' }
  ]

  const analysisStages = [
    { id: 'preprocessing', label: 'Image Preprocessing', duration: 15 },
    { id: 'tiling', label: 'WSI Tiling', duration: 25 },
    { id: 'feature_extraction', label: 'Feature Extraction', duration: 30 },
    { id: 'classification', label: 'AI Classification', duration: 20 },
    { id: 'postprocessing', label: 'Result Processing', duration: 10 }
  ]

  const cellCountData = [
    { type: 'Red Blood Cells', count: 4200000, percentage: 85.2 },
    { type: 'White Blood Cells', count: 8900, percentage: 0.18 },
    { type: 'Platelets', count: 180000, percentage: 3.65 },
    { type: 'Other', count: 540000, percentage: 10.97 }
  ]

  const heatmapIntensity = [
    { region: 'Region 1', intensity: 0.85, risk: 'high', cells: 156 },
    { region: 'Region 2', intensity: 0.23, risk: 'low', cells: 34 },
    { region: 'Region 3', intensity: 0.67, risk: 'medium', cells: 89 },
    { region: 'Region 4', intensity: 0.12, risk: 'low', cells: 21 },
    { region: 'Region 5', intensity: 0.91, risk: 'high', cells: 203 }
  ]

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setIsAnalyzing(false)
            setResults({
              status: 'completed',
              accuracy: 96.8,
              processingTime: '2m 15s',
              anomaliesDetected: 3
            })
            toast.success("AI Analysis completed successfully!")
            return 100
          }
          
          // Update current stage based on progress
          const currentProgress = prev + 2
          if (currentProgress < 15) setCurrentStage('preprocessing')
          else if (currentProgress < 40) setCurrentStage('tiling')
          else if (currentProgress < 70) setCurrentStage('feature_extraction')
          else if (currentProgress < 90) setCurrentStage('classification')
          else setCurrentStage('postprocessing')
          
          return currentProgress
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isAnalyzing])

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Analysis Dashboard</h1>
          <p className="text-muted-foreground">
            Step 3: AI-powered pathology analysis and prediction
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Brain className="h-4 w-4 mr-2" />
          {isAnalyzing ? 'Processing...' : 'Analysis Complete'}
        </Badge>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 animate-pulse" />
              Analysis in Progress
            </CardTitle>
            <CardDescription>
              AI model is processing your samples using multi-scale attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{analysisProgress.toFixed(0)}%</span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {analysisStages.map((stage) => (
                  <div 
                    key={stage.id}
                    className={`p-3 rounded-lg text-center ${
                      currentStage === stage.id 
                        ? 'bg-primary text-primary-foreground' 
                        : analysisProgress > analysisStages.findIndex(s => s.id === stage.id) * 20
                        ? 'bg-green-100 text-green-800'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="text-xs font-medium">{stage.label}</div>
                    {currentStage === stage.id && (
                      <div className="text-xs mt-1 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{stage.duration}s
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blood-analysis">Blood Analysis</TabsTrigger>
          <TabsTrigger value="tissue-analysis">Tissue Analysis</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {results ? results.accuracy : isAnalyzing ? analysisProgress.toFixed(1) : '--'}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isAnalyzing ? 'Progress' : 'Accuracy'}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {results ? results.processingTime : isAnalyzing ? 'Processing...' : '--'}
                    </p>
                    <p className="text-sm text-muted-foreground">Processing Time</p>
                  </div>
                  <Zap className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {results ? results.anomaliesDetected : isAnalyzing ? '...' : '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Anomalies Detected</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-sm text-muted-foreground">Tests Analyzed</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {!isAnalyzing && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Model Confidence</CardTitle>
                  <CardDescription>
                    Confidence levels across different analysis categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      confidence: {
                        label: "Confidence",
                        color: "hsl(var(--chart-1))",
                      }
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={confidenceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="confidence" fill="var(--color-confidence)" radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cell Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of detected cell types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cellCountData.map((cell, index) => (
                      <div key={cell.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: confidenceData[index]?.color || '#gray' }}
                          />
                          <span className="text-sm font-medium">{cell.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {cell.count.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {cell.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="blood-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Blood Test Results</CardTitle>
              <CardDescription>
                Automated analysis of blood sample parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Reference Range</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bloodTestResults.map((test) => (
                      <TableRow key={test.test}>
                        <TableCell className="font-medium">{test.test}</TableCell>
                        <TableCell>
                          {test.value} {test.unit}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {test.range}
                        </TableCell>
                        <TableCell>
                          <Badge variant={test.status === 'normal' ? 'default' : 'destructive'}>
                            {test.status === 'normal' ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {test.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tissue-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tissue Biopsy Analysis</CardTitle>
              <CardDescription>
                AI-powered cancer detection and morphological analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Analysis Complete</AlertTitle>
                    <AlertDescription>
                      No malignant cells detected. Normal tissue architecture observed.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">Normal</div>
                        <div className="text-sm text-muted-foreground">Overall Assessment</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">97.3%</div>
                        <div className="text-sm text-muted-foreground">Confidence Score</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-sm text-muted-foreground">Suspicious Regions</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attention Heatmaps</CardTitle>
              <CardDescription>
                AI attention regions and intensity analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead>Intensity</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Cell Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {heatmapIntensity.map((region) => (
                        <TableRow key={region.region}>
                          <TableCell className="font-medium">{region.region}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{ width: `${region.intensity * 100}%` }}
                                />
                              </div>
                              <span className="text-sm">{(region.intensity * 100).toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(region.risk)}>
                              {region.risk.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{region.cells}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => {
            toast.success("Proceeding to results review...")
            setTimeout(() => onNext(), 1500)
          }}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analysis in Progress...' : 'Proceed to Review'}
        </Button>
      </div>
    </div>
  )
}