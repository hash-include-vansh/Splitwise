'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import type { GroupMember } from '@/lib/types'

// Witty loading messages organized by detected topic
const WITTY_MESSAGES: Record<string, string[]> = {
  pizza: [
    "🍕 Pizza? Great choice! Pineapple or no pineapple though?",
    "🍕 A wise person once said: pizza is always the answer",
    "🍕 Splitting pizza bills... the real challenge is splitting the last slice",
  ],
  food: [
    "🍽️ Foodies unite! Let's crunch these numbers",
    "🍽️ Good food = good mood, bad math = bad vibes. I got you!",
    "🍽️ The way to a group's heart is through shared meals (and fair splits)",
  ],
  coffee: [
    "☕ Caffeine addiction doesn't come cheap, does it?",
    "☕ Another coffee run? Your productivity thanks you",
    "☕ Fun fact: coffee is basically a tax on waking up early",
  ],
  drinks: [
    "🍻 Cheers! Let me sort out who owes what",
    "🍻 What happens at the bar stays at the bar... except the bill",
    "🍻 Splitting bar tabs: the true test of friendship",
  ],
  uber: [
    "🚗 Vroom vroom! Let me calculate that ride split",
    "🚗 Going places? At least the math won't take you for a ride",
    "🚗 Split the fare, share the journey!",
  ],
  transport: [
    "🚕 On the move! Let me figure out the damage",
    "🚕 Getting from A to B is easy. Splitting the cost? That's my job",
  ],
  groceries: [
    "🛒 Grocery run! The adulting never stops",
    "🛒 Nothing says 'responsible adults' like splitting groceries",
    "🛒 Cart full, wallet light. Let's sort this out!",
  ],
  shopping: [
    "🛍️ Retail therapy hits different when you split the bill",
    "🛍️ Shop till you drop, split till it's fair!",
  ],
  movie: [
    "🎬 Lights, camera, let me calculate that action!",
    "🎬 The real plot twist is how much movie snacks cost",
  ],
  travel: [
    "✈️ Adventure awaits! But first, let me split these costs",
    "✈️ Travel is the only thing you buy that makes you richer... except the bill",
  ],
  rent: [
    "🏠 Roof over your head? Priceless. Actually, let me check the math...",
    "🏠 Splitting rent: the cornerstone of roommate relationships",
  ],
  default: [
    "🧮 Crunching numbers faster than you can say 'who owes what'",
    "🤖 My circuits are buzzing with excitement over this expense!",
    "💸 Money talks, but I'm the one doing the math",
    "📊 Turning your words into perfectly split numbers...",
    "🎯 Precision splitting in progress. No one's getting shortchanged!",
    "🧠 My AI brain is working overtime on this one",
    "✨ Sprinkling some math magic on your expense...",
    "🔢 Converting vibes into numbers. Almost there!",
  ],
}

function getWittyMessages(transcript: string): string[] {
  const lower = transcript.toLowerCase()

  if (lower.includes('pizza')) return [...WITTY_MESSAGES.pizza, ...WITTY_MESSAGES.default]
  if (lower.includes('coffee') || lower.includes('chai') || lower.includes('tea') || lower.includes('starbucks'))
    return [...WITTY_MESSAGES.coffee, ...WITTY_MESSAGES.default]
  if (lower.includes('beer') || lower.includes('drink') || lower.includes('bar') || lower.includes('cocktail') || lower.includes('wine'))
    return [...WITTY_MESSAGES.drinks, ...WITTY_MESSAGES.default]
  if (lower.includes('uber') || lower.includes('ola') || lower.includes('cab') || lower.includes('taxi') || lower.includes('lyft'))
    return [...WITTY_MESSAGES.uber, ...WITTY_MESSAGES.default]
  if (lower.includes('bus') || lower.includes('train') || lower.includes('metro') || lower.includes('auto'))
    return [...WITTY_MESSAGES.transport, ...WITTY_MESSAGES.default]
  if (lower.includes('grocery') || lower.includes('groceries') || lower.includes('supermarket') || lower.includes('vegetables'))
    return [...WITTY_MESSAGES.groceries, ...WITTY_MESSAGES.default]
  if (lower.includes('shop') || lower.includes('mall') || lower.includes('amazon') || lower.includes('flipkart'))
    return [...WITTY_MESSAGES.shopping, ...WITTY_MESSAGES.default]
  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('breakfast') || lower.includes('biryani') || lower.includes('burger'))
    return [...WITTY_MESSAGES.food, ...WITTY_MESSAGES.default]
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film') || lower.includes('netflix'))
    return [...WITTY_MESSAGES.movie, ...WITTY_MESSAGES.default]
  if (lower.includes('flight') || lower.includes('travel') || lower.includes('trip') || lower.includes('hotel') || lower.includes('booking'))
    return [...WITTY_MESSAGES.travel, ...WITTY_MESSAGES.default]
  if (lower.includes('rent') || lower.includes('house') || lower.includes('apartment') || lower.includes('flat'))
    return [...WITTY_MESSAGES.rent, ...WITTY_MESSAGES.default]

  return WITTY_MESSAGES.default
}

