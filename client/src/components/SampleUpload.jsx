import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Upload, User, FileImage, AlertCircle, CheckCircle2, Camera, Droplets } from 'lucide-react'

export function SampleUpload({ onNext }) {
  const [patientData, setPatientData] = useState({
    patientId: '',
    name: '',
    age: '',
    gender: '',
    symptoms: [],
    bloodGroup: '',
    testType: ''
  })
  
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const symptoms = [
    'Fatigue', 'Fever', 'Weight Loss', 'Night Sweats', 
    'Unusual Bleeding', 'Persistent Cough', 'Difficulty Swallowing'
  ]

  const handleSymptomChange = (symptom) => {
    setPatientData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom) 
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }))
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    
    files.forEach(file => {
      // Simulate file upload progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)
        
        if (progress >= 100) {
          clearInterval(interval)
          setUploadedFiles(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
          }])
          setUploadProgress(0)
          toast.success(`${file.name} uploaded successfully!`)
        }
      }, 200)
    })
  }

  const handleSubmit = () => {
    if (!patientData.patientId || !patientData.name || uploadedFiles.length === 0) {
      toast.error("Please fill in required fields and upload at least one file")
      return
    }
    
    toast.success("Sample uploaded successfully! Moving to WSI Viewer...")
    setTimeout(() => onNext(), 1500)
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sample Collection & Upload</h1>
          <p className="text-muted-foreground">
            Step 1: Patient information and sample upload
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <User className="h-4 w-4 mr-2" />
          Patient Registration
        </Badge>
      </div>

      <Tabs defaultValue="patient-info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
          <TabsTrigger value="sample-upload">Sample Upload</TabsTrigger>
          <TabsTrigger value="review">Review & Submit</TabsTrigger>
        </TabsList>

        <TabsContent value="patient-info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                Patient Information
              </CardTitle>
              <CardDescription>
                Enter basic patient details and symptoms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient ID *</Label>
                  <Input
                    id="patientId"
                    placeholder="e.g., PT-2024-001"
                    value={patientData.patientId}
                    onChange={(e) => setPatientData(prev => ({...prev, patientId: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Patient full name"
                    value={patientData.name}
                    onChange={(e) => setPatientData(prev => ({...prev, name: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={patientData.age}
                    onChange={(e) => setPatientData(prev => ({...prev, age: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select onValueChange={(value) => setPatientData(prev => ({...prev, gender: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select onValueChange={(value) => setPatientData(prev => ({...prev, bloodGroup: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Test Type</Label>
                  <Select onValueChange={(value) => setPatientData(prev => ({...prev, testType: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blood">Blood Test</SelectItem>
                      <SelectItem value="tissue">Tissue Biopsy</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Symptoms (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {symptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={patientData.symptoms.includes(symptom)}
                        onCheckedChange={() => handleSymptomChange(symptom)}
                      />
                      <Label htmlFor={symptom} className="text-sm">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sample-upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-red-500" />
                  Blood Sample Upload
                </CardTitle>
                <CardDescription>
                  Upload blood smear images for CBC, hemoglobin analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <Label htmlFor="blood-upload" className="cursor-pointer">
                    <span className="text-sm font-medium">Click to upload blood samples</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG up to 10MB each
                    </span>
                  </Label>
                  <Input
                    id="blood-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-500" />
                  Tissue Sample Upload
                </CardTitle>
                <CardDescription>
                  Upload tissue biopsy WSI files for cancer detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <Label htmlFor="tissue-upload" className="cursor-pointer">
                    <span className="text-sm font-medium">Click to upload tissue samples</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      SVS, TIFF, NDPI up to 500MB each
                    </span>
                  </Label>
                  <Input
                    id="tissue-upload"
                    type="file"
                    multiple
                    accept=".svs,.tiff,.ndpi,image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Uploaded Files ({uploadedFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Uploaded</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Please review all information before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patient ID</Label>
                  <p className="text-sm text-muted-foreground">{patientData.patientId || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground">{patientData.name || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Test Type</Label>
                  <p className="text-sm text-muted-foreground">{patientData.testType || 'Not selected'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Files Uploaded</Label>
                  <p className="text-sm text-muted-foreground">{uploadedFiles.length} files</p>
                </div>
              </div>

              {patientData.symptoms.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Symptoms</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patientData.symptoms.map(symptom => (
                      <Badge key={symptom} variant="outline" className="text-xs">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Please ensure all patient information is accurate and all required samples are uploaded before proceeding.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} className="w-full">
                Submit & Proceed to Analysis
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}