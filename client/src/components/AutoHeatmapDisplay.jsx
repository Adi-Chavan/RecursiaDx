import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Thermometer, 
  Download, 
  BarChart3,
  Zap,
  TrendingUp
} from 'lucide-react'

export function AutoHeatmapDisplay({ sample, className = "" }) {
  // Get images with heatmaps
  const imagesWithHeatmaps = sample?.images?.filter(img => img.heatmap) || []
  
  // Download heatmap
  const downloadHeatmap = (heatmapPath, filename) => {
    const link = document.createElement('a')
    link.href = heatmapPath
    link.download = `heatmap_${filename}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!sample) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No sample data available
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (imagesWithHeatmaps.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-orange-500" />
              AI Heatmap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Thermometer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Heatmaps Available</h3>
              <p className="text-muted-foreground mb-4">
                Heatmaps are automatically generated when you upload images with ML analysis.
              </p>
              {sample.images && sample.images.length > 0 ? (
                <Badge variant="outline">
                  {sample.images.length} image(s) uploaded - Processing heatmaps...
                </Badge>
              ) : (
                <Badge variant="secondary">
                  No images uploaded yet
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-orange-500" />
            AI Heatmap Analysis
            <Badge variant="default" className="ml-auto">
              {imagesWithHeatmaps.length} Generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {imagesWithHeatmaps.length}
              </div>
              <div className="text-muted-foreground">Heatmaps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {imagesWithHeatmaps.filter(img => img.heatmap?.analytics?.hotspots > 0).length}
              </div>
              <div className="text-muted-foreground">With Hotspots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {imagesWithHeatmaps.length > 0 ? 
                  (imagesWithHeatmaps.reduce((sum, img) => 
                    sum + (img.heatmap?.analytics?.mean_value || 0), 0) / imagesWithHeatmaps.length
                  ).toFixed(3) : '0.000'
                }
              </div>
              <div className="text-muted-foreground">Avg Intensity</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {imagesWithHeatmaps.map((image, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {image.originalName || `Image ${index + 1}`}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {image.heatmap.type.replace('_', ' ')}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadHeatmap(image.heatmap.path, image.filename)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Heatmap Image */}
              <div className="relative">
                <img
                  src={image.heatmap.base64 || image.heatmap.path}
                  alt={`Heatmap for ${image.originalName}`}
                  className="w-full h-auto max-h-64 object-contain border rounded-lg bg-white"
                  onError={(e) => {
                    // Try fallback to path if base64 fails
                    if (image.heatmap.path && e.target.src !== image.heatmap.path) {
                      e.target.src = image.heatmap.path
                    } else {
                      e.target.src = '/api/placeholder-heatmap'
                      e.target.alt = 'Heatmap not available'
                    }
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="bg-black/70 text-white">
                    {image.heatmap.colormap}
                  </Badge>
                </div>
              </div>

              {/* Analytics */}
              {image.heatmap.analytics && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Value:</span>
                      <span className="font-medium">{image.heatmap.analytics.min_value?.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Value:</span>
                      <span className="font-medium">{image.heatmap.analytics.max_value?.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mean Value:</span>
                      <span className="font-medium">{image.heatmap.analytics.mean_value?.toFixed(3)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hotspots:</span>
                      <span className="font-medium flex items-center gap-1">
                        {image.heatmap.analytics.hotspots || 0}
                        {(image.heatmap.analytics.hotspots || 0) > 0 && 
                          <Zap className="h-3 w-3 text-orange-500" />
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pixels:</span>
                      <span className="font-medium">{image.heatmap.analytics.total_pixels?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolution:</span>
                      <span className="font-medium">
                        {image.heatmap.analytics.shape ? 
                          `${image.heatmap.analytics.shape[0]}×${image.heatmap.analytics.shape[1]}` : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ML Analysis Integration */}
              {image.mlAnalysis && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">ML Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prediction:</span>
                      <Badge variant={image.mlAnalysis.prediction === 'malignant' ? 'destructive' : 'secondary'}>
                        {image.mlAnalysis.prediction}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-medium">{(image.mlAnalysis.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Heatmap Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {imagesWithHeatmaps.reduce((sum, img) => sum + (img.heatmap?.analytics?.hotspots || 0), 0)}
              </div>
              <div className="text-sm text-orange-700">Total Hotspots</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {imagesWithHeatmaps.length > 0 ? 
                  (imagesWithHeatmaps.reduce((sum, img) => sum + (img.heatmap?.analytics?.max_value || 0), 0) / imagesWithHeatmaps.length).toFixed(3) :
                  '0.000'
                }
              </div>
              <div className="text-sm text-blue-700">Avg Max Intensity</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {imagesWithHeatmaps.filter(img => (img.heatmap?.analytics?.max_value || 0) > 0.7).length}
              </div>
              <div className="text-sm text-green-700">High Intensity</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {imagesWithHeatmaps.length}
              </div>
              <div className="text-sm text-purple-700">Total Analyzed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}