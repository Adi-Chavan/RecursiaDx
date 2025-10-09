import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Edit3, 
  Save,
  Clock,
  User,
  FileCheck,
  MoreVertical,
  Flag,
  Undo2
} from 'lucide-react'

export function ResultsReview({ onNext }) {
  const [verificationStatus, setVerificationStatus] = useState({})
  const [corrections, setCorrections] = useState({})
  const [comments, setComments] = useState({})
  const [overallApproval, setOverallApproval] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock AI results for verification
  const aiResults = [
    {
      id: 'blood_001',
      category: 'Blood Analysis',
      test: 'Hemoglobin Level',
      aiValue: '13.8 g/dL',
      aiStatus: 'Normal',
      confidence: 96.8,
      needsReview: false
    },
    {
      id: 'blood_002',
      category: 'Blood Analysis', 
      test: 'White Blood Cell Count',
      aiValue: '8.9 thousand/µL',
      aiStatus: 'Normal',
      confidence: 94.2,
      needsReview: false
    },
    {
      id: 'blood_003',
      category: 'Blood Analysis',
      test: 'Platelet Count',
      aiValue: '180 thousand/µL',
      aiStatus: 'Normal',
      confidence: 87.5,
      needsReview: true,
      flagReason: 'Borderline low confidence'
    },
    {
      id: 'tissue_001',
      category: 'Tissue Analysis',
      test: 'Cancer Detection',
      aiValue: 'No malignant cells detected',
      aiStatus: 'Normal',
      confidence: 97.3,
      needsReview: false
    },
    {
      id: 'tissue_002',
      category: 'Tissue Analysis',
      test: 'Tissue Architecture',
      aiValue: 'Normal cellular organization',
      aiStatus: 'Normal',
      confidence: 92.1,
      needsReview: true,
      flagReason: 'Manual verification requested'
    }
  ]

  const verificationHistory = [
    {
      id: 1,
      technician: 'Dr. Sarah Chen',
      timestamp: '2024-10-09 14:30',
      action: 'Approved',
      test: 'Hemoglobin Level',
      comment: 'Verified manually under microscope'
    },
    {
      id: 2,
      technician: 'Tech. Mike Johnson', 
      timestamp: '2024-10-09 14:25',
      action: 'Corrected',
      test: 'WBC Count',
      comment: 'Adjusted for sample dilution factor'
    }
  ]

  const handleVerification = (resultId, status) => {
    setVerificationStatus(prev => ({
      ...prev,
      [resultId]: status
    }))
    
    const result = aiResults.find(r => r.id === resultId)
    toast.success(`${result.test} ${status === 'approved' ? 'approved' : 'flagged for correction'}`)
  }

  const handleCorrection = (resultId, newValue) => {
    setCorrections(prev => ({
      ...prev,
      [resultId]: newValue
    }))
  }

  const handleComment = (resultId, comment) => {
    setComments(prev => ({
      ...prev,
      [resultId]: comment
    }))
  }

  const handleFinalSubmission = () => {
    if (overallApproval === null) {
      toast.error("Please provide overall approval decision")
      return
    }

    setIsSubmitting(true)
    
    // Simulate submission process
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success("Results verified and submitted successfully!")
      setTimeout(() => onNext(), 1500)
    }, 2000)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50'
      case 'rejected': return 'text-red-600 bg-red-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 95) return 'text-green-600'
    if (confidence >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Technician Results Review</h1>
          <p className="text-muted-foreground">
            Step 4: Verify and validate AI analysis results
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <FileCheck className="h-4 w-4 mr-2" />
          Quality Control
        </Badge>
      </div>

      {/* Current Reviewer Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>TP</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">Tech. Pathologist</h3>
                <p className="text-sm text-muted-foreground">
                  Licensed Medical Technologist • ID: MT-2024-156
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Review Session</div>
              <div className="text-sm text-muted-foreground">
                Started: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="verification" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verification">Result Verification</TabsTrigger>
          <TabsTrigger value="corrections">Corrections & Comments</TabsTrigger>
          <TabsTrigger value="history">Review History</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Results Verification</CardTitle>
              <CardDescription>
                Review and verify each AI-generated result. Items flagged for review require mandatory verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiResults.map((result) => (
                  <Card key={result.id} className={`${result.needsReview ? 'border-amber-200 bg-amber-50/50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {result.category}
                            </Badge>
                            {result.needsReview && (
                              <Badge variant="secondary" className="text-xs">
                                <Flag className="h-3 w-3 mr-1" />
                                Review Required
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-semibold">{result.test}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div>
                              <p className="text-sm text-muted-foreground">AI Result</p>
                              <p className="font-medium">{result.aiValue}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <Badge variant="outline">{result.aiStatus}</Badge>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Confidence</p>
                              <span className={`font-medium ${getConfidenceColor(result.confidence)}`}>
                                {result.confidence}%
                              </span>
                            </div>
                          </div>
                          
                          {result.flagReason && (
                            <Alert className="mt-3">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                <strong>Flag Reason:</strong> {result.flagReason}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`approve-${result.id}`}
                              checked={verificationStatus[result.id] === 'approved'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleVerification(result.id, 'approved')
                                } else {
                                  setVerificationStatus(prev => ({
                                    ...prev,
                                    [result.id]: undefined
                                  }))
                                }
                              }}
                            />
                            <label htmlFor={`approve-${result.id}`} className="text-sm">
                              Approve
                            </label>
                          </div>

                          <Button
                            variant={verificationStatus[result.id] === 'approved' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleVerification(result.id, 'approved')}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>

                          <Button
                            variant={verificationStatus[result.id] === 'rejected' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleVerification(result.id, 'rejected')}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => {/* Add correction logic */}}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Add Correction
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {/* Add comment logic */}}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Comment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {/* Reset logic */}}>
                                <Undo2 className="h-4 w-4 mr-2" />
                                Reset Review
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overall Approval */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className={overallApproval === 'approve' ? 'border-green-500 bg-green-50' : ''}>
                    <CardContent className="p-4 text-center cursor-pointer" onClick={() => setOverallApproval('approve')}>
                      <CheckCircle2 className={`h-8 w-8 mx-auto mb-2 ${overallApproval === 'approve' ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <p className="font-semibold">Approve All Results</p>
                      <p className="text-sm text-muted-foreground">All AI results are accurate</p>
                    </CardContent>
                  </Card>

                  <Card className={overallApproval === 'partial' ? 'border-yellow-500 bg-yellow-50' : ''}>
                    <CardContent className="p-4 text-center cursor-pointer" onClick={() => setOverallApproval('partial')}>
                      <AlertTriangle className={`h-8 w-8 mx-auto mb-2 ${overallApproval === 'partial' ? 'text-yellow-600' : 'text-muted-foreground'}`} />
                      <p className="font-semibold">Partial Approval</p>
                      <p className="text-sm text-muted-foreground">Some results need corrections</p>
                    </CardContent>
                  </Card>

                  <Card className={overallApproval === 'reject' ? 'border-red-500 bg-red-50' : ''}>
                    <CardContent className="p-4 text-center cursor-pointer" onClick={() => setOverallApproval('reject')}>
                      <XCircle className={`h-8 w-8 mx-auto mb-2 ${overallApproval === 'reject' ? 'text-red-600' : 'text-muted-foreground'}`} />
                      <p className="font-semibold">Reject & Reanalyze</p>
                      <p className="text-sm text-muted-foreground">Requires complete reanalysis</p>
                    </CardContent>
                  </Card>
                </div>

                {overallApproval && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Assessment Selected</AlertTitle>
                    <AlertDescription>
                      You have selected: <strong>{overallApproval.charAt(0).toUpperCase() + overallApproval.slice(1)}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corrections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Corrections & Comments</CardTitle>
              <CardDescription>
                Add corrections and comments for flagged or questionable results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiResults.filter(r => verificationStatus[r.id] === 'rejected' || r.needsReview).map((result) => (
                  <Card key={result.id}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">{result.test}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Corrected Value</label>
                          <input
                            type="text"
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            placeholder={result.aiValue}
                            value={corrections[result.id] || ''}
                            onChange={(e) => handleCorrection(result.id, e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Comments</label>
                          <textarea
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            rows={2}
                            placeholder="Add your comments..."
                            value={comments[result.id] || ''}
                            onChange={(e) => handleComment(result.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {aiResults.filter(r => verificationStatus[r.id] === 'rejected' || r.needsReview).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No corrections needed. All results have been approved.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review History</CardTitle>
              <CardDescription>
                Previous verifications and actions for this sample batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verificationHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {entry.technician.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{entry.technician}</span>
                        </div>
                      </TableCell>
                      <TableCell>{entry.test}</TableCell>
                      <TableCell>
                        <Badge variant={entry.action === 'Approved' ? 'default' : 'secondary'}>
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.timestamp}
                      </TableCell>
                      <TableCell className="text-sm">{entry.comment}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Final Actions */}
      <div className="flex justify-between">
        <Button variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={overallApproval === null || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Final Results'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Final Submission</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to submit these verified results? This action cannot be undone and will proceed to report generation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinalSubmission}>
                Confirm Submission
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}