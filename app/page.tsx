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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981' // green
    if (score >= 60) return '#FBBF24' // yellow
    return '#FF6B6B' // coral red
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Schedule': return 'bg-green-600'
      case 'Review': return 'bg-yellow-600'
      case 'Reject': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      default: return 'text-green-300'
    }
  }

  return (
    <div style={{ backgroundColor: '#FFFDF5', minHeight: '100vh', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#000000',
        color: '#FFFDF5',
        padding: '24px',
        borderBottom: '3px solid #000000',
        boxShadow: '6px 6px 0px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '-0.05em',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FaBriefcase size={32} />
          AGENTIC RECRUITER
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
          AI-Powered HR Recruitment Dashboard
        </p>
      </div>

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        gap: '24px',
        padding: '24px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Left Column: Job Input Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '3px solid #000000',
            borderRadius: '4px',
            boxShadow: '6px 6px 0px #000000',
            padding: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '800',
              textTransform: 'uppercase',
              marginBottom: '16px',
              letterSpacing: '-0.02em'
            }}>
              <MdWork style={{ display: 'inline', marginRight: '8px' }} />
              NEW JOB POSTING
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Label htmlFor="title" style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Job Title</Label>
                <Input
                  id="title"
                  value={jobDetails.title}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Senior Full Stack Developer"
                  style={{
                    border: '3px solid #000000',
                    borderRadius: '4px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                />
              </div>

              <div>
                <Label htmlFor="description" style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Job Description</Label>
                <Textarea
                  id="description"
                  value={jobDetails.description}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
                  style={{
                    border: '3px solid #000000',
                    borderRadius: '4px',
                    padding: '12px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label htmlFor="salary_min" style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Min Salary</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={jobDetails.salary_min}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, salary_min: e.target.value }))}
                    placeholder="60000"
                    style={{ border: '3px solid #000000', borderRadius: '4px', padding: '12px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="salary_max" style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Max Salary</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={jobDetails.salary_max}
                    onChange={(e) => setJobDetails(prev => ({ ...prev, salary_max: e.target.value }))}
                    placeholder="120000"
                    style={{ border: '3px solid #000000', borderRadius: '4px', padding: '12px' }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="skills" style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Required Skills</Label>
                <Input
                  id="skills"
                  value={jobDetails.skills}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="React, Node.js, AWS, Python (comma-separated)"
                  style={{ border: '3px solid #000000', borderRadius: '4px', padding: '12px' }}
                />
              </div>

              <div>
                <Label htmlFor="location" style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Location</Label>
                <Input
                  id="location"
                  value={jobDetails.location}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="San Francisco, CA / Remote"
                  style={{ border: '3px solid #000000', borderRadius: '4px', padding: '12px' }}
                />
              </div>

              <div>
                <Label htmlFor="employment_type" style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>Employment Type</Label>
                <select
                  id="employment_type"
                  value={jobDetails.employment_type}
                  onChange={(e) => setJobDetails(prev => ({ ...prev, employment_type: e.target.value as any }))}
                  style={{
                    width: '100%',
                    border: '3px solid #000000',
                    borderRadius: '4px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <Button
                onClick={handleBroadcastJob}
                disabled={loading}
                style={{
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: '3px solid #000000',
                  borderRadius: '4px',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '6px 6px 0px #000000',
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                  width: '100%'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'translate(3px, 3px)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'translate(0, 0)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(0, 0)'}
              >
                <FaBriefcase style={{ marginRight: '8px', display: 'inline' }} />
                {loading ? 'BROADCASTING...' : 'BROADCAST JOB'}
              </Button>
            </div>

            {/* Posting Results */}
            {postings.length > 0 && (
              <div style={{ marginTop: '24px', borderTop: '3px solid #000000', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>
                  POSTED TO:
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {postings.map((posting, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      backgroundColor: '#F0FDF4',
                      border: '2px solid #10B981',
                      borderRadius: '4px'
                    }}>
                      {posting.platform === 'LinkedIn' && <FaLinkedin size={20} color="#0A66C2" />}
                      {posting.platform === 'Indeed' && <FaBriefcase size={20} color="#2164F3" />}
                      {posting.platform === 'Glassdoor' && <FaGlassdoor size={20} color="#0CAA41" />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '700' }}>{posting.platform}</div>
                        <a
                          href={`https://${posting.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '10px', color: '#2563EB', textDecoration: 'underline' }}
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
        <div style={{
          backgroundColor: '#000000',
          border: '3px solid #000000',
          borderRadius: '4px',
          boxShadow: '6px 6px 0px #000000',
          padding: '24px',
          height: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '800',
            textTransform: 'uppercase',
            marginBottom: '16px',
            color: '#10B981',
            letterSpacing: '0.05em',
            fontFamily: 'monospace'
          }}>
            &gt; LIVE AGENT FEED
          </h2>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            backgroundColor: '#000000',
            padding: '12px',
            border: '2px solid #10B981',
            borderRadius: '4px'
          }}>
            {agentLogs.length === 0 ? (
              <div style={{ color: '#10B981', opacity: 0.5 }}>
                [SYSTEM] Waiting for agent activity...
              </div>
            ) : (
              agentLogs.map((log) => (
                <div key={log.id} style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#666666' }}>[{formatTimestamp(log.timestamp)}]</span>
                  {' '}
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>[{log.agent_name}]</span>
                  {' '}
                  <span className={getLogColor(log.type)} style={{ color: getLogColor(log.type) === 'text-green-400' ? '#4ADE80' : getLogColor(log.type) === 'text-red-400' ? '#FF6B6B' : getLogColor(log.type) === 'text-yellow-400' ? '#FBBF24' : '#10B981' }}>
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
      <div style={{ padding: '0 24px 24px 24px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '3px solid #000000',
          borderRadius: '4px',
          boxShadow: '6px 6px 0px #000000',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              <FaUserTie style={{ display: 'inline', marginRight: '8px' }} />
              CANDIDATE PIPELINE
            </h2>

            <Button
              onClick={() => setShowResumeInput(!showResumeInput)}
              style={{
                backgroundColor: showResumeInput ? '#FF6B6B' : '#10B981',
                color: '#FFFFFF',
                border: '3px solid #000000',
                borderRadius: '4px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '800',
                textTransform: 'uppercase',
                boxShadow: '4px 4px 0px #000000',
                cursor: 'pointer'
              }}
            >
              <FaUpload style={{ marginRight: '8px', display: 'inline' }} />
              {showResumeInput ? 'CANCEL' : 'ANALYZE RESUME'}
            </Button>
          </div>

          {/* Resume Input Area */}
          {showResumeInput && (
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#F0F9FF',
              border: '3px solid #2563EB',
              borderRadius: '4px'
            }}>
              <Label style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                PASTE RESUME TEXT
              </Label>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste candidate resume text here... Include name, email, phone, skills, experience, education..."
                rows={6}
                style={{
                  border: '3px solid #000000',
                  borderRadius: '4px',
                  padding: '12px',
                  fontSize: '14px',
                  width: '100%',
                  marginBottom: '12px'
                }}
              />
              <Button
                onClick={handleResumeAnalysis}
                disabled={loading || !resumeText.trim()}
                style={{
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: '3px solid #000000',
                  borderRadius: '4px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  boxShadow: '4px 4px 0px #000000',
                  cursor: 'pointer'
                }}
              >
                <HiOutlineDocumentText style={{ marginRight: '8px', display: 'inline' }} />
                {loading ? 'ANALYZING...' : 'ANALYZE CANDIDATE'}
              </Button>
            </div>
          )}

          {/* Candidates Horizontal Scroll */}
          <div style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '16px',
            minHeight: '300px'
          }}>
            {candidates.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666666',
                padding: '40px'
              }}>
                <FaUserTie size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '16px', fontWeight: '600', textAlign: 'center' }}>
                  No candidates yet. Upload a resume to get started!
                </p>
              </div>
            ) : (
              candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  style={{
                    minWidth: '320px',
                    maxWidth: '320px',
                    backgroundColor: '#FFFFFF',
                    border: '3px solid #000000',
                    borderRadius: '4px',
                    boxShadow: '6px 6px 0px #000000',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Candidate Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        margin: 0,
                        marginBottom: '4px'
                      }}>
                        {candidate.name}
                      </h3>
                      <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdEmail size={12} />
                        {candidate.email}
                      </div>
                      {candidate.phone && (
                        <div style={{ fontSize: '11px', color: '#666666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MdPhone size={12} />
                          {candidate.phone}
                        </div>
                      )}
                    </div>

                    {/* Score Badge */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '4px',
                      backgroundColor: getScoreColor(candidate.score),
                      border: '3px solid #000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      color: '#FFFFFF',
                      fontWeight: '800'
                    }}>
                      <div style={{ fontSize: '24px' }}>{candidate.score}</div>
                      <div style={{ fontSize: '9px' }}>SCORE</div>
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      border: '2px solid #000000',
                      color: '#FFFFFF'
                    }}
                    className={getCategoryBadgeColor(candidate.category)}
                    >
                      {candidate.category === 'Schedule' && <FaCheckCircle style={{ marginRight: '4px', display: 'inline' }} />}
                      {candidate.category === 'Reject' && <FaTimesCircle style={{ marginRight: '4px', display: 'inline' }} />}
                      {candidate.category}
                    </span>
                  </div>

                  {/* Skills Tags */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Skills:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {candidate.skills.slice(0, 6).map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            border: '2px solid #000000',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: '#FFFDF5'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Experience & Education */}
                  <div style={{ fontSize: '12px', color: '#333333' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <FaTrophy style={{ display: 'inline', marginRight: '6px', color: '#FBBF24' }} />
                      <strong>{candidate.experience_years} years</strong> experience
                    </div>
                    <div style={{ fontSize: '11px', color: '#666666' }}>
                      {candidate.education}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div style={{
                    fontSize: '11px',
                    color: '#333333',
                    backgroundColor: '#F9FAFB',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '2px solid #E5E7EB',
                    flex: 1
                  }}>
                    {candidate.reasoning}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <Button
                      onClick={() => handleEngageCandidate(candidate)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        border: '3px solid #000000',
                        borderRadius: '4px',
                        padding: '10px',
                        fontSize: '12px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        boxShadow: '3px 3px 0px #000000',
                        cursor: 'pointer'
                      }}
                    >
                      <FaEnvelope style={{ marginRight: '6px', display: 'inline' }} />
                      ENGAGE
                    </Button>

                    {candidate.category === 'Schedule' && (
                      <Button
                        onClick={() => handleScheduleInterview(candidate)}
                        disabled={loading}
                        style={{
                          flex: 1,
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          border: '3px solid #000000',
                          borderRadius: '4px',
                          padding: '10px',
                          fontSize: '12px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          boxShadow: '3px 3px 0px #000000',
                          cursor: 'pointer'
                        }}
                      >
                        <FaCalendarAlt style={{ marginRight: '6px', display: 'inline' }} />
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
