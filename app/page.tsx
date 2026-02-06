'use client'

import { useState, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  Calendar,
  Heart,
  MessageCircle,
  Home,
  Train,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  Droplet,
  Utensils,
  Send,
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Car,
  Bike,
  Wallet,
  CreditCard,
  TrendingUp,
  IndianRupee
} from 'lucide-react'

// Agent IDs
const DAILY_OPS_COORDINATOR_ID = '6985879714456d4b2db732d8'

// TypeScript interfaces based on actual test responses
interface UnifiedRecommendation {
  summary: string
  primary_action: string
  reasoning: string
  confidence_level: 'high' | 'medium' | 'low'
}

interface TransportPlan {
  recommended_route: string
  mode: string
  departure_time: string
  eta: string
  cost: number
  safety_level: string
  alternatives: string[]
}

interface ScheduleOverview {
  next_events: string[]
  conflicts_resolved: string[]
  buffer_status: string
}

interface WellnessAlerts {
  immediate_actions: string[]
  scheduled_reminders: string[]
  wellness_score: number
}

interface SafetyNotes {
  overall_safety: string
  key_precautions: string[]
  emergency_contacts_ready: boolean
}

interface SocialOpportunities {
  group_travel_available: boolean
  meeting_points: string[]
  coordination_notes: string
}

interface ConflictTradeoff {
  conflict_type: string
  options: string[]
  chosen_option: string
  rationale: string
}

interface DailyOpsResponse {
  unified_recommendation: UnifiedRecommendation
  transport_plan: TransportPlan
  schedule_overview: ScheduleOverview
  wellness_alerts: WellnessAlerts
  safety_notes: SafetyNotes
  social_opportunities: SocialOpportunities
  conflicts_and_tradeoffs: ConflictTradeoff[]
  user_preferences_applied: string[]
  overall_confidence_score: number
}

interface ScheduleEvent {
  id: string
  event_name: string
  start_time: string
  end_time: string
  location: string
  priority: string
  type: 'lecture' | 'internship' | 'social' | 'personal'
  description?: string
}

interface RideOption {
  provider: 'rapido' | 'uber'
  vehicleType: string
  price: number
  eta: string
  distance: string
}

interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  timestamp: Date
  provider?: string
}

interface SubjectPreference {
  id: string
  name: string
  color: string
  professor?: string
}

interface TrainTracking {
  trainNumber: string
  trainName: string
  currentLocation: string
  nextStation: string
  estimatedArrival: string
  delay: number
  platform?: string
  status: 'on-time' | 'delayed' | 'approaching'
}

interface HydrationReminder {
  time: string
  reason: string
  urgency: string
}

