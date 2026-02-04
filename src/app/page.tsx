"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTeamMembers, useProjects, useStats, useActivities } from '@/lib/hooks'
import { useAuth } from '@/lib/auth'
import { TeamMember, Project } from '@/lib/supabase'

type DocTab = 'overview' | 'soul' | 'agents' | 'tools'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth(true)
  const { members, loading: membersLoading } = useTeamMembers()
  const { projects, loading: projectsLoading } = useProjects()
  const { stats, loading: statsLoading } = useStats()
  const { activities } = useActivities(5)
  
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [docTab, setDocTab] = useState<DocTab>('overview')

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background-primary flex items-center justify-center">
        <p className="text-white/60">Loading...</p>
      </main>
    )
  }

  if (!user) return null

  const loading = membersLoading || projectsLoading || statsLoading

  const openChat = (name: string) => {
    router.push(`/chat/${name.toLowerCase()}`)
  }
  
  return (
    <main className="min-h-screen bg-background-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">🎯 Mission Control</h1>
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm">{user.email}</span>
            <button onClick={signOut} className="text-white/40 hover:text-white text-sm transition-colors">
              Sign out
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active', value: loading ? '...' : stats.active.toString(), color: 'text-blue-400' },
            { label: 'Blocked', value: loading ? '...' : stats.blocked.toString(), color: 'text-red-400' },
            { label: 'Done', value: loading ? '...' : stats.done.toString(), color: 'text-green-400' },
            { label: 'Cost Today', value: loading ? '...' : `$${stats.todayCost.toFixed(2)}`, color: 'text-white' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm">{stat.label}</p>
              <p className={"text-2xl font-bold " + stat.color}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Team Status */}
        <div className="mb-8">
          <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4">Team Status</h2>
          <div className="flex gap-4">
            {membersLoading ? (
              <div className="text-white/40">Loading team...</div>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => { setSelectedMember(member); setSelectedProject(null); setDocTab('overview') }}
                  className={"bg-white/5 rounded-xl p-4 border text-center cursor-pointer transition-all hover:bg-white/10 " + 
                    (selectedMember?.id === member.id ? 'border-accent ring-1 ring-accent' : 'border-white/10')}
                >
                  <div className="text-2xl mb-1">{member.emoji}</div>
                  <div className="text-white text-sm">{member.name}</div>
                  <div className={"text-xs " + (
                    member.status === 'active' ? 'text-green-400' : 
                    member.status === 'idle' ? 'text-yellow-400' : 'text-white/40'
                  )}>
                    {member.status === 'active' ? '●' : '○'} {member.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Projects List */}
          <div className="col-span-2">
            <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4">Projects</h2>
            {projectsLoading ? (
              <div className="text-white/40">Loading projects...</div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => { setSelectedProject(project); setSelectedMember(null) }}
                    className={"bg-white/5 rounded-xl p-4 border flex items-center justify-between cursor-pointer transition-all hover:bg-white/10 " +
                      (selectedProject?.id === project.id ? 'border-accent ring-1 ring-accent' : 'border-white/10')}
                  >
                    <div>
                      <span className="text-white font-medium">{project.name}</span>
                      <span className="text-white/40 text-sm ml-4">
                        {project.owner?.emoji} {project.owner?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-sm">{project.done_count}/{project.task_count}</span>
                      <span className={"px-2 py-0.5 rounded text-xs " + (
                        project.priority === 'high' || project.priority === 'critical' 
                          ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                      )}>{project.priority}</span>
                      <span className={"px-2 py-0.5 rounded text-xs " + (
                        project.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                        project.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                        project.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                        project.status === 'done' ? 'bg-green-500/20 text-green-400' :
                        'bg-white/10 text-white/60'
                      )}>{project.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Activity */}
            <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4 mt-8">Recent Activity</h2>
            <div className="space-y-2">
              {activities.length === 0 ? (
                <div className="text-white/40 text-sm">No recent activity</div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2">
                      <span>{activity.team_member?.emoji}</span>
                      <span className="text-white text-sm">{activity.team_member?.name}</span>
                      <span className="text-white/40 text-sm">{activity.action}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="col-span-1">
            {selectedMember && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-4xl mb-2">{selectedMember.emoji}</div>
                    <h3 className="text-white text-xl font-bold">{selectedMember.name}</h3>
                    <p className="text-white/60 text-sm">{selectedMember.role}</p>
                  </div>
                  <div className={"px-2 py-0.5 rounded text-xs " + (
                    selectedMember.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                    selectedMember.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-white/10 text-white/40'
                  )}>{selectedMember.status}</div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b border-white/10 pb-2">
                  {(['overview', 'soul', 'agents', 'tools'] as DocTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDocTab(tab)}
                      className={"px-3 py-1 rounded text-xs transition-colors " + (
                        docTab === tab 
                          ? 'bg-accent text-black' 
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                  {docTab === 'overview' && (
                    <div>
                      {selectedMember.last_activity && (
                        <div className="mb-4">
                          <p className="text-white/40 text-xs uppercase mb-1">Last Active</p>
                          <p className="text-white text-sm">{new Date(selectedMember.last_activity).toLocaleString()}</p>
                        </div>
                      )}
                      <p className="text-white/40 text-sm">
                        Click the tabs above to view {selectedMember.name}&apos;s documentation.
                      </p>
                    </div>
                  )}
                  {docTab === 'soul' && (
                    <div className="text-white/80 text-sm whitespace-pre-wrap font-mono">
                      {selectedMember.soul_md || 'No SOUL.md available'}
                    </div>
                  )}
                  {docTab === 'agents' && (
                    <div className="text-white/80 text-sm whitespace-pre-wrap font-mono">
                      {selectedMember.agents_md || 'No AGENTS.md available'}
                    </div>
                  )}
                  {docTab === 'tools' && (
                    <div className="text-white/80 text-sm whitespace-pre-wrap font-mono">
                      {selectedMember.tools_md || 'No TOOLS.md available'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button 
                  onClick={() => openChat(selectedMember.name)}
                  className="w-full mt-4 bg-accent hover:bg-accent/80 text-black font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Open Chat
                </button>
              </div>
            )}
            {selectedProject && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="text-white text-xl font-bold mb-1">{selectedProject.name}</h3>
                <p className="text-white/60 text-sm mb-2">{selectedProject.owner?.emoji} {selectedProject.owner?.name}</p>
                {selectedProject.description && (
                  <p className="text-white/40 text-sm mb-4">{selectedProject.description}</p>
                )}
                <div className="flex gap-2 mb-4">
                  <span className={"px-2 py-0.5 rounded text-xs " + (
                    selectedProject.priority === 'high' || selectedProject.priority === 'critical'
                      ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                  )}>{selectedProject.priority}</span>
                  <span className={"px-2 py-0.5 rounded text-xs " + (
                    selectedProject.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    selectedProject.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                    selectedProject.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedProject.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    'bg-white/10 text-white/60'
                  )}>{selectedProject.status}</span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/40 text-xs uppercase mb-2">Progress</p>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all" 
                      style={{width: selectedProject.task_count ? `${(selectedProject.done_count || 0) / selectedProject.task_count * 100}%` : '0%'}}
                    />
                  </div>
                  <p className="text-white text-sm">{selectedProject.done_count || 0} of {selectedProject.task_count || 0} tasks done</p>
                </div>
                <button className="w-full mt-4 bg-accent hover:bg-accent/80 text-black font-medium py-2 px-4 rounded-lg transition-colors">
                  View Tasks
                </button>
              </div>
            )}
            {!selectedMember && !selectedProject && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
                <p className="text-white/40">Select a team member or project</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
