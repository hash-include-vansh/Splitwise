'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import type { GroupMember } from '@/lib/types'

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
  const recognitionRef = useRef<SpeechRecognition | null>(null)

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

  const startListening = async () => {
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
                  alert('Speech recognition service is not available. Please ensure you have internet connection and try again. If using iPhone, make sure you are using Chrome browser.')
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
          alert('Speech recognition service is not available. Please try using Chrome browser.')
        } else {
          alert('Could not start voice recognition. Please check your browser permissions.')
        }
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Check if speech recognition is supported
  const isSupported =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition)

  if (!isSupported) {
    return null // Don't show button if not supported
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
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        } shadow-sm hover:shadow-md active:scale-95`}
        title={isListening ? 'Stop recording' : 'Record voice command'}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
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
      {(isListening || displayText) && (
        <div className="w-full max-w-md rounded-xl border-2 border-gray-300 bg-white p-4 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isListening ? 'animate-pulse bg-red-500' : 'bg-gray-400'}`} />
            <span className="text-xs font-semibold text-gray-600">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Transcription'}
            </span>
          </div>
          <div className="min-h-[40px] text-sm text-gray-800">
            {displayText ? (
              <p className="whitespace-pre-wrap">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-400 italic">{interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-gray-400 italic">Speak your expense command...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
