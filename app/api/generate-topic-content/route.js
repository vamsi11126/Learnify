import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateWithGemini, generateImageWithStableDiffusion } from '@/lib/gemini'
import fs from 'fs'
import path from 'path'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { topicId, subjectTitle, topicTitle, topicDescription, difficulty = 3 } = body

    if (!topicId || !topicTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify ownership
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*, subjects!inner(user_id)')
      .eq('id', topicId)
      .eq('subjects.user_id', user.id)
      .single()

    if (topicError || !topic) {
      return NextResponse.json({ error: 'Topic not found or access denied' }, { status: 404 })
    }

    // === FETCH USER'S API KEY ===
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('gemini_api_key, huggingface_api_key')
      .eq('id', user.id)
      .maybeSingle()

    if (userError) {
      console.error('Error fetching user data:', userError)
      // Don't fail hard
    }

    const userApiKey = userData?.gemini_api_key
    const userHfKey = userData?.huggingface_api_key
    // Fallback to system keys if user key is missing


    // === FETCH USER PROFILE FOR PERSONALIZATION ===
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('education_level, learning_goals, preferred_learning_style, occupation')
      .eq('id', user.id)
      .single()

    let personalizationContext = ''
    if (!profileError && userProfile) {
        personalizationContext = `
    PERSONALIZATION CONTEXT:
    - The student's education level is: ${userProfile.education_level || 'General Audience'}.
    - Their occupation is: ${userProfile.occupation || 'Not specified'}.
    - Their learning style is: ${userProfile.preferred_learning_style || 'General'}.
    - Their goal is: ${userProfile.learning_goals || 'To learn'}.
    
    INSTRUCTION: Adapt the explanation depth, vocabulary, and examples to match this profile. 
    - If "Visual", describe concepts using vivid imagery that asks the user to visualize diagrams (e.g., "Imagine a flow where..."). 
    - If "Kinesthetic", suggest small mental exercises or hands-on analogies.
    - If "Beginner/High School", use simple analogies. 
    - If "PhD/Advanced", use rigorous academic definitions.
    `
    }

    const contentPrompt = `You are a specialized tutor. Write a STRICTLY DETAILED educational guide for the topic: "${topicTitle}".
          
    Context: Part of a course on "${subjectTitle}".
    Difficulty: ${difficulty}/5.
    Target Audience: Student.
    ${personalizationContext}

    REQUIREMENTS:
    1. Detailed Explanation: Cover EVERY SINGLE aspect of the topic thoroughly. Do not skip small points.
    2. Structure: Use H2 (##) for main sections and H3 (###) for subsections. Use bullet points for lists.
    3. Real Life Example: Provide a concrete, detailed, and relatable real-world analogy or example.
    4. Code/Math/Chemistry: Use Markdown code blocks (\`\`\`) for computer code. Use LaTeX ($ or $$) for ALL mathematical formulas and chemical equations (e.g., $E=mc^2$, $\\text{H}_2\\text{O}$). Do NOT use code blocks for math or chemistry.
    5. Visuals: If a concept is complex and needs visualization, write a tag like this on a new line: [Generate Image: detailed description of the image]. Do this for the 2-3 most important concepts.
    6. Completeness: Do not refer to external sources. Explain it ALL here.
    7. Format: Return ONLY the content in Markdown format. Do not wrap in JSON.
    
    Topic Description: ${topicDescription || topicTitle}`

    console.log(`Generating content for topic: ${topicTitle} with Gemini`)

    const contentResponseData = await generateWithGemini([
          { role: 'system', content: 'You are an expert tutor. Provide comprehensive and exhaustive educational content.' },
          { role: 'user', content: contentPrompt }
    ], {
      apiKey: userApiKey
    })

    const contentJson = contentResponseData
    let rawContent = contentJson.choices?.[0]?.message?.content

    if (!rawContent) {
        throw new Error('AI returned empty content')
    }

    // Cleanup: Remove ```markdown wrapping if present
    rawContent = rawContent.replace(/^```markdown\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '')
    const detailedContent = rawContent.trim()

    if (!detailedContent) {
        throw new Error('AI returned empty content')
    }

    // === PROCESS IMAGE GENERATION TAGS ===
    let finalContent = detailedContent
    const imageTagRegex = /\[Generate Image: (.*?)\]/g
    const matches = [...finalContent.matchAll(imageTagRegex)]

    if (matches.length > 0) {
        console.log(`[Content] Found ${matches.length} image requests for topic ${topicId}`)
        
        // Ensure directory exists
        const publicDir = path.join(process.cwd(), 'public', 'topic-images')
        if (!fs.existsSync(publicDir)){
            fs.mkdirSync(publicDir, { recursive: true });
        }

        for (const match of matches) {
            const fullTag = match[0]
            const imagePrompt = match[1]
            try {
                // Generate Image passing user's HF key
                const base64Data = await generateImageWithStableDiffusion(imagePrompt, { apiKey: userHfKey })
                const buffer = Buffer.from(base64Data, 'base64')
                
                // Upload to Supabase Storage
                const filename = `topic-${topicId}-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`
                const { error: uploadError } = await supabase
                    .storage
                    .from('topic-images')
                    .upload(filename, buffer, {
                        contentType: 'image/png',
                        upsert: false
                    })

                if (uploadError) {
                    throw new Error(`Storage upload failed: ${uploadError.message}`)
                }

                // Get Public URL
                const { data: { publicUrl } } = supabase
                    .storage
                    .from('topic-images')
                    .getPublicUrl(filename)
                
                // Replace tag with Markdown image
                finalContent = finalContent.replace(fullTag, `\n\n![${imagePrompt}](${publicUrl})\n*AI Generated Image: ${imagePrompt}*\n`)
            } catch (imgError) {
                console.error(`[Content] Image generation failed for "${imagePrompt}":`, imgError.message)
                // Remove the tag gracefully
                finalContent = finalContent.replace(fullTag, '') 
            }
        }
    }

    // Update the topic with the new content
    const { error: updateError } = await supabase
        .from('topics')
        .update({ content: finalContent })
        .eq('id', topicId)

    if (updateError) {
        console.error('Error updating topic content:', updateError)
        throw new Error('Failed to save generated content')
    }

    return NextResponse.json({
      success: true,
      content: finalContent
    })

  } catch (error) {
    console.error('Error generating topic content:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
