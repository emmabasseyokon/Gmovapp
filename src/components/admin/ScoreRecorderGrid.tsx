'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Week, Profile, Submission } from '@/types/database.types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface Props {
  week: Week
  members: Profile[]
  initialSubmissions: Submission[]
}

type PointMap = Record<string, { points: string; note: string }>

export function ScoreRecorderGrid({ week, members, initialSubmissions }: Props) {
  const supabase = createClient()

  const [values, setValues] = useState<PointMap>(() => {
    const map: PointMap = {}
    for (const s of initialSubmissions) {
      map[s.member_id] = { points: String(s.points), note: s.note ?? '' }
    }
    return map
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(memberId: string, field: 'points' | 'note', value: string) {
    setSaved(false)
    setValues(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId] ?? { points: '', note: '' }, [field]: value },
    }))
  }

  async function saveAll() {
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const upserts = members
      .filter(m => values[m.id]?.points !== '' && values[m.id]?.points !== undefined)
      .map(m => ({
        week_id: week.id,
        member_id: m.id,
        points: Number(values[m.id].points) || 0,
        note: values[m.id].note || null,
        recorded_by: user?.id ?? null,
      }))

    if (upserts.length === 0) {
      setSaving(false)
      return
    }

    const { error: err } = await supabase
      .from('submissions')
      .upsert(upserts, { onConflict: 'week_id,member_id' })

    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  const totalRecorded = members.filter(m => values[m.id]?.points !== '' && values[m.id] !== undefined).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record Scores</h1>
          <p className="mt-1 text-sm text-gray-500">{week.label}</p>
        </div>
        {week.is_locked ? (
          <Badge variant="danger">Week Locked — Read Only</Badge>
        ) : (
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">Saved!</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
            <Button onClick={saveAll} loading={saving}>Save All</Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{totalRecorded} of {members.length} members scored</span>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">Enter each member&apos;s point total for this week. Leave blank to skip.</p>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-gray-100">
            {members.map((member, idx) => {
              const val = values[member.id] ?? { points: '', note: '' }
              const hasScore = val.points !== ''
              return (
                <li key={member.id} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  {/* Rank / index */}
                  <span className="hidden w-6 shrink-0 text-sm text-gray-400 sm:block">{idx + 1}</span>

                  {/* Name */}
                  <span className="flex-1 font-medium text-gray-800">{member.full_name}</span>

                  {/* Note input */}
                  <input
                    type="text"
                    disabled={week.is_locked}
                    value={val.note}
                    onChange={e => handleChange(member.id, 'note', e.target.value)}
                    placeholder="Note (optional)"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 sm:w-48"
                  />

                  {/* Points input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={week.is_locked}
                      value={val.points}
                      onChange={e => handleChange(member.id, 'points', e.target.value)}
                      placeholder="0"
                      className={`w-24 rounded-lg border px-3 py-1.5 text-right text-sm font-semibold focus:outline-none disabled:bg-gray-100 ${
                        hasScore
                          ? 'border-blue-400 bg-blue-50 text-blue-700 focus:border-blue-500'
                          : 'border-gray-200 text-gray-700 focus:border-blue-500'
                      }`}
                    />
                    <span className="text-xs text-gray-400">pts</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {!week.is_locked && (
        <div className="flex justify-end">
          <Button onClick={saveAll} loading={saving} size="lg">Save All</Button>
        </div>
      )}
    </div>
  )
}
