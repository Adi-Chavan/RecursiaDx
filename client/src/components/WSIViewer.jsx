import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageCard } from '@/components/ui/image-card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  RotateCw, 
  Maximize2, 
  Download, 
  Info,
  Eye,
  Grid3X3,
  Layers,
  Target
} from 'lucide-react'

export function WSIViewer({ onNext }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [annotations, setAnnotations] = useState([])
  const canvasRef = useRef(null)

  // Mock WSI data
  const wsiImages = [
    {
      id: 1,
      name: 'Blood_Smear_001.jpg',
      type: 'blood',
      resolution: '40x',
      size: '2048x1536',
      staining: 'Wright-Giemsa',
      thumbnail: '/api/placeholder/300/200',
      fullImage: '/api/placeholder/1200/800',
      analysis: 'pending'
    },
    {
      id: 2,
      name: 'Tissue_Biopsy_H&E_001.svs',
      type: 'tissue',
      resolution: '20x',
      size: '4096x3072',
      staining: 'H&E',
      thumbnail: '/api/placeholder/300/200',
      fullImage: '/api/placeholder/1200/800',
      analysis: 'completed'
    },
    {
      id: 3,
      name: 'Blood_Smear_002.jpg',
      type: 'blood',
      resolution: '100x',
      size: '1024x768',
      staining: 'May-Grünwald',
      thumbnail: '/api/placeholder/300/200',
      fullImage: '/api/placeholder/1200/800',
      analysis: 'processing'
    }
  ]

  const handleImageSelect = (image) => {
    setIsLoading(true)
    setSelectedImage(image)
    
    // Simulate image loading
    setTimeout(() => {
      setIsLoading(false)
      toast.success(`Loaded ${image.name}`)
    }, 1500)
  }

  const handleZoom = (direction) => {
    if (direction === 'in') {
      setZoomLevel(prev => Math.min(prev + 0.25, 5))
    } else {
      setZoomLevel(prev => Math.max(prev - 0.25, 0.25))
    }
  }

  const handleAnnotation = (x, y) => {
    const newAnnotation = {
      id: Date.now(),
      x: x,
      y: y,
      type: 'marker',
      note: `Annotation at ${x}, ${y}`
    }
    setAnnotations(prev => [...prev, newAnnotation])
    toast.info("Annotation added")
  }

  const proceedToAnalysis = () => {
    if (!selectedImage) {
      toast.error("Please select an image to analyze")
      return
    }
    
    toast.success("Proceeding to AI Analysis...")
    setTimeout(() => onNext(), 1500)
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WSI Viewer & Analysis</h1>
          <p className="text-muted-foreground">
            Step 2: Whole Slide Image viewing and preparation
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Eye className="h-4 w-4 mr-2" />
          Image Analysis
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Image Gallery */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Images</CardTitle>
              <CardDescription>
                Select an image to view and analyze
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wsiImages.map((image) => (
                  <div
                    key={image.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedImage?.id === image.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => handleImageSelect(image)}
                  >
                    <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                      <ImageCard
                        src={image.thumbnail}
                        alt={image.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate">{image.name}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {image.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {image.resolution}
                        </Badge>
                        <Badge 
                          variant={image.analysis === 'completed' ? 'default' : 
                                  image.analysis === 'processing' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {image.analysis}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {image.size} • {image.staining}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Viewer */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedImage ? selectedImage.name : 'Select an image to view'}
                  </CardTitle>
                  {selectedImage && (
                    <CardDescription>
                      Resolution: {selectedImage.resolution} • Staining: {selectedImage.staining}
                    </CardDescription>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowGrid(!showGrid)}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Toggle Grid</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Info className="h-4 w-4" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Image Information</DrawerTitle>
                        <DrawerDescription>
                          Detailed information about the selected image
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium">File Size</p>
                          <p className="text-sm text-muted-foreground">45.2 MB</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Color Space</p>
                          <p className="text-sm text-muted-foreground">RGB</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Compression</p>
                          <p className="text-sm text-muted-foreground">JPEG2000</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Levels</p>
                          <p className="text-sm text-muted-foreground">6 pyramid levels</p>
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {selectedImage ? (
                <div className="relative">
                  {/* Toolbar */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg p-2 border">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom In</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <span className="text-sm font-mono px-2">
                      {(zoomLevel * 100).toFixed(0)}%
                    </span>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom Out</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="h-4 w-px bg-border" />

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Move className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Pan Tool</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Target className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Annotation Tool</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Image Viewer Area */}
                  <div 
                    className="relative h-96 bg-muted/50 overflow-hidden"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      handleAnnotation(x, y)
                    }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="space-y-4 w-full max-w-md p-4">
                          <Skeleton className="h-8 w-3/4" />
                          <Skeleton className="h-64 w-full" />
                          <div className="flex gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="w-full h-full bg-white flex items-center justify-center"
                        style={{
                          transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                          transformOrigin: 'center'
                        }}
                      >
                        <ImageCard
                          src={selectedImage.fullImage}
                          alt={selectedImage.name}
                          className="max-w-full max-h-full object-contain"
                        />
                        
                        {/* Grid Overlay */}
                        {showGrid && (
                          <div className="absolute inset-0 pointer-events-none">
                            <svg className="w-full h-full">
                              <defs>
                                <pattern
                                  id="grid"
                                  width="50"
                                  height="50"
                                  patternUnits="userSpaceOnUse"
                                >
                                  <path
                                    d="M 50 0 L 0 0 0 50"
                                    fill="none"
                                    stroke="rgba(0,0,0,0.2)"
                                    strokeWidth="1"
                                  />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                          </div>
                        )}

                        {/* Annotations */}
                        {annotations.map((annotation) => (
                          <div
                            key={annotation.id}
                            className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"
                            style={{
                              left: annotation.x - 6,
                              top: annotation.y - 6,
                              transform: `scale(${1/zoomLevel})`
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image Navigation */}
                  <div className="p-4">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {wsiImages.map((image) => (
                          <CarouselItem key={image.id} className="basis-1/4">
                            <div 
                              className={`aspect-video border rounded cursor-pointer ${
                                selectedImage?.id === image.id ? 'border-primary' : 'border-muted'
                              }`}
                              onClick={() => handleImageSelect(image)}
                            >
                              <ImageCard
                                src={image.thumbnail}
                                alt={image.name}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an image from the gallery to begin viewing</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Annotations
        </Button>
        
        <Button onClick={proceedToAnalysis} disabled={!selectedImage}>
          Proceed to AI Analysis
        </Button>
      </div>
    </div>
  )
}