import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { toast } from 'sonner'
import { 
  FileText, 
  Download,  
  Share, 
  Mail, 
  Calendar, 
  User, 
  Building2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Send,
  Clock,
  Shield,
  Award,
  Microscope,
  Stethoscope
} from 'lucide-react'

export function ReportGeneration() {
  const [reportStatus, setReportStatus] = useState('generating')
  const [selectedTemplate, setSelectedTemplate] = useState('comprehensive')

  // Mock report data
  const patientInfo = {
    id: 'PT-2024-001',
    name: 'John Anderson',
    age: 45,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+1 (555) 123-4567',
    email: 'john.anderson@email.com',
    physician: 'Dr. Sarah Williams',
    orderDate: '2024-10-09',
    sampleDate: '2024-10-09',
    reportDate: new Date().toISOString().split('T')[0]
  }

  const labInfo = {
    name: 'RecursiaDx Digital Pathology Lab',
    address: '123 Medical Center Drive, Healthcare City, HC 12345',
    phone: '+1 (555) 999-0000',
    email: 'reports@recursiaDx.com',
    license: 'DPL-2024-RDX-001',
    accreditation: 'CAP/CLIA Certified'
  }

  const testResults = [
    {
      category: 'Hematology',
      tests: [
        { name: 'Hemoglobin', result: '13.8', unit: 'g/dL', range: '12.0-15.5', status: 'Normal' },
        { name: 'Hematocrit', result: '41.2', unit: '%', range: '36.0-46.0', status: 'Normal' },
        { name: 'RBC Count', result: '4.2', unit: 'million/µL', range: '3.8-5.2', status: 'Normal' },
        { name: 'WBC Count', result: '8.9', unit: 'thousand/µL', range: '4.0-11.0', status: 'Normal' },
        { name: 'Platelet Count', result: '180', unit: 'thousand/µL', range: '150-450', status: 'Normal' }
      ]
    },
    {
      category: 'Chemistry',
      tests: [
        { name: 'Glucose', result: '95', unit: 'mg/dL', range: '70-100', status: 'Normal' },
        { name: 'Blood Urea Nitrogen', result: '15', unit: 'mg/dL', range: '7-20', status: 'Normal' }
      ]
    },
    {
      category: 'Pathology',
      tests: [
        { name: 'Tissue Biopsy', result: 'No malignant cells detected', unit: '', range: 'Normal cellular architecture', status: 'Normal' },
        { name: 'Morphological Assessment', result: 'Normal tissue organization', unit: '', range: 'Regular cellular pattern', status: 'Normal' }
      ]
    }
  ]

  const aiAnalysis = {
    bloodSmear: {
      cellCounts: '4.2M RBC, 8.9K WBC, 180K PLT per µL',
      morphology: 'Normal cellular morphology observed',
      abnormalities: 'None detected',
      confidence: '96.8%'
    },
    tissueBiopsy: {
      architecture: 'Normal tissue architecture maintained',
      cellularAtypia: 'No cellular atypia identified', 
      malignancy: 'No evidence of malignancy',
      confidence: '97.3%'
    }
  }

  const technician = {
    name: 'Tech. Maria Rodriguez, MT(ASCP)',
    license: 'MT-2024-156',
    signature: 'Electronically signed on ' + new Date().toLocaleString()
  }

  const pathologist = {
    name: 'Dr. Michael Chen, MD',
    title: 'Board Certified Pathologist',
    license: 'MD-PATH-2024-789',
    signature: 'Reviewed and approved on ' + new Date().toLocaleString()
  }

  const generateReport = () => {
    setReportStatus('generating')
    setTimeout(() => {
      setReportStatus('ready')
      toast.success("Pathology report generated successfully!")
    }, 2000)
  }

  const downloadReport = (format) => {
    toast.success(`Downloading report as ${format.toUpperCase()}...`)
  }

  const shareReport = () => {
    toast.success("Report sharing options opened")
  }

  const sendReport = () => {
    toast.success("Report sent to physician successfully!")
  }

  React.useEffect(() => {
    generateReport()
  }, [])

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Generation</h1>
          <p className="text-muted-foreground">
            Step 5: Professional pathology report generation and delivery
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <FileText className="h-4 w-4 mr-2" />
          {reportStatus === 'generating' ? 'Generating...' : 'Report Ready'}
        </Badge>
      </div>

      {/* Report Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Report Status: Complete</span>
              </div>
              <Badge variant="secondary">Generated: {new Date().toLocaleString()}</Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => downloadReport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => downloadReport('docx')}>
                <Download className="h-4 w-4 mr-2" />
                DOCX
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                {/* <Print className="h-4 w-4 mr-2" /> */}
                Print
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Share Report</SheetTitle>
                    <SheetDescription>
                      Choose how to share this pathology report
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <Button className="w-full" onClick={sendReport}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email to Physician
                    </Button>
                    <Button variant="outline" className="w-full" onClick={shareReport}>
                      <Send className="h-4 w-4 mr-2" />
                      Secure Portal
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Patient Portal
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card className="print:shadow-none">
        <CardContent className="p-0">
          <div className="bg-white text-black p-8">
            {/* Report Header */}
            <div className="border-b pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-blue-900">{labInfo.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">{labInfo.address}</p>
                  <p className="text-sm text-gray-600">Phone: {labInfo.phone} | Email: {labInfo.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {labInfo.accreditation}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      License: {labInfo.license}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-blue-900 text-white px-4 py-2 rounded">
                    <h2 className="font-bold">PATHOLOGY REPORT</h2>
                  </div>
                  <p className="text-sm mt-2 text-gray-600">Report ID: RPT-{patientInfo.id}</p>
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Patient ID:</span>
                      <span>{patientInfo.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Name:</span>
                      <span>{patientInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Age:</span>
                      <span>{patientInfo.age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Gender:</span>
                      <span>{patientInfo.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Blood Group:</span>
                      <span>{patientInfo.bloodGroup}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Test Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Order Date:</span>
                      <span>{patientInfo.orderDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Sample Date:</span>
                      <span>{patientInfo.sampleDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Report Date:</span>
                      <span>{patientInfo.reportDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Physician:</span>
                      <span>{patientInfo.physician}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Test Results */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Microscope className="h-5 w-5" />
                Laboratory Results
              </h3>
              
              <Accordion type="single" collapsible className="w-full">
                {testResults.map((category, index) => (
                  <AccordionItem key={index} value={`category-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{category.category}</Badge>
                        <span className="font-semibold">{category.tests.length} Tests</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Test Name</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>Reference Range</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.tests.map((test, testIndex) => (
                            <TableRow key={testIndex}>
                              <TableCell className="font-medium">{test.name}</TableCell>
                              <TableCell>
                                {test.result} {test.unit}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{test.range}</TableCell>
                              <TableCell>
                                <Badge variant={test.status === 'Normal' ? 'default' : 'destructive'}>
                                  {test.status === 'Normal' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                  {test.status !== 'Normal' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {test.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* AI Analysis Summary */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                AI-Assisted Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Blood Smear Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Cell Counts:</span>
                      <p className="text-muted-foreground">{aiAnalysis.bloodSmear.cellCounts}</p>
                    </div>
                    <div>
                      <span className="font-medium">Morphology:</span>
                      <p className="text-muted-foreground">{aiAnalysis.bloodSmear.morphology}</p>
                    </div>
                    <div>
                      <span className="font-medium">AI Confidence:</span>
                      <Badge variant="outline">{aiAnalysis.bloodSmear.confidence}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Tissue Biopsy Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Architecture:</span>
                      <p className="text-muted-foreground">{aiAnalysis.tissueBiopsy.architecture}</p>
                    </div>
                    <div>
                      <span className="font-medium">Malignancy:</span>
                      <p className="text-muted-foreground">{aiAnalysis.tissueBiopsy.malignancy}</p>
                    </div>
                    <div>
                      <span className="font-medium">AI Confidence:</span>
                      <Badge variant="outline">{aiAnalysis.tissueBiopsy.confidence}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Clinical Summary */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Clinical Summary</h3>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Normal Results</AlertTitle>
                <AlertDescription>
                  All laboratory parameters are within normal reference ranges. 
                  No abnormal cells or tissue architecture identified. 
                  AI-assisted analysis confirms normal findings with high confidence levels.
                </AlertDescription>
              </Alert>
            </div>

            {/* Signatures */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-2">Technician Verification</h4>
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>MR</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{technician.name}</p>
                      <p className="text-muted-foreground">License: {technician.license}</p>
                      <p className="text-xs text-muted-foreground mt-1">{technician.signature}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-2">Pathologist Review</h4>
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>MC</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{pathologist.name}</p>
                      <p className="text-muted-foreground">{pathologist.title}</p>
                      <p className="text-muted-foreground">License: {pathologist.license}</p>
                      <p className="text-xs text-muted-foreground mt-1">{pathologist.signature}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4 mt-6 text-center text-xs text-muted-foreground">
              <p>This report was generated using RecursiaDx AI-powered digital pathology platform.</p>
              <p className="mt-1">For questions regarding this report, please contact {labInfo.phone}</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  HIPAA Compliant
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Real-time Processing
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Report Generation Complete</h3>
              <p className="text-sm text-muted-foreground">
                Professional pathology report ready for delivery
              </p>
            </div>
            <Button onClick={() => toast.success("Workflow completed successfully!")}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Workflow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}