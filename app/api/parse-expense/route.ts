import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { getGroupDetails } from '@/lib/services/groups'

interface ExpenseParseRequest {
  text: string
  members: Array<{ id: string; name?: string; email?: string }>
  currentUserId: string
  groupId: string
  groupName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ExpenseParseRequest = await request.json()
    const { text, members, currentUserId, groupId, groupName } = body

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Fetch additional group metadata for better context
    interface GroupMetadata {
      groupName?: string
      groupId?: string
      totalMembers?: number
      createdBy?: string
    }
    
    let groupMetadata: GroupMetadata = {}
    try {
      const supabase = await createClient()
      const { data: group } = await getGroupDetails(groupId)
      
      if (group) {
        groupMetadata = {
          groupName: group.name,
          groupId: group.id,
          totalMembers: group.members.length,
          createdBy: 'Unknown', // created_by_user not available in getGroupDetails return type
        }
      }
    } catch (error) {
      console.error('Error fetching group metadata:', error)
      // Continue without metadata if fetch fails
    }

    // Initialize Gemini - will try multiple models in order
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // Create a better member mapping for the LLM
    const memberMapWithIds = members.map((m) => ({
      id: m.id,
      name: m.name || m.email?.split('@')[0] || '',
      email: m.email || '',
    }))

    // Find current user details
    const currentUser = memberMapWithIds.find((m) => m.id === currentUserId)
    const currentUserName = currentUser?.name || currentUser?.email || 'Current User'

    const memberListFormatted = memberMapWithIds
      .map((m, idx) => {
        const isCurrentUser = m.id === currentUserId
        return `${idx + 1}. Name: "${m.name}", Email: "${m.email}", ID: "${m.id}"${isCurrentUser ? ' (Current User - You)' : ''}`
      })
      .join('\n')

    // Create a map for validation
    const memberIdMap = new Map(memberMapWithIds.map((m) => [m.id, m]))

    const prompt = `You are an expense parsing assistant for a group expense splitting application. Parse the following natural language expense command into structured JSON.

=== GROUP CONTEXT ===
Group Name: ${groupName || groupMetadata.groupName || 'Unknown Group'}
Group ID: ${groupId}
Total Members: ${members.length}
Created By: ${groupMetadata.createdBy || 'Unknown'}
Current User: ${currentUserName} (ID: ${currentUserId})

=== GROUP MEMBERS ===
${memberListFormatted}

=== USER COMMAND ===
"${text}"

=== YOUR TASK ===
Parse the command and extract the following information:

1. **Description**: A short, concise description of the expense (1-3 words, e.g., "Restaurant bill", "Uber ride", "Coffee", "Groceries")

2. **Amount**: The expense amount in rupees (extract just the number, e.g., 500 from "Rs.500", "₹500", "500 rupees", "500 Rs", "five hundred rupees")

3. **Paid By**: The user ID of the person who paid for this expense
   - If mentioned explicitly (e.g., "I paid", "Vansh paid", "paid by me"), match the name/email to the member ID
   - If not mentioned, default to currentUserId: "${currentUserId}"
   - Match names case-insensitively and partially (e.g., "Vibhor" matches "Vibhor Kumar", "vibhor")

4. **Split Type**: One of "equal", "unequal", "percentage", or "shares"
   - Default to "equal" if not specified
   - Use "unequal" if specific amounts are mentioned for different people
   - Use "percentage" if percentages are mentioned
   - Use "shares" if shares/portions are mentioned

5. **Included Members**: Array of user IDs to include in the split
   - By default, include ALL members EXCEPT explicitly excluded ones
   - If specific people are mentioned (e.g., "split between Vansh and Vibhor"), only include those
   - Always include the person who paid (paid_by) unless explicitly excluded

6. **Excluded Members**: Array of user IDs to exclude from the split
   - Look for exclusion keywords: "except", "without", "excluding", "not including", "don't include"
   - Match names case-insensitively and partially
   - Example: "except Vibhor" → exclude Vibhor's user ID

7. **Amounts/Percentages/Shares**: Only include if split type requires them
   - For "unequal": { "user-id": amount }
   - For "percentage": { "user-id": percentage (0-100) }
   - For "shares": { "user-id": share_number }

=== MATCHING RULES ===
- Match member names/emails case-insensitively
- Partial matching is allowed (e.g., "Vibhor" matches "Vibhor Kumar", "Vibhor Singh")
- If multiple members match a name, prefer exact matches, then partial matches
- If a name cannot be matched, ignore that part of the command

=== EXAMPLES ===
Command: "Add this Rs.500 restaurant bill for everyone to be split equally except Vibhor"
→ {
  "description": "Restaurant bill",
  "amount": 500,
  "paid_by": "${currentUserId}",
  "split_type": "equal",
  "included_members": [all member IDs except Vibhor's],
  "excluded_members": [Vibhor's user ID],
  "amounts": null,
  "percentages": null,
  "shares": null
}

Command: "I paid ₹1000 for groceries, split it 60-40 between me and Vansh"
→ {
  "description": "Groceries",
  "amount": 1000,
  "paid_by": "${currentUserId}",
  "split_type": "percentage",
  "included_members": [currentUserId, Vansh's ID],
  "excluded_members": [all other members],
  "amounts": null,
  "percentages": { "${currentUserId}": 60, "vansh-id": 40 },
  "shares": null
}

=== OUTPUT FORMAT ===
Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, no backticks, no explanations):
{
  "description": "short description",
  "amount": 500,
  "paid_by": "user-id-here",
  "split_type": "equal",
  "included_members": ["user-id-1", "user-id-2"],
  "excluded_members": ["user-id-3"],
  "amounts": null,
  "percentages": null,
  "shares": null
}

Important: Return ONLY the JSON object, nothing else.`