interface MealSuggestion {
  meal_type: string
  suggested_time: string
  duration_available_minutes: number
  location_suggestions: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type Tab = 'today' | 'schedule' | 'wellness' | 'chat' | 'wallet'

export default function DailyOpsApp() {
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [loading, setLoading] = useState(false)
  const [dailyOpsData, setDailyOpsData] = useState<DailyOpsResponse | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [alertsExpanded, setAlertsExpanded] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Calendar Management
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [eventForm, setEventForm] = useState({
    event_name: '',
    start_time: '',
    end_time: '',
    location: '',
    type: 'lecture' as 'lecture' | 'internship' | 'social' | 'personal',
    priority: 'medium',
    description: ''
  })

  // Ride Booking
  const [showRideBooking, setShowRideBooking] = useState(false)
  const [rideDestination, setRideDestination] = useState('')
  const [rideOrigin, setRideOrigin] = useState('')
  const [availableRides, setAvailableRides] = useState<RideOption[]>([])
  const [selectedRide, setSelectedRide] = useState<RideOption | null>(null)

  // Wallet
  const [walletBalance, setWalletBalance] = useState(2500)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: '1',
      type: 'credit',
      amount: 5000,
      description: 'Initial wallet top-up',
      timestamp: new Date('2024-06-20T10:00:00')
    },
    {
      id: '2',
      type: 'debit',
      amount: 2500,
      description: 'Ride booking - Rapido Bike',
      timestamp: new Date('2024-06-25T08:30:00'),
      provider: 'Rapido'
    }
  ])
  const [showWalletTopup, setShowWalletTopup] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')

  // Schedule data with full CRUD
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([
    {
      id: '1',
      event_name: 'Morning Lecture',
      start_time: '2024-06-28T09:00:00+05:30',
      end_time: '2024-06-28T11:00:00+05:30',
      location: 'Churchgate',
      priority: 'high',
      type: 'lecture',
      description: 'Advanced Mathematics'
    },
    {
      id: '2',
      event_name: 'Afternoon Lecture',
      start_time: '2024-06-28T14:00:00+05:30',
      end_time: '2024-06-28T16:00:00+05:30',
      location: 'Churchgate',
      priority: 'high',
      type: 'lecture',
      description: 'Computer Science Lab'
    },
    {
      id: '3',
      event_name: 'Internship Meeting',
      start_time: '2024-06-28T17:00:00+05:30',
      end_time: '2024-06-28T18:00:00+05:30',
      location: 'BKC',
      priority: 'high',
      type: 'internship',
      description: 'Weekly sync with team'
    }
  ])

  // Subject Preferences
  const [subjectPreferences, setSubjectPreferences] = useState<SubjectPreference[]>([
    { id: '1', name: 'Advanced Mathematics', color: 'blue', professor: 'Dr. Sharma' },
    { id: '2', name: 'Computer Science Lab', color: 'purple', professor: 'Prof. Mehta' }
  ])
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SubjectPreference | null>(null)
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    color: 'blue',
    professor: ''
  })

  // Schedule Tab Filter
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'lecture' | 'internship' | 'social'>('all')

  // Live Train Tracking
  const [trainTracking, setTrainTracking] = useState<TrainTracking | null>(null)
  const [showTrainTracking, setShowTrainTracking] = useState(false)

  // Mock wellness data
  const [wellnessData] = useState({
    waterIntake: 4,
    waterGoal: 8,
    mealsLogged: 2,
    energyLevel: 'Good'
  })

  const [hydrationReminders] = useState<HydrationReminder[]>([
    {
      time: '2024-06-21T10:30:00+05:30',
      reason: 'Lecture session start; ensure hydration for optimal focus.',
      urgency: 'medium'
    },
    {
      time: '2024-06-21T12:00:00+05:30',
      reason: 'Midway through lectures; prevent fatigue and maintain alertness.',
      urgency: 'high'
    }
  ])

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch daily ops data on mount
  useEffect(() => {
    const fetchDailyOps = async () => {
      setLoading(true)
      const result = await callAIAgent(
        "I have a 9 AM lecture at Churchgate. What should I do now? I'm currently at Andheri.",
        DAILY_OPS_COORDINATOR_ID
      )

      if (result.success && result.response.status === 'success') {
        setDailyOpsData(result.response.result)
      }
      setLoading(false)
    }

    fetchDailyOps()
  }, [])

  // Hydration fix: only render time-sensitive content on client
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setLoading(true)

    const result = await callAIAgent(chatInput, DAILY_OPS_COORDINATOR_ID)

    if (result.success && result.response.status === 'success') {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response.result.unified_recommendation?.summary ||
                 JSON.stringify(result.response.result, null, 2),
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, assistantMessage])
    }

    setLoading(false)
  }

  const handleQuickAction = async (action: string) => {
    setChatInput(action)
    handleChatSubmit()
  }

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-500'
      case 'internship':
        return 'bg-purple-500'
      case 'social':
        return 'bg-teal-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Calendar Management Functions
  const handleAddEvent = () => {
    setEditingEvent(null)
    setEventForm({
      event_name: '',
      start_time: '',
      end_time: '',
      location: '',
      type: 'lecture',
      priority: 'medium',
      description: ''
    })
    setShowEventModal(true)
  }

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setEventForm({
      event_name: event.event_name,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      type: event.type,
      priority: event.priority,
      description: event.description || ''
    })
    setShowEventModal(true)
  }

  const handleDeleteEvent = (eventId: string) => {
    setScheduleEvents(prev => prev.filter(e => e.id !== eventId))
  }

  const handleSaveEvent = () => {
    if (!eventForm.event_name || !eventForm.start_time || !eventForm.end_time || !eventForm.location) {
      return
    }

    if (editingEvent) {
      // Update existing event
      setScheduleEvents(prev => prev.map(e =>
        e.id === editingEvent.id
          ? { ...e, ...eventForm }
          : e
      ))
    } else {
      // Add new event
      const newEvent: ScheduleEvent = {
        id: Date.now().toString(),
        ...eventForm
      }
      setScheduleEvents(prev => [...prev, newEvent])
    }

    setShowEventModal(false)
  }

  // Ride Booking Functions
  const handleSearchRides = async () => {
    if (!rideOrigin || !rideDestination) return

    setLoading(true)
    // Simulate ride search with mock data
    setTimeout(() => {
      const mockRides: RideOption[] = [
        {
          provider: 'rapido',
          vehicleType: 'Bike',
          price: 45,
          eta: '5 mins',
          distance: '8.2 km'
        },
        {
          provider: 'rapido',
          vehicleType: 'Auto',
          price: 85,
          eta: '6 mins',
          distance: '8.2 km'
        },
        {
          provider: 'uber',
          vehicleType: 'UberGo',
          price: 120,
          eta: '4 mins',
          distance: '8.2 km'
        },
        {
          provider: 'uber',
          vehicleType: 'UberMoto',
          price: 50,
          eta: '5 mins',
          distance: '8.2 km'
        }
      ]
      setAvailableRides(mockRides)
      setLoading(false)
    }, 1000)
  }

  const handleBookRide = (ride: RideOption) => {
    if (walletBalance < ride.price) {
      alert('Insufficient wallet balance. Please top up your wallet.')
      return
    }

    // Deduct from wallet
    setWalletBalance(prev => prev - ride.price)

    // Add transaction
    const newTransaction: WalletTransaction = {
      id: Date.now().toString(),
      type: 'debit',
      amount: ride.price,
      description: `Ride: ${rideOrigin} to ${rideDestination} - ${ride.provider} ${ride.vehicleType}`,
      timestamp: new Date(),
      provider: ride.provider
    }
    setTransactions(prev => [newTransaction, ...prev])

    setSelectedRide(ride)
    alert(`Ride booked successfully! Your ${ride.provider} ${ride.vehicleType} will arrive in ${ride.eta}. ₹${ride.price} deducted from wallet.`)

    // Reset
    setTimeout(() => {
      setShowRideBooking(false)
      setRideOrigin('')
      setRideDestination('')
      setAvailableRides([])
      setSelectedRide(null)
    }, 2000)
  }

  // Wallet Functions
  const handleWalletTopup = () => {
    const amount = parseInt(topupAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setWalletBalance(prev => prev + amount)

    const newTransaction: WalletTransaction = {
      id: Date.now().toString(),
      type: 'credit',
      amount: amount,
      description: 'Wallet top-up',
      timestamp: new Date()
    }
    setTransactions(prev => [newTransaction, ...prev])

    setShowWalletTopup(false)
    setTopupAmount('')
  }

  // Subject Management Functions
  const handleAddSubject = () => {
    setEditingSubject(null)
    setSubjectForm({ name: '', color: 'blue', professor: '' })
    setShowSubjectModal(true)
  }

  const handleEditSubject = (subject: SubjectPreference) => {
    setEditingSubject(subject)
    setSubjectForm({
      name: subject.name,
      color: subject.color,
      professor: subject.professor || ''
    })
    setShowSubjectModal(true)
  }

  const handleDeleteSubject = (subjectId: string) => {
    setSubjectPreferences(prev => prev.filter(s => s.id !== subjectId))
  }

  const handleSaveSubject = () => {
    if (!subjectForm.name) return

    if (editingSubject) {
      setSubjectPreferences(prev => prev.map(s =>
        s.id === editingSubject.id
          ? { ...s, ...subjectForm }
          : s
      ))
    } else {
      const newSubject: SubjectPreference = {
        id: Date.now().toString(),
        ...subjectForm
      }
      setSubjectPreferences(prev => [...prev, newSubject])
    }

    setShowSubjectModal(false)
  }

  // Live Train Tracking
  const handleTrackTrain = async () => {
    setLoading(true)
    const result = await callAIAgent(
      "Track the next Western Line local train from Andheri to Churchgate. Provide real-time location, current station, next station, ETA, and any delays. Format as live tracking data.",
      DAILY_OPS_COORDINATOR_ID
    )

    if (result.success && result.response.status === 'success') {
      // Mock train tracking data based on AI response
      const mockTracking: TrainTracking = {
        trainNumber: '12345',
        trainName: 'Western Line Local',
        currentLocation: 'Bandra',
        nextStation: 'Mahim',
        estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString(),
        delay: 2,
        platform: '2',
        status: 'on-time'
      }
      setTrainTracking(mockTracking)
      setShowTrainTracking(true)
    }
    setLoading(false)
  }

  // M Indicator Integration (using AI for real-time Mumbai train data)
  const handleCheckMIndicator = async () => {
    setLoading(true)
    const result = await callAIAgent(
      "Check current Mumbai local train status from Andheri to Churchgate. Use M Indicator app data if available, or search for real-time Western Line train timings.",
      DAILY_OPS_COORDINATOR_ID
    )

    if (result.success && result.response.status === 'success') {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response.result.unified_recommendation?.summary ||
                 JSON.stringify(result.response.result, null, 2),
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, assistantMessage])
      setActiveTab('chat')
    }
    setLoading(false)
  }

  const formatTime = (dateString: string) => {
    if (!isClient) return '' // Prevent hydration mismatch
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return dateString
    }
  }

  // Today Dashboard Tab
  const TodayTab = () => (
    <div className="space-y-4 pb-24">
      {/* Current Action Card */}
      {dailyOpsData?.unified_recommendation && (
        <Card className="border-2 border-blue-600 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl text-blue-900">What Now?</CardTitle>
              <span className={`px-3 py-1 rounded-full text-xs text-white font-semibold ${getConfidenceBadgeColor(dailyOpsData.unified_recommendation.confidence_level)}`}>
                {dailyOpsData.unified_recommendation.confidence_level.toUpperCase()}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-lg font-semibold text-gray-800">
              {dailyOpsData.unified_recommendation.primary_action}
            </p>
            <p className="text-sm text-gray-600">
              {dailyOpsData.unified_recommendation.reasoning}
            </p>

            {/* Transport Info */}
            {dailyOpsData.transport_plan && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Train className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    {dailyOpsData.transport_plan.mode.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span>Depart: {formatTime(dailyOpsData.transport_plan.departure_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span>Arrive: {formatTime(dailyOpsData.transport_plan.eta)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">Cost: ₹{dailyOpsData.transport_plan.cost}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <MapPin className="w-4 h-4 mr-2" />
                Open Maps
              </Button>
              <Button
                onClick={handleCheckMIndicator}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Train className="w-4 h-4 mr-2" />
                M Indicator
              </Button>
            </div>
            <Button
              onClick={() => setShowRideBooking(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-2"
            >
              <Car className="w-4 h-4 mr-2" />
              Book Ride
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Alert Strip */}
      {dailyOpsData?.safety_notes && (
        <Card className="border-orange-500 border-l-4">
          <CardHeader
            className="py-3 cursor-pointer"
            onClick={() => setAlertsExpanded(!alertsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-sm">Safety Alerts</CardTitle>
              </div>
              {alertsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
          {alertsExpanded && (
            <CardContent className="pt-0">
              <ul className="space-y-1 text-sm text-gray-700">
                {dailyOpsData.safety_notes.key_precautions.map((precaution, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{precaution}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      {/* Timeline Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Next Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scheduleEvents.slice(0, 3).map((event, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-1 h-16 ${getEventColor(event.priority)} rounded-full`}></div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{event.event_name}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.start_time)}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live Train Tracking */}
      {showTrainTracking && trainTracking && (
        <Card className="border-2 border-green-600 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                <Train className="w-5 h-5" />
                Live Train Tracking
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTrainTracking(false)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Train {trainTracking.trainNumber}</p>
                <p className="text-xs text-gray-600">{trainTracking.trainName}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                trainTracking.status === 'on-time' ? 'bg-green-600' :
                trainTracking.status === 'delayed' ? 'bg-red-600' :
                'bg-yellow-600'
              }`}>
                {trainTracking.status.toUpperCase()}
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-800">
                  Currently at: {trainTracking.currentLocation}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Next Station: {trainTracking.nextStation}</p>
                <p>ETA: {formatTime(trainTracking.estimatedArrival)}</p>
                {trainTracking.platform && <p>Platform: {trainTracking.platform}</p>}
                {trainTracking.delay > 0 && (
                  <p className="text-red-600 font-semibold">Delay: {trainTracking.delay} mins</p>
                )}
              </div>
            </div>
            <Button
              onClick={handleTrackTrain}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Train className="w-4 h-4 mr-2" />}
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Track Train Button */}
      {!showTrainTracking && (
        <Button
          onClick={handleTrackTrain}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Train className="w-4 h-4 mr-2" />
          Track My Train
        </Button>
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <Droplet className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-900">{wellnessData.waterIntake}/{wellnessData.waterGoal}</div>
            <div className="text-xs text-gray-600">Water</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <Utensils className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-900">{wellnessData.mealsLogged}</div>
            <div className="text-xs text-gray-600">Meals</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="p-4 text-center">
            <Heart className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-purple-900">{wellnessData.energyLevel}</div>
            <div className="text-xs text-gray-600">Energy</div>
          </CardContent>
        </Card>
      </div>

      {/* Social Opportunities */}
      {dailyOpsData?.social_opportunities?.group_travel_available && (
        <Card className="border-teal-500 border-l-4 bg-teal-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-sm text-teal-900">Group Travel Available</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-2">
              {dailyOpsData.social_opportunities.coordination_notes}
            </p>
            {dailyOpsData.social_opportunities.meeting_points.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-teal-700">
                <MapPin className="w-4 h-4" />
                <span className="font-semibold">{dailyOpsData.social_opportunities.meeting_points[0]}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating What Now Button */}
      <div className="fixed bottom-24 right-6 z-10">
        <Button
          onClick={() => setActiveTab('chat')}
          className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <MessageCircle className="w-7 h-7" />
        </Button>
      </div>
    </div>
  )

  // Schedule Tab
  const ScheduleTab = () => {
    const filteredEvents = scheduleFilter === 'all'
      ? scheduleEvents
      : scheduleEvents.filter(e => e.type === scheduleFilter)

    return (
      <div className="space-y-4 pb-24">
        {/* Tab Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            size="sm"
            variant={scheduleFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setScheduleFilter('all')}
            className={scheduleFilter === 'all' ? 'bg-blue-600' : ''}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={scheduleFilter === 'lecture' ? 'default' : 'outline'}
            onClick={() => setScheduleFilter('lecture')}
            className={scheduleFilter === 'lecture' ? 'bg-blue-600' : ''}
          >
            Lectures
          </Button>
          <Button
            size="sm"
            variant={scheduleFilter === 'internship' ? 'default' : 'outline'}
            onClick={() => setScheduleFilter('internship')}
            className={scheduleFilter === 'internship' ? 'bg-purple-600' : ''}
          >
            Internships
          </Button>
          <Button
            size="sm"
            variant={scheduleFilter === 'social' ? 'default' : 'outline'}
            onClick={() => setScheduleFilter('social')}
            className={scheduleFilter === 'social' ? 'bg-teal-600' : ''}
          >
            Social
          </Button>
        </div>

        {/* Subject Preferences (shown only for Lectures tab) */}
        {scheduleFilter === 'lecture' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Subject Preferences</CardTitle>
                <Button onClick={handleAddSubject} size="sm" className="bg-blue-600 hover:bg-blue-700 h-7">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Subject
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {subjectPreferences.map((subject) => (
                  <div
                    key={subject.id}
                    className={`p-3 rounded-lg border-2 bg-${subject.color}-100 border-${subject.color}-300`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{subject.name}</p>
                        {subject.professor && (
                          <p className="text-xs text-gray-600 mt-1">{subject.professor}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSubject(subject)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {scheduleFilter === 'all' ? 'Weekly Schedule' :
                 scheduleFilter === 'lecture' ? 'Lecture Schedule' :
                 scheduleFilter === 'internship' ? 'Internship Schedule' :
                 'Social Events'}
              </CardTitle>
              <Button onClick={handleAddEvent} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No {scheduleFilter === 'all' ? 'events' : scheduleFilter + 's'} scheduled.</p>
              </div>
            ) : (
              filteredEvents.map((event, idx) => (
              <div key={event.id} className="relative">
                {/* Event Block */}
                <div className={`p-4 rounded-lg border-2 ${
                  event.type === 'lecture' ? 'border-blue-500 bg-blue-50' :
                  event.type === 'internship' ? 'border-purple-500 bg-purple-50' :
                  event.type === 'social' ? 'border-teal-500 bg-teal-50' :
                  'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{event.event_name}</h3>
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs text-white ${getEventColor(event.type)}`}>
                        {event.type}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEvent(event)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                {/* Travel Block */}
                {idx < filteredEvents.length - 1 && (
                  <div className="ml-8 my-2 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Train className="w-4 h-4 text-yellow-600" />
                      <span className="font-semibold">Travel Time: ~30 mins</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {event.location} → {filteredEvents[idx + 1].location}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
    )
  }

  // Wellness Tab
  const WellnessTab = () => (
    <div className="space-y-4 pb-24">
      {/* Today's Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-green-600" />
            Today's Wellness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hydration Tracker */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Hydration</span>
              </div>
              <span className="text-sm text-gray-600">{wellnessData.waterIntake}/{wellnessData.waterGoal} glasses</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${(wellnessData.waterIntake / wellnessData.waterGoal) * 100}%` }}
              ></div>
            </div>
            <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
              Log Water
            </Button>
          </div>

          {/* Meal Log */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Meals Logged</span>
              </div>
              <span className="text-sm text-gray-600">{wellnessData.mealsLogged} today</span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Log Meal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hydrationReminders.map((reminder, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border-l-4 ${
                reminder.urgency === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-semibold">{formatTime(reminder.time)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{reminder.reason}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs text-white ${
                  reminder.urgency === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  {reminder.urgency}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="text-xs">
                  Snooze
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Weekly Pattern */}
      {dailyOpsData?.wellness_alerts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wellness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {dailyOpsData.wellness_alerts.wellness_score}
              </div>
              <div className="text-sm text-gray-600">out of 100</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${dailyOpsData.wellness_alerts.wellness_score}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Wallet Tab
  const WalletTab = () => (
    <div className="space-y-4 pb-24">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="w-6 h-6" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4">
            <IndianRupee className="w-8 h-8 inline" />
            {walletBalance.toFixed(2)}
          </div>
          <Button
            onClick={() => setShowWalletTopup(true)}
            className="w-full bg-white text-blue-600 hover:bg-gray-100"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Top Up Wallet
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowRideBooking(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Car className="w-4 h-4 mr-2" />
            Book Ride
          </Button>
          <Button
            onClick={handleCheckMIndicator}
            className="bg-green-600 hover:bg-green-700"
          >
            <Train className="w-4 h-4 mr-2" />
            Train Status
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.slice(0, 10).map((transaction) => (
              <div
                key={transaction.id}
                className={`p-3 rounded-lg border-l-4 ${
                  transaction.type === 'credit' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{transaction.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {transaction.timestamp.toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}
                    <IndianRupee className="w-4 h-4 inline" />
                    {transaction.amount}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Chat Tab
  const ChatTab = () => (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Quick Action Chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => handleQuickAction("Plan tomorrow")}
        >
          Plan tomorrow
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => handleQuickAction("Coordinate with friends")}
        >
          Coordinate with friends
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => handleQuickAction("Find food nearby")}
        >
          Find food nearby
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => handleQuickAction("Check train status")}
        >
          Check train status
        </Button>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Start a conversation with your Daily Ops Coordinator</p>
          </div>
        ) : (
          chatMessages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="flex gap-2">
        <Input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
          placeholder="Ask me anything..."
          className="flex-1"
          disabled={loading}
        />
        <Button
          onClick={handleChatSubmit}
          disabled={loading || !chatInput.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4 shadow-lg">
        <h1 className="text-xl font-bold">MumbaiStudent Daily Ops</h1>
        <p className="text-sm text-blue-200">
          {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 max-w-2xl">
        {activeTab === 'today' && <TodayTab />}
        {activeTab === 'schedule' && <ScheduleTab />}
        {activeTab === 'wellness' && <WellnessTab />}
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'wallet' && <WalletTab />}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEventModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="event_name">Event Name</Label>
                <Input
                  id="event_name"
                  value={eventForm.event_name}
                  onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                  placeholder="e.g., Morning Lecture"
                />
              </div>

              <div>
                <Label htmlFor="event_type">Type</Label>
                <select
                  id="event_type"
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="lecture">Lecture</option>
                  <option value="internship">Internship</option>
                  <option value="social">Social</option>
                  <option value="personal">Personal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={eventForm.start_time.slice(0, 16)}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value + ':00+05:30' })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={eventForm.end_time.slice(0, 16)}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value + ':00+05:30' })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="e.g., Churchgate"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={eventForm.priority}
                  onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Add notes about this event..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveEvent} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </Button>
                <Button
                  onClick={() => setShowEventModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ride Booking Modal */}
      {showRideBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Book a Ride</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowRideBooking(false)
                    setAvailableRides([])
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ride_origin">Pickup Location</Label>
                <Input
                  id="ride_origin"
                  value={rideOrigin}
                  onChange={(e) => setRideOrigin(e.target.value)}
                  placeholder="e.g., Andheri Station"
                />
              </div>

              <div>
                <Label htmlFor="ride_destination">Drop Location</Label>
                <Input
                  id="ride_destination"
                  value={rideDestination}
                  onChange={(e) => setRideDestination(e.target.value)}
                  placeholder="e.g., Churchgate"
                />
              </div>

              <Button
                onClick={handleSearchRides}
                disabled={loading || !rideOrigin || !rideDestination}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Car className="w-4 h-4 mr-2" />}
                Search Rides
              </Button>

              {availableRides.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">Available Rides</h3>
                  {availableRides.map((ride, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                      onClick={() => handleBookRide(ride)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {ride.provider === 'rapido' ? (
                            <Bike className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Car className="w-5 h-5 text-black" />
                          )}
                          <div>
                            <p className="font-semibold text-sm capitalize">{ride.provider}</p>
                            <p className="text-xs text-gray-600">{ride.vehicleType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            <IndianRupee className="w-4 h-4 inline" />
                            {ride.price}
                          </p>
                          <p className="text-xs text-gray-600">{ride.eta}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{ride.distance}</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-600 text-center">
                    Payment will be auto-deducted from your wallet (Balance: <IndianRupee className="w-3 h-3 inline" />{walletBalance})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wallet Top-up Modal */}
      {showWalletTopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Up Wallet</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowWalletTopup(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topup_amount">Enter Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <Input
                    id="topup_amount"
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="500"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    onClick={() => setTopupAmount(amount.toString())}
                  >
                    <IndianRupee className="w-3 h-3 mr-1" />
                    {amount}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleWalletTopup}
                disabled={!topupAmount}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Add Money
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subject Preferences Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSubjectModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject_name">Subject Name</Label>
                <Input
                  id="subject_name"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g., Advanced Mathematics"
                />
              </div>

              <div>
                <Label htmlFor="professor_name">Professor Name (Optional)</Label>
                <Input
                  id="professor_name"
                  value={subjectForm.professor}
                  onChange={(e) => setSubjectForm({ ...subjectForm, professor: e.target.value })}
                  placeholder="e.g., Dr. Sharma"
                />
              </div>

              <div>
                <Label htmlFor="subject_color">Color Theme</Label>
                <select
                  id="subject_color"
                  value={subjectForm.color}
                  onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                  <option value="pink">Pink</option>
                  <option value="indigo">Indigo</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSubject} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </Button>
                <Button
                  onClick={() => setShowSubjectModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="container mx-auto max-w-2xl">
          <div className="grid grid-cols-5 gap-1">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex flex-col items-center py-3 px-1 transition-colors ${
                activeTab === 'today' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Today</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex flex-col items-center py-3 px-1 transition-colors ${
                activeTab === 'schedule' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab('wellness')}
              className={`flex flex-col items-center py-3 px-1 transition-colors ${
                activeTab === 'wellness' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Heart className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Wellness</span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex flex-col items-center py-3 px-1 transition-colors ${
                activeTab === 'wallet' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Wallet className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Wallet</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center py-3 px-1 transition-colors ${
                activeTab === 'chat' ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
