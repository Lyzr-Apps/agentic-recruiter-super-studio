'use client'

import { useState, useRef, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FaBriefcase, FaLinkedin, FaGlassdoor, FaCheckCircle, FaTimesCircle, FaUpload, FaClock, FaEnvelope, FaCalendarAlt, FaStar, FaTrophy, FaUserTie } from 'react-icons/fa'
import { HiOutlineDocumentText } from 'react-icons/hi'
import { MdWork, MdLocationOn, MdEmail, MdPhone } from 'react-icons/md'

// Agent IDs from workflow_state.json
const AGENT_IDS = {
  JOB_DISTRIBUTION_MANAGER: '6985940f1caa4e686dd66f3a',
  PLATFORM_OPTIMIZER: '698593e61caa4e686dd66f39',
  MULTI_CHANNEL_POSTER: '698593fde5d25ce3f598cb87',
  RESUME_ANALYST: '69859423e5d25ce3f598cb88',
  CANDIDATE_ENGAGEMENT: '69859439a791e6e318b8df62',
  INTERVIEW_SCHEDULER: '6985944de17e33c11eed1a7f'
}

// TypeScript Interfaces based on test responses
interface JobDetails {
  title: string
  description: string
  salary_min: string
  salary_max: string
  skills: string
  location: string
  employment_type: 'Full-time' | 'Part-time' | 'Contract'
}

interface AgentLog {
  id: string
  timestamp: Date
  agent_name: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  score: number
  category: 'Reject' | 'Review' | 'Schedule'
  skills: string[]
  experience_years: number
  education: string
  reasoning: string
  resume_text?: string
}

interface JobPosting {
  platform: string
  status: string
  job_id: string
  url: string
  timestamp: string
}

interface PlatformContent {
  linkedin?: {
    content: string
    char_count: number
    hashtags: string[]
  }
  indeed?: {
    content: string
    char_count: number
    keywords: string[]
  }
  glassdoor?: {
    content: string
    char_count: number
    culture_points: string[]
  }
}