    let responseText: string | undefined
    let lastError: any = null
    
    // First, try to list available models to see what we have access to
    let availableModelNames: string[] = []
    try {
      // Use the REST client to list models
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
      if (response.ok) {
        const data = await response.json()
        availableModelNames = (data.models || []).map((m: any) => m.name?.replace('models/', '') || '').filter(Boolean)
        console.log('Available models:', availableModelNames)
      }
    } catch (listError) {
      console.warn('Could not list models, will try common model names:', listError)
    }
    
    // Build list of models to try - prioritize available models, then common names
    const modelsToTry = [
      ...(availableModelNames.length > 0 ? availableModelNames.slice(0, 3) : []),
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'gemini-pro-latest'
    ]
    
    // Remove duplicates
    const uniqueModels = [...new Set(modelsToTry)]
    
    for (const modelName of uniqueModels) {
      try {
        console.log(`Trying model: ${modelName}`)
        const currentModel = genAI.getGenerativeModel({ model: modelName })
        const result = await currentModel.generateContent(prompt)
        const response = await result.response
        responseText = response.text()
        console.log(`Successfully used model: ${modelName}`)
        break
      } catch (modelError: any) {
        console.error(`Model ${modelName} failed:`, modelError.message)
        lastError = modelError
        // Continue to next model
        continue
      }
    }
    
    if (!responseText) {
      throw new Error(
        `All models failed. Last error: ${lastError?.message || 'Unknown error'}. ` +
        `Available models: ${availableModelNames.length > 0 ? availableModelNames.join(', ') : 'Could not list'}. ` +
        `Please verify your API key has access to Gemini models.`
      )
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanedText = responseText.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    cleanedText = cleanedText.trim()

    let parsedData: any
    try {
      parsedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse JSON response:', cleanedText)
      return NextResponse.json(
        {
          error: 'Failed to parse AI response. Please try again.',
          data: null,
        },
        { status: 500 }
      )
    }

    // Validate and normalize the response
    const finalResult = {
      description: parsedData.description || 'Expense',
      amount: parseFloat(parsedData.amount) || 0,
      paid_by: parsedData.paid_by || currentUserId,
      split_type: parsedData.split_type || 'equal',
      included_members: Array.isArray(parsedData.included_members) 
        ? parsedData.included_members.filter((id: string) => memberIdMap.has(id))
        : [],
      excluded_members: Array.isArray(parsedData.excluded_members)
        ? parsedData.excluded_members.filter((id: string) => memberIdMap.has(id))
        : [],
      amounts: parsedData.amounts || null,
      percentages: parsedData.percentages || null,
      shares: parsedData.shares || null,
    }

    // Ensure included_members defaults to all members except excluded ones if empty
    if (finalResult.included_members.length === 0) {
      finalResult.included_members = memberMapWithIds
        .filter((m) => !finalResult.excluded_members.includes(m.id))
        .map((m) => m.id)
    }

    // Ensure paid_by is included in included_members
    if (!finalResult.included_members.includes(finalResult.paid_by)) {
      finalResult.included_members.push(finalResult.paid_by)
    }

    return NextResponse.json({ data: finalResult, error: null })
  } catch (error: any) {
    console.error('Error parsing expense:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to parse expense',
        data: null,
      },
      { status: 500 }
    )
  }
}
