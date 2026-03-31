import { createClient } from '@/lib/supabase/server'
import { getLatestWeek } from '@/lib/queries/weeks'
import { getMemberSubmissionForWeek } from '@/lib/queries/scores'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [week, announcements] = await Promise.all([
    getLatestWeek(),
    supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => r.data ?? []),
  ])

  const submission = week ? await getMemberSubmissionForWeek(user.id, week.id) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">
          {week ? `Current week: ${week.label}` : 'No active week yet.'}
        </p>
      </div>

      {/* Score summary */}
      <div className="grid gap-4 sm:grid-cols-1">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm font-medium text-gray-500">This Week&apos;s Points</p>
            <p className="mt-1 text-3xl font-bold text-blue-700">{submission?.points ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Announcements</h2>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100">
              {announcements.map((a) => (
                <li key={a.id} className="py-4">
                  <p className="font-medium text-gray-800">{a.title}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{a.body}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!submission && announcements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No scores recorded yet for this week.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
