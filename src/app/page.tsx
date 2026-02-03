"use client"
import { useState } from 'react'

const teamMembers = [
  { emoji: '🫡', name: 'Iris', role: 'Orchestrator', status: 'active', lastMessage: 'Mission Control deployed to Vercel' },
  { emoji: '🔧', name: 'Max', role: 'Product Engineer', status: 'active', lastMessage: 'Waiting for Apple Developer account' },
  { emoji: '📈', name: 'Nina', role: 'Growth', status: 'idle', lastMessage: 'Ready for ASO research' },
  { emoji: '💰', name: 'Blake', role: 'Investor Relations', status: 'active', lastMessage: 'Series A deck draft in progress' },
  { emoji: '✍️', name: 'Eli', role: 'Content', status: 'idle', lastMessage: 'LinkedIn content calendar ready' },
  { emoji: '👧', name: 'Pixel', role: 'Creative Companion', status: 'offline', lastMessage: 'Waiting for setup' },
]

const projects = [
  { id: 1, name: 'Mission Control', owner: '🫡 Iris', status: 'active', priority: 'high', tasks: 12, done: 3 },
  { id: 2, name: 'iOS App Submit', owner: '🔧 Max', status: 'blocked', priority: 'high', tasks: 8, done: 6 },
  { id: 3, name: 'Series A Deck', owner: '💰 Blake', status: 'review', priority: 'high', tasks: 15, done: 10 },
  { id: 4, name: 'LinkedIn Pipeline', owner: '✍️ Eli', status: 'backlog', priority: 'medium', tasks: 6, done: 0 },
]

export default function Dashboard() {
  const [selectedMember, setSelectedMember] = useState<typeof teamMembers[0] | null>(null)
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null)
  
  return (
    <main className="min-h-screen bg-background-primary p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🎯 Mission Control</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active', value: '8', color: 'text-blue-400' },
            { label: 'Blocked', value: '1', color: 'text-red-400' },
            { label: 'Done', value: '23', color: 'text-green-400' },
            { label: 'Cost', value: '$12.40', color: 'text-white' },
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
            {teamMembers.map((member) => (
              <div 
                key={member.name} 
                onClick={() => { setSelectedMember(member); setSelectedProject(null) }}
                className={"bg-white/5 rounded-xl p-4 border text-center cursor-pointer transition-all hover:bg-white/10 " + 
                  (selectedMember?.name === member.name ? 'border-accent ring-1 ring-accent' : 'border-white/10')}
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
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Projects List */}
          <div className="col-span-2">
            <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4">Projects</h2>
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
                    <span className="text-white/40 text-sm ml-4">{project.owner}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm">{project.done}/{project.tasks}</span>
                    <span className={"px-2 py-0.5 rounded text-xs " + (
                      project.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                    )}>{project.priority}</span>
                    <span className={"px-2 py-0.5 rounded text-xs " + (
                      project.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                      project.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                      project.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-white/10 text-white/60'
                    )}>{project.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="col-span-1">
            {selectedMember && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="text-4xl mb-2">{selectedMember.emoji}</div>
                <h3 className="text-white text-xl font-bold">{selectedMember.name}</h3>
                <p className="text-white/60 text-sm mb-4">{selectedMember.role}</p>
                <div className={"inline-block px-2 py-0.5 rounded text-xs mb-4 " + (
                  selectedMember.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                  selectedMember.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400' : 
                  'bg-white/10 text-white/40'
                )}>{selectedMember.status}</div>
                <div className="border-t border-white/10 pt-4 mt-4">
                  <p className="text-white/40 text-xs uppercase mb-2">Last Activity</p>
                  <p className="text-white text-sm">{selectedMember.lastMessage}</p>
                </div>
                <button className="w-full mt-4 bg-accent hover:bg-accent/80 text-black font-medium py-2 px-4 rounded-lg transition-colors">
                  Open Chat
                </button>
              </div>
            )}
            {selectedProject && (
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <h3 className="text-white text-xl font-bold mb-1">{selectedProject.name}</h3>
                <p className="text-white/60 text-sm mb-4">{selectedProject.owner}</p>
                <div className="flex gap-2 mb-4">
                  <span className={"px-2 py-0.5 rounded text-xs " + (
                    selectedProject.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                  )}>{selectedProject.priority}</span>
                  <span className={"px-2 py-0.5 rounded text-xs " + (
                    selectedProject.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    selectedProject.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                    selectedProject.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-white/10 text-white/60'
                  )}>{selectedProject.status}</span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/40 text-xs uppercase mb-2">Progress</p>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div className="bg-accent h-2 rounded-full" style={{width: (selectedProject.done/selectedProject.tasks*100) + '%'}}></div>
                  </div>
                  <p className="text-white text-sm">{selectedProject.done} of {selectedProject.tasks} tasks done</p>
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