interface VoiceExpenseButtonProps {
  members: GroupMember[]
  currentUserId: string
  groupId: string
  groupName?: string
  onExpenseParsed: (data: any) => void
}

export function VoiceExpenseButton({
  members,
  currentUserId,
  groupId,
  groupName,
  onExpenseParsed,
}: VoiceExpenseButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [wittyText, setWittyText] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const wittyIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const wittyIndexRef = useRef(0)

  // Check browser support on mount (client-side only to avoid hydration mismatch)
  useEffect(() => {
    const hasWebSpeech = !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    )
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined'
    setIsSupported(hasWebSpeech || hasMediaRecorder)
  }, [])

  // Cycle witty messages while processing
  useEffect(() => {
    if (isProcessing && transcript) {
      const messages = getWittyMessages(transcript)
      wittyIndexRef.current = 0
      setWittyText(messages[0] || 'Processing...')

      wittyIntervalRef.current = setInterval(() => {
        wittyIndexRef.current = (wittyIndexRef.current + 1) % messages.length
        setWittyText(messages[wittyIndexRef.current])
      }, 2500)
    } else {
      setWittyText('')
      if (wittyIntervalRef.current) {
        clearInterval(wittyIntervalRef.current)
        wittyIntervalRef.current = null
      }
    }

    return () => {
      if (wittyIntervalRef.current) {
        clearInterval(wittyIntervalRef.current)
        wittyIntervalRef.current = null
      }
    }
  }, [isProcessing, transcript])

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true // Enable interim results for real-time transcription
        recognition.lang = 'en-US'
        
        // Try to set service URI for better mobile compatibility
        // Some mobile browsers need this explicitly set
        try {
          if ('serviceURI' in recognition) {
            // Use Google's speech recognition service (default, but explicit helps on mobile)
            ;(recognition as any).serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1'
          }
        } catch (e) {
          // Ignore if serviceURI is not available
        }

        recognition.onstart = () => {
          setIsListening(true)
          setTranscript('')
          setInterimTranscript('')
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = ''
          let final = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              final += transcript + ' '
            } else {
              interim += transcript
            }
          }

          setTranscript((prev) => prev + final)
          setInterimTranscript(interim)

          // If we have final results, process them
          if (final.trim()) {
            const fullTranscript = (transcript + final).trim()
            parseAndFillExpense(fullTranscript)
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          setInterimTranscript('')
          
          if (event.error === 'no-speech') {
            alert('No speech detected. Please try again.')
          } else if (event.error === 'audio-capture') {
            alert('No microphone found. Please check your microphone settings.')
          } else if (event.error === 'not-allowed') {
            alert('Microphone permission denied. Please allow microphone access in your browser settings.')
          } else if (event.error === 'service-not-allowed') {
            // This error means the speech recognition service is not available
            // Try to provide helpful guidance
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
            
            if (isIOS && isSafari) {
              alert('Voice commands are not supported on Safari. Please use Chrome browser on iOS.')
            } else {
              alert('Speech recognition service is not available. Please ensure you have internet connection and try again. If the issue persists, check your browser settings or try Chrome browser.')
            }
          } else {
            alert(`Speech recognition error: ${event.error}. Please try again.`)
          }
        }

        recognition.onend = () => {
          setIsListening(false)
          setInterimTranscript('')
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parseAndFillExpense = async (text: string) => {
    if (!text.trim() || isProcessing) return
    
    setIsProcessing(true)
    setInterimTranscript('')
    
    try {
      // Prepare member data for API
      const memberData = members.map((m) => ({
        id: m.user_id,
        name: m.user?.name || '',
        email: m.user?.email || '',
      }))

      const response = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          members: memberData,
          currentUserId,
          groupId,
          groupName: groupName || 'Group',
        }),
      })

      const result = await response.json()

      if (result.error) {
        alert(`Error: ${result.error}`)
        setIsProcessing(false)
        return
      }

      // Call the callback with parsed data
      onExpenseParsed(result.data)
      setIsProcessing(false)
      setTranscript('')
    } catch (error: any) {
      console.error('Error parsing expense:', error)
      alert('Failed to parse expense. Please try again.')
      setIsProcessing(false)
    }
  }

  // Cloud-based recording for iOS and other unsupported browsers
  const startCloudRecording = async () => {
    try {
      // Check if we're on HTTPS (required for mobile)
      if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert('Voice commands require HTTPS. Please use the secure version of this site.')
        return
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Send to speech-to-text API
        setIsProcessing(true)
        setInterimTranscript('')
        
        try {
          const formData = new FormData()
          formData.append('audio', audioBlob)

          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          })

          const result = await response.json()

          if (result.error) {
            alert(`Speech recognition error: ${result.error}`)
            setIsProcessing(false)
            return
          }

          if (result.transcript) {
            setTranscript(result.transcript)
            parseAndFillExpense(result.transcript)
          } else {
            alert('No speech detected. Please try again.')
            setIsProcessing(false)
          }
        } catch (error: any) {
          console.error('Error in cloud speech-to-text:', error)
          alert('Failed to transcribe audio. Please try again.')
          setIsProcessing(false)
        }
      }

      setIsListening(true)
      setTranscript('')
      setInterimTranscript('Recording...')
      mediaRecorder.start()
    } catch (error: any) {
      console.error('Error starting cloud recording:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please check your device settings.')
      } else {
        alert('Could not start recording. Please check your browser permissions.')
      }
      setIsListening(false)
    }
  }

  const startListening = async () => {
    // Check if we're on iOS - use cloud recording directly
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    if (isIOS) {
      // iOS doesn't support Web Speech API, use cloud recording (AssemblyAI)
      startCloudRecording()
      return
    }

    // For all other browsers, use Web Speech API (the previous method that was working)
    if (recognitionRef.current && !isListening && !isProcessing) {
      try {
        // Check if we're on HTTPS (required for mobile)
        if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          alert('Voice commands require HTTPS. Please use the secure version of this site.')
          return
        }

        // Request microphone permission first (required for mobile)
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (permError: any) {
          if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
            alert('Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.')
            return
          } else if (permError.name === 'NotFoundError' || permError.name === 'DevicesNotFoundError') {
            alert('No microphone found. Please check your device settings.')
            return
          }
          // If it's another error, continue anyway - some browsers handle permissions differently
        }

        setTranscript('')
        setInterimTranscript('')
        
        // For mobile, we need to ensure the recognition is started in the same user gesture
        // Try starting immediately first
        try {
          recognitionRef.current.start()
        } catch (immediateError: any) {
          // If immediate start fails, try with a small delay
          // This helps with some mobile browsers that need a moment
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              try {
                recognitionRef.current.start()
              } catch (delayedError: any) {
                console.error('Error in delayed start:', delayedError)
                const errorMsg = delayedError.message || delayedError.toString()
                if (errorMsg.includes('service') || errorMsg.includes('not-allowed')) {
                  // On non-iOS, this shouldn't happen, but if it does, show error
                  alert('Speech recognition service is not available. Please try again or check your browser settings.')
                } else if (errorMsg.includes('not allowed') || errorMsg.includes('permission')) {
                  alert('Microphone permission denied. Please allow microphone access in your browser settings.')
                } else {
                  alert('Could not start voice recognition. Please try again or check your browser settings.')
                }
              }
            }
          }, 100)
        }
      } catch (error: any) {
        console.error('Error starting recognition:', error)
        if (error.message?.includes('not allowed') || error.message?.includes('permission')) {
          alert('Microphone permission denied. Please allow microphone access in your browser settings and try again.')
        } else if (error.message?.includes('service')) {
          // On non-iOS, this shouldn't happen, but if it does, show error
          alert('Speech recognition service is not available. Please try again or check your browser settings.')
        } else {
          alert('Could not start voice recognition. Please check your browser permissions.')
        }
      }
    }
  }

  const stopListening = () => {
    if (isListening) {
      // Stop Web Speech API if active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore
        }
      }
      
      // Stop cloud recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      
      setIsListening(false)
    }
  }

  // Don't render until we've checked browser support (avoids hydration mismatch)
  if (!isSupported) {
    return null
  }

  const displayText = transcript || interimTranscript || ''

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
          isListening
            ? 'bg-red-600 text-white hover:bg-red-700'
            : isProcessing
            ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
        } shadow-sm hover:shadow-md active:scale-95`}
        title={isListening ? 'Stop recording' : 'Record voice command'}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {wittyText || 'Processing...'}
          </>
        ) : isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            Stop
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Voice
          </>
        )}
      </button>

      {/* Real-time transcription display */}
      {(isListening || displayText || isProcessing) && (
        <div className="w-full max-w-md rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 shadow-lg dark:shadow-none">
          <div className="mb-2 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isListening ? 'animate-pulse bg-red-500' : isProcessing ? 'animate-pulse bg-amber-500' : 'bg-gray-400 dark:bg-gray-500'}`} />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {isListening
                ? (interimTranscript === 'Recording...' ? 'Recording...' : 'Listening...')
                : isProcessing
                ? 'Processing...'
                : 'Transcription'}
            </span>
          </div>
          <div className="min-h-[40px] text-sm text-gray-800 dark:text-gray-200">
            {isProcessing && wittyText ? (
              <p className="whitespace-pre-wrap italic text-gray-600 dark:text-gray-400 animate-pulse">
                {wittyText}
              </p>
            ) : displayText ? (
              <p className="whitespace-pre-wrap">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-400 dark:text-gray-500 italic">{interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic">Speak your expense command...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
