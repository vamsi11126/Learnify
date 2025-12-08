'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateSM2, calculateNextReviewDate } from '@/lib/sm2'

/**
 * Update unlocked topics based on dependencies
 * Unlocks topics when all prerequisites are mastered or reviewing
 */
export async function updateUnlockedTopics(subjectId) {
  const supabase = await createClient()
  
  try {
    // Get all locked topics for this subject
    const { data: lockedTopics, error: topicsError } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('status', 'locked')

    if (topicsError) throw topicsError
    if (!lockedTopics || lockedTopics.length === 0) return { success: true }

    // For each locked topic, check if all dependencies are met
    for (const topic of lockedTopics) {
      // Get dependencies for this topic
      const { data: deps, error: depsError } = await supabase
        .from('topic_dependencies')
        .select('depends_on_topic_id')
        .eq('topic_id', topic.id)

      if (depsError) throw depsError

      // If no dependencies, unlock it
      if (!deps || deps.length === 0) {
        await supabase
          .from('topics')
          .update({ status: 'available' })
          .eq('id', topic.id)
        continue
      }

      // Check if all dependency topics are mastered or reviewing
      const dependencyIds = deps.map(d => d.depends_on_topic_id)
      const { data: dependencyTopics, error: depTopicsError } = await supabase
        .from('topics')
        .select('id, status')
        .in('id', dependencyIds)

      if (depTopicsError) throw depTopicsError

      // All dependencies must be in 'reviewing' or 'mastered' status
      const allDependenciesMet = dependencyTopics.every(
        dt => dt.status === 'reviewing' || dt.status === 'mastered'
      )

      if (allDependenciesMet) {
        await supabase
          .from('topics')
          .update({ status: 'available' })
          .eq('id', topic.id)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating unlocked topics:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Start a learning session for a topic
 */
export async function startLearningSession(topicId) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Update topic status to 'learning'
    const { error: updateError } = await supabase
      .from('topics')
      .update({ status: 'learning' })
      .eq('id', topicId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Error starting learning session:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Complete learning and transition to reviewing status
 */
export async function completeLearning(topicId, durationMinutes = 0) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get the topic to get subject_id
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('subject_id')
      .eq('id', topicId)
      .single()

    if (topicError) throw topicError

    // Update topic to reviewing status with initial SM-2 values
    const nextReviewDate = calculateNextReviewDate(1) // First review in 1 day
    
    const { error: updateError } = await supabase
      .from('topics')
      .update({
        status: 'reviewing',
        interval_days: 1,
        repetition_count: 0,
        next_review_at: nextReviewDate
      })
      .eq('id', topicId)

    if (updateError) throw updateError

    // Log the learning session
    const { error: logError } = await supabase
      .from('study_logs')
      .insert([{
        user_id: user.id,
        topic_id: topicId,
        subject_id: topic.subject_id,
        session_type: 'learning',
        duration_minutes: durationMinutes,
        quality_rating: null
      }])

    if (logError) throw logError

    // Check if this unlocks any new topics
    await updateUnlockedTopics(topic.subject_id)

    return { success: true, nextReviewDate }
  } catch (error) {
    console.error('Error completing learning:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Submit a review with quality rating and update SM-2 values
 */
export async function submitReview(topicId, quality, durationMinutes = 0) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current topic data
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single()

    if (topicError) throw topicError

    // Calculate new SM-2 values
    const sm2Result = calculateSM2(
      quality,
      topic.interval_days || 0,
      topic.repetition_count || 0,
      topic.difficulty_factor || 2.5
    )

    const nextReviewDate = calculateNextReviewDate(sm2Result.interval)

    // Determine new status based on repetition count and quality
    let newStatus = 'reviewing'
    if (sm2Result.repetition >= 3 && quality >= 4) {
      newStatus = 'mastered'
    } else if (quality < 3) {
      newStatus = 'reviewing' // Reset but keep in reviewing
    }

    // Update topic with new SM-2 values
    const { error: updateError } = await supabase
      .from('topics')
      .update({
        status: newStatus,
        interval_days: sm2Result.interval,
        repetition_count: sm2Result.repetition,
        difficulty_factor: sm2Result.efactor,
        next_review_at: nextReviewDate
      })
      .eq('id', topicId)

    if (updateError) throw updateError

    // Log the review session
    const { error: logError } = await supabase
      .from('study_logs')
      .insert([{
        user_id: user.id,
        topic_id: topicId,
        subject_id: topic.subject_id,
        session_type: 'review',
        duration_minutes: durationMinutes,
        quality_rating: quality
      }])

    if (logError) throw logError

    // Check if mastering this topic unlocks new topics
    if (newStatus === 'mastered') {
      await updateUnlockedTopics(topic.subject_id)
    }

    return {
      success: true,
      nextReviewDate,
      newStatus,
      interval: sm2Result.interval
    }
  } catch (error) {
    console.error('Error submitting review:', error)
    return { success: false, error: error.message }
  }
}
