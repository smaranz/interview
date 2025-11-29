'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  Loader2, 
  CheckCircle, 
  XCircle,
  BookOpen,
  Clock,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import type { AtsMatchResult, StudyPlan } from '@/lib/types/resume'
import { ACCEPTED_RESUME_TYPES } from '@/lib/resumeParser'

interface AnalysisResult {
  analysisId?: string
  jobTitle: string | null
  jobDescriptionSnippet: string
  atsResult: AtsMatchResult
}

export default function ResumeBuilder() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobUrl, setJobUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [isGeneratingStudyPlan, setIsGeneratingStudyPlan] = useState(false)
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null)
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
    }
  }
  
  const handleAnalyze = async () => {
    if (!selectedFile || !jobUrl.trim()) {
      setError('Please upload a resume and enter a job URL')
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    setAnalysisResult(null)
    setStudyPlan(null)
    setStudyPlanError(null)
    
    try {
      const formData = new FormData()
      formData.append('resume', selectedFile)
      formData.append('jobUrl', jobUrl.trim())
      
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to analyze resume')
        return
      }
      
      setAnalysisResult({
        analysisId: data.analysisId,
        jobTitle: data.jobTitle,
        jobDescriptionSnippet: data.jobDescriptionSnippet,
        atsResult: data.atsResult,
      })
    } catch (err) {
      console.error('Analysis error:', err)
      setError('An error occurred while analyzing your resume')
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  const handleGenerateStudyPlan = async () => {
    if (!analysisResult) return
    
    setIsGeneratingStudyPlan(true)
    setStudyPlanError(null)
    
    try {
      const response = await fetch('/api/resume/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: analysisResult.analysisId,
          jobTitle: analysisResult.jobTitle,
          jobDescription: analysisResult.jobDescriptionSnippet,
          missingKeywords: analysisResult.atsResult.missingKeywords,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        setStudyPlanError(data.error || 'Failed to generate study plan')
        return
      }
      
      setStudyPlan(data.studyPlan)
    } catch (err) {
      console.error('Study plan error:', err)
      setStudyPlanError('An error occurred while generating the study plan')
    } finally {
      setIsGeneratingStudyPlan(false)
    }
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400'
    if (score >= 50) return 'text-yellow-400'
    if (score >= 25) return 'text-orange-400'
    return 'text-red-400'
  }
  
  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'Excellent Match'
    if (score >= 50) return 'Good Match'
    if (score >= 25) return 'Fair Match'
    return 'Needs Improvement'
  }
  
  return (
    <div className="space-y-8">
      {/* Upload Form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-6 text-xl font-semibold text-white">Upload & Analyze</h2>
        
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Resume File
            </label>
            <div 
              className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-8 transition-colors hover:border-white/40 hover:bg-white/10"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_RESUME_TYPES}
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-center">
                {selectedFile ? (
                  <>
                    <FileText className="mx-auto h-10 w-10 text-emerald-400" />
                    <p className="mt-2 text-sm font-medium text-white">{selectedFile.name}</p>
                    <p className="mt-1 text-xs text-white/60">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-10 w-10 text-white/40" />
                    <p className="mt-2 text-sm text-white/70">
                      Drop your resume here or click to browse
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      Supports PDF and DOCX files
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Job URL Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Job Posting URL
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                type="url"
                placeholder="https://example.com/jobs/software-engineer"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
              />
            </div>
            <p className="mt-1 text-xs text-white/50">
              Paste a public job posting URL. Note: Sites like LinkedIn/Indeed may block access. Use the company's career page if possible.
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-red-400 border border-red-500/20">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                 <p className="text-sm font-medium">Analysis Failed</p>
                 <p className="text-sm mt-1 opacity-90">{error}</p>
              </div>
            </div>
          )}
          
          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || !jobUrl.trim() || isAnalyzing}
            className="w-full bg-white text-black hover:bg-white/90"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze & Match Resume'
            )}
          </Button>
        </div>
      </div>
      
      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Job Info */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Job Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/60">Position</p>
                <p className="text-lg font-medium text-white">
                  {analysisResult.jobTitle || 'Unknown Title'}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Description Preview</p>
                <p className="text-sm text-white/80">
                  {analysisResult.jobDescriptionSnippet}
                </p>
              </div>
            </div>
          </div>
          
          {/* ATS Score */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-6 text-lg font-semibold text-white">ATS Match Score</h3>
            
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className={`text-7xl font-bold ${getScoreColor(analysisResult.atsResult.score)}`}>
                  {analysisResult.atsResult.score}
                </div>
                <p className="mt-1 text-lg text-white/60">out of 100</p>
                <p className={`mt-2 text-sm font-medium ${getScoreColor(analysisResult.atsResult.score)}`}>
                  {getScoreLabel(analysisResult.atsResult.score)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Keywords */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Matched Keywords */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Matched Keywords</h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                  {analysisResult.atsResult.matchedKeywords.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.atsResult.matchedKeywords.length > 0 ? (
                  analysisResult.atsResult.matchedKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-white/50">No matching keywords found</p>
                )}
              </div>
            </div>
            
            {/* Missing Keywords */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Missing Keywords</h3>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                  {analysisResult.atsResult.missingKeywords.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.atsResult.missingKeywords.length > 0 ? (
                  analysisResult.atsResult.missingKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300"
                    >
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-white/50">No missing keywords - great job!</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Study Plan Section */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Study Plan</h3>
            </div>
            
            {studyPlan ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-white">{studyPlan.title}</h4>
                  <p className="mt-2 text-white/70">{studyPlan.overview}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Clock className="h-4 w-4" />
                  <span>Estimated Timeline: {studyPlan.timeline}</span>
                </div>
                
                <div className="space-y-4">
                  {studyPlan.steps.map((step) => (
                    <div 
                      key={step.stepNumber}
                      className="rounded-xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-400">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-white">{step.title}</h5>
                          <p className="mt-1 text-sm text-white/70">{step.description}</p>
                          
                          {step.estimatedTime && (
                            <p className="mt-2 text-xs text-white/50">
                              <Clock className="mr-1 inline h-3 w-3" />
                              {step.estimatedTime}
                            </p>
                          )}
                          
                          {step.resources && step.resources.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-1 text-xs font-medium text-white/60">Resources:</p>
                              <ul className="space-y-1">
                                {step.resources.map((resource, idx) => (
                                  <li key={idx} className="flex items-center gap-1 text-xs text-blue-400">
                                    <ExternalLink className="h-3 w-3" />
                                    {resource}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                {studyPlanError && (
                  <div className="mb-4 flex items-start justify-center gap-2 text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">{studyPlanError}</p>
                  </div>
                )}
                
                {analysisResult.atsResult.missingKeywords.length > 0 ? (
                  <>
                    <p className="mb-4 text-white/60">
                      Generate an AI-powered study plan to help you acquire the missing skills for this role.
                    </p>
                    <Button
                      onClick={handleGenerateStudyPlan}
                      disabled={isGeneratingStudyPlan}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isGeneratingStudyPlan ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Study Plan...
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Generate Study Plan
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <p className="text-emerald-400">
                    Your resume already covers all the key skills! No study plan needed.
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Tailored Resume Placeholder */}
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6">
            <div className="text-center">
              <FileText className="mx-auto h-10 w-10 text-white/30" />
              <h3 className="mt-4 text-lg font-semibold text-white/70">
                Generated ATS Resume (Coming Soon)
              </h3>
              <p className="mt-2 text-sm text-white/50">
                This is where AI-generated tailored resume content will appear once integrated.
                The feature will automatically rewrite your resume to better match the job requirements.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

