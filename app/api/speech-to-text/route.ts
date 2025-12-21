import { NextRequest, NextResponse } from 'next/server'

/**
 * Speech-to-Text API route using AssemblyAI
 * This is ONLY used as a fallback for iOS browsers that don't support Web Speech API
 * 
 * Desktop browsers use Web Speech API directly (no API key needed)
 * iOS browsers use this cloud-based solution with AssemblyAI
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get('audio') as Blob
    
    if (!audioBlob) {
      return NextResponse.json(
        { error: 'No audio file provided', transcript: null },
        { status: 400 }
      )
    }

    // Only use AssemblyAI (removed Google Cloud Speech-to-Text)
    if (!process.env.ASSEMBLYAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AssemblyAI API key not configured. Please add ASSEMBLYAI_API_KEY to your environment variables. This is only needed for iOS browsers. See README for setup instructions.',
          transcript: null 
        },
        { status: 500 }
      )
    }

    return await tryAssemblyAI(audioBlob)
  } catch (error: any) {
    console.error('Speech-to-text error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to transcribe audio',
        transcript: null,
      },
      { status: 500 }
    )
  }
}

/**
 * Fallback to AssemblyAI (free tier available)
 */
async function tryAssemblyAI(audioBlob: Blob) {
  const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
  
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('AssemblyAI API key not configured')
  }

  // Upload audio to AssemblyAI
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
    },
    body: audioBlob,
  })

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => ({}))
    throw new Error(`Failed to upload audio to AssemblyAI: ${JSON.stringify(errorData)}`)
  }

  const { upload_url } = await uploadResponse.json()

  // Start transcription
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: 'en_us',
    }),
  })

  if (!transcriptResponse.ok) {
    const errorData = await transcriptResponse.json().catch(() => ({}))
    throw new Error(`Failed to start transcription: ${JSON.stringify(errorData)}`)
  }

  const { id } = await transcriptResponse.json()

  // Poll for results (max 30 seconds)
  let transcript = ''
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: {
        authorization: ASSEMBLYAI_API_KEY,
      },
    })

    if (!statusResponse.ok) {
      throw new Error('Failed to check transcription status')
    }

    const statusData = await statusResponse.json()

    if (statusData.status === 'completed') {
      transcript = statusData.text || ''
      break
    } else if (statusData.status === 'error') {
      throw new Error(statusData.error || 'Transcription failed')
    }
  }

  if (!transcript) {
    throw new Error('Transcription timeout - no result after 30 seconds')
  }

  return NextResponse.json({
    transcript,
    error: null,
  })
}