export default function Home() {
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    title: '',
    description: '',
    salary_min: '',
    salary_max: '',
    skills: '',
    location: '',
    employment_type: 'Full-time'
  })

  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [postings, setPostings] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [showResumeInput, setShowResumeInput] = useState(false)
  const [platformContent, setPlatformContent] = useState<PlatformContent | null>(null)

  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agentLogs])

  const addLog = (agent_name: string, message: string, type: AgentLog['type'] = 'info') => {
    const newLog: AgentLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      agent_name,
      message,
      type
    }
    setAgentLogs(prev => [...prev, newLog])
  }

  const handleBroadcastJob = async () => {
    if (!jobDetails.title || !jobDetails.description) {
      addLog('SYSTEM', 'Please fill in job title and description', 'error')
      return
    }

    setLoading(true)
    addLog('SYSTEM', 'Starting job broadcast workflow...', 'info')

    try {
      // Step 1: Call Platform Optimizer
      addLog('PLATFORM_OPTIMIZER', 'Optimizing job content for all platforms...', 'info')

      const optimizerMessage = `Optimize this job for all platforms: ${jobDetails.title}. ${jobDetails.description}. Skills: ${jobDetails.skills}. Location: ${jobDetails.location}. Salary: ${jobDetails.salary_min} - ${jobDetails.salary_max}. Type: ${jobDetails.employment_type}.`

      const optimizerResult = await callAIAgent(optimizerMessage, AGENT_IDS.PLATFORM_OPTIMIZER)

      if (optimizerResult.success && optimizerResult.response.status === 'success') {
        const optimizedContent = optimizerResult.response.result
        setPlatformContent(optimizedContent)
        addLog('PLATFORM_OPTIMIZER', 'Job content optimized for LinkedIn, Indeed, and Glassdoor', 'success')

        // Step 2: Call Multi-Channel Poster
        addLog('MULTI_CHANNEL_POSTER', 'Posting to job boards...', 'info')

        const posterMessage = `Post this job: ${jobDetails.title}. LinkedIn: ${optimizedContent.linkedin?.content}. Indeed: ${optimizedContent.indeed?.content}. Glassdoor: ${optimizedContent.glassdoor?.content}`

        const posterResult = await callAIAgent(posterMessage, AGENT_IDS.MULTI_CHANNEL_POSTER)

        if (posterResult.success && posterResult.response.status === 'success') {
          const postingsData = posterResult.response.result.postings || []
          setPostings(postingsData)

          postingsData.forEach((posting: JobPosting) => {
            addLog('MULTI_CHANNEL_POSTER', `Posted to ${posting.platform} - Job ID: ${posting.job_id}`, 'success')
          })

          addLog('JOB_DISTRIBUTION_MANAGER', `Job broadcast complete! Posted to ${postingsData.length} platforms.`, 'success')
        } else {
          addLog('MULTI_CHANNEL_POSTER', 'Failed to post to job boards', 'error')
        }
      } else {
        addLog('PLATFORM_OPTIMIZER', 'Failed to optimize job content', 'error')
      }
    } catch (error) {
      addLog('SYSTEM', `Error: ${error}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResumeAnalysis = async () => {
    if (!resumeText.trim()) {
      addLog('SYSTEM', 'Please paste resume text', 'error')
      return
    }

    setLoading(true)
    addLog('RESUME_ANALYST', 'Analyzing resume...', 'info')

    try {
      const analyzerMessage = `Analyze this candidate for ${jobDetails.title || 'open position'}: ${resumeText}. Job Requirements: ${jobDetails.skills}. ${jobDetails.description}`

      const result = await callAIAgent(analyzerMessage, AGENT_IDS.RESUME_ANALYST)

      if (result.success && result.response.status === 'success') {
        const candidateData = result.response.result

        const newCandidate: Candidate = {
          id: Date.now().toString(),
          name: candidateData.candidate_name || 'Unknown',
          email: candidateData.email || '',
          phone: candidateData.phone || '',
          score: candidateData.score || 0,
          category: candidateData.category || 'Review',
          skills: candidateData.skills_extracted || [],
          experience_years: candidateData.experience_years || 0,
          education: candidateData.education || '',
          reasoning: candidateData.reasoning || '',
          resume_text: resumeText
        }

        setCandidates(prev => [...prev, newCandidate])
        addLog('RESUME_ANALYST', `Candidate ${newCandidate.name} analyzed - Score: ${newCandidate.score}/100 - Category: ${newCandidate.category}`, 'success')

        setResumeText('')
        setShowResumeInput(false)
      } else {
        addLog('RESUME_ANALYST', 'Failed to analyze resume', 'error')
      }
    } catch (error) {
      addLog('SYSTEM', `Error: ${error}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEngageCandidate = async (candidate: Candidate) => {
    setLoading(true)
    addLog('CANDIDATE_ENGAGEMENT', `Preparing outreach email for ${candidate.name}...`, 'info')

    try {
      const engageMessage = `Send engagement email to candidate ${candidate.name} (${candidate.email}) for ${jobDetails.title} position. Highlight their ${candidate.skills.join(', ')} skills.`

      const result = await callAIAgent(engageMessage, AGENT_IDS.CANDIDATE_ENGAGEMENT)

      if (result.success && result.response.status === 'success') {
        addLog('CANDIDATE_ENGAGEMENT', `Outreach email sent to ${candidate.name}`, 'success')
      } else {
        addLog('CANDIDATE_ENGAGEMENT', `Failed to send email to ${candidate.name}`, 'error')
      }
    } catch (error) {
      addLog('SYSTEM', `Error: ${error}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleInterview = async (candidate: Candidate) => {
    setLoading(true)
    addLog('INTERVIEW_SCHEDULER', `Scheduling interview for ${candidate.name}...`, 'info')

    try {
      const scheduleMessage = `Schedule interview for candidate ${candidate.name} (${candidate.email}) for ${jobDetails.title} position. Find available slots this week.`

      const result = await callAIAgent(scheduleMessage, AGENT_IDS.INTERVIEW_SCHEDULER)

      if (result.success && result.response.status === 'success') {
        addLog('INTERVIEW_SCHEDULER', `Interview scheduled with ${candidate.name}`, 'success')
      } else {
        addLog('INTERVIEW_SCHEDULER', `Failed to schedule interview with ${candidate.name}`, 'error')
      }
    } catch (error) {
      addLog('SYSTEM', `Error: ${error}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="bg-[#FFFDF5] min-h-screen font-sans">
      {/* Header */}
      <div className="bg-black text-[#FFFDF5] p-6 border-b-[3px] border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)]">
        <h1 className="text-[32px] font-extrabold uppercase tracking-tight m-0 flex items-center gap-3">
          <FaBriefcase size={32} />
          AGENTIC RECRUITER
        </h1>
        <p className="m-0 mt-2 text-sm opacity-80">
          AI-Powered HR Recruitment Dashboard
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-[400px_1fr] gap-6 p-6 max-w-[1600px] mx-auto">
        {/* Left Column: Job Input Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border-[3px] border-black rounded shadow-[6px_6px_0px_#000000] p-6">
            <h2 className="text-lg font-extrabold uppercase mb-4 tracking-tight">
              <MdWork className="inline mr-2" />
              NEW JOB POSTING
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="title" className="font-bold text-xs uppercase">Job Title</Label>
                <Input
                  id="title"
                  value={jobDetails.title}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Senior Full Stack Developer"
                  className="border-[3px] border-black rounded p-3 text-sm font-semibold"
                />
              </div>

              <div>
                <Label htmlFor="description" className="font-bold text-xs uppercase">Job Description</Label>
                <Textarea
                  id="description"
                  value={jobDetails.description}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
                  className="border-[3px] border-black rounded p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="salary_min" className="font-bold text-xs uppercase">Min Salary</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={jobDetails.salary_min}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, salary_min: e.target.value }))}
                    placeholder="60000"
                    className="border-[3px] border-black rounded p-3"
                  />
                </div>
                <div>
                  <Label htmlFor="salary_max" className="font-bold text-xs uppercase">Max Salary</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={jobDetails.salary_max}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, salary_max: e.target.value }))}
                    placeholder="120000"
                    className="border-[3px] border-black rounded p-3"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="skills" className="font-bold text-xs uppercase">Required Skills</Label>
                <Input
                  id="skills"
                  value={jobDetails.skills}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="React, Node.js, AWS, Python (comma-separated)"
                  className="border-[3px] border-black rounded p-3"
                />
              </div>

              <div>
                <Label htmlFor="location" className="font-bold text-xs uppercase">Location</Label>
                <Input
                  id="location"
                  value={jobDetails.location}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="San Francisco, CA / Remote"
                  className="border-[3px] border-black rounded p-3"
                />
              </div>

              <div>
                <Label htmlFor="employment_type" className="font-bold text-xs uppercase">Employment Type</Label>
                <select
                  id="employment_type"
                  value={jobDetails.employment_type}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, employment_type: e.target.value as any }))}
                  className="w-full border-[3px] border-black rounded p-3 text-sm font-semibold bg-white"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <Button
                onClick={handleBroadcastJob}
                disabled={loading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-[3px] border-black rounded shadow-[6px_6px_0px_#000000] font-extrabold uppercase tracking-wide p-4 text-base transition-transform active:translate-x-[3px] active:translate-y-[3px]"
              >
                <FaBriefcase className="mr-2 inline" />
                {loading ? 'BROADCASTING...' : 'BROADCAST JOB'}
              </Button>
            </div>

            {/* Posting Results */}
            {postings.length > 0 && (
              <div className="mt-6 border-t-[3px] border-black pt-4">
                <h3 className="text-sm font-extrabold uppercase mb-3">
                  POSTED TO:
                </h3>
                <div className="flex flex-col gap-2">
                  {postings.map((posting, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 border-2 border-green-500 rounded">
                      {posting.platform === 'LinkedIn' && <FaLinkedin size={20} color="#0A66C2" />}
                      {posting.platform === 'Indeed' && <FaBriefcase size={20} color="#2164F3" />}
                      {posting.platform === 'Glassdoor' && <FaGlassdoor size={20} color="#0CAA41" />}
                      <div className="flex-1">
                        <div className="text-xs font-bold">{posting.platform}</div>
                        <a
                          href={`https://${posting.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#2563EB] underline"
                        >
                          {posting.job_id}
                        </a>
                      </div>
                      <FaCheckCircle color="#10B981" size={16} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Agent Feed */}
        <div className="bg-black border-[3px] border-black rounded shadow-[6px_6px_0px_#000000] p-6 h-[600px] flex flex-col">
          <h2 className="text-lg font-extrabold uppercase mb-4 text-[#10B981] tracking-wide font-mono">
            &gt; LIVE AGENT FEED
          </h2>

          <div className="flex-1 overflow-y-auto font-mono text-sm leading-relaxed bg-black p-3 border-2 border-[#10B981] rounded">
            {agentLogs.length === 0 ? (
              <div className="text-[#10B981] opacity-50">
                [SYSTEM] Waiting for agent activity...
              </div>
            ) : (
              agentLogs.map((log) => (
                <div key={log.id} className="mb-2">
                  <span className="text-gray-500">[{formatTimestamp(log.timestamp)}]</span>
                  {' '}
                  <span className="text-white font-bold">[{log.agent_name}]</span>
                  {' '}
                  <span className={
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-[#FF6B6B]' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-[#10B981]'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Candidate Cards Rail */}
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="bg-white border-[3px] border-black rounded shadow-[6px_6px_0px_#000000] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-extrabold uppercase tracking-tight m-0">
              <FaUserTie className="inline mr-2" />
              CANDIDATE PIPELINE
            </h2>

            <Button
              onClick={() => setShowResumeInput(!showResumeInput)}
              className={`${showResumeInput ? 'bg-[#FF6B6B] hover:bg-[#FF5252]' : 'bg-[#10B981] hover:bg-[#059669]'} text-white border-[3px] border-black rounded shadow-[4px_4px_0px_#000000] px-5 py-3 text-sm font-extrabold uppercase transition-transform active:translate-x-[2px] active:translate-y-[2px]`}
            >
              <FaUpload className="mr-2 inline" />
              {showResumeInput ? 'CANCEL' : 'ANALYZE RESUME'}
            </Button>
          </div>

          {/* Resume Input Area */}
          {showResumeInput && (
            <div className="mb-6 p-5 bg-blue-50 border-[3px] border-[#2563EB] rounded">
              <Label className="font-bold text-xs uppercase mb-2 block">
                PASTE RESUME TEXT
              </Label>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste candidate resume text here... Include name, email, phone, skills, experience, education..."
                rows={6}
                className="border-[3px] border-black rounded p-3 text-sm w-full mb-3"
              />
              <Button
                onClick={handleResumeAnalysis}
                disabled={loading || !resumeText.trim()}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-[3px] border-black rounded shadow-[4px_4px_0px_#000000] px-5 py-3 text-sm font-extrabold uppercase transition-transform active:translate-x-[2px] active:translate-y-[2px]"
              >
                <HiOutlineDocumentText className="mr-2 inline" />
                {loading ? 'ANALYZING...' : 'ANALYZE CANDIDATE'}
              </Button>
            </div>
          )}

          {/* Candidates Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[300px]">
            {candidates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-10">
                <FaUserTie size={48} className="mb-4 opacity-30" />
                <p className="text-base font-semibold text-center">
                  No candidates yet. Upload a resume to get started!
                </p>
              </div>
            ) : (
              candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="min-w-[320px] max-w-[320px] bg-white border-[3px] border-black rounded shadow-[6px_6px_0px_#000000] p-5 flex flex-col gap-3"
                >
                  {/* Candidate Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-extrabold uppercase mb-1">
                        {candidate.name}
                      </h3>
                      <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                        <MdEmail size={12} />
                        {candidate.email}
                      </div>
                      {candidate.phone && (
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <MdPhone size={12} />
                          {candidate.phone}
                        </div>
                      )}
                    </div>

                    {/* Score Badge */}
                    <div className={`w-[60px] h-[60px] rounded border-[3px] border-black flex items-center justify-center flex-col text-white font-extrabold ${
                      candidate.score >= 80 ? 'bg-[#10B981]' :
                      candidate.score >= 60 ? 'bg-[#FBBF24]' :
                      'bg-[#FF6B6B]'
                    }`}>
                      <div className="text-2xl">{candidate.score}</div>
                      <div className="text-[9px]">SCORE</div>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div>
                    <span className={`inline-block px-3 py-1.5 rounded text-xs font-extrabold uppercase border-2 border-black text-white ${
                      candidate.category === 'Schedule' ? 'bg-green-600' :
                      candidate.category === 'Review' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {candidate.category === 'Schedule' && <FaCheckCircle className="mr-1 inline" />}
                      {candidate.category === 'Reject' && <FaTimesCircle className="mr-1 inline" />}
                      {candidate.category}
                    </span>
                  </div>

                  {/* Skills Tags */}
                  <div>
                    <div className="text-xs font-bold mb-1.5 uppercase">
                      Skills:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.slice(0, 6).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 border-2 border-black rounded text-[10px] font-semibold bg-[#FFFDF5]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Experience & Education */}
                  <div className="text-xs text-gray-800">
                    <div className="mb-1">
                      <FaTrophy className="inline mr-1.5 text-[#FBBF24]" />
                      <strong>{candidate.experience_years} years</strong> experience
                    </div>
                    <div className="text-xs text-gray-600">
                      {candidate.education}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="text-xs text-gray-800 bg-gray-50 p-2.5 rounded border-2 border-gray-200 flex-1">
                    {candidate.reasoning}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      onClick={() => handleEngageCandidate(candidate)}
                      disabled={loading}
                      className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-[3px] border-black rounded shadow-[3px_3px_0px_#000000] p-2.5 text-xs font-extrabold uppercase transition-transform active:translate-x-[2px] active:translate-y-[2px]"
                    >
                      <FaEnvelope className="mr-1.5 inline" />
                      ENGAGE
                    </Button>

                    {candidate.category === 'Schedule' && (
                      <Button
                        onClick={() => handleScheduleInterview(candidate)}
                        disabled={loading}
                        className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white border-[3px] border-black rounded shadow-[3px_3px_0px_#000000] p-2.5 text-xs font-extrabold uppercase transition-transform active:translate-x-[2px] active:translate-y-[2px]"
                      >
                        <FaCalendarAlt className="mr-1.5 inline" />
                        SCHEDULE
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
