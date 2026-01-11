'use client'

import { useSearchParams } from 'next/navigation'
import CoursePlayer from '@/components/CoursePlayer'

export default function LearnPage() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId') || undefined
  
  return <CoursePlayer courseId={courseId} />
}
