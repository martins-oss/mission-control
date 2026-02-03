export default function Dashboard() {
  return (
    <main className="min-h-screen bg-background-primary p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          🎯 Mission Control
        </h1>
        
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
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Team Status */}
        <div className="mb-8">
          <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4">Team Status</h2>
          <div className="flex gap-4">
            {[
              { emoji: '🫡', name: 'Iris', status: 'active' },
              { emoji: '🔧', name: 'Max', status: 'active' },
              { emoji: '📈', name: 'Nina', status: 'idle' },
              { emoji: '💰', name: 'Blake', status: 'active' },
              { emoji: '✍️', name: 'Eli', status: 'idle' },
              { emoji: '👧', name: 'Pixel', status: 'offline' },
            ].map((member) => (
              <div key={member.name} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-2xl mb-1">{member.emoji}</div>
                <div className="text-white text-sm">{member.name}</div>
                <div className={`text-xs ${
                  member.status === 'active' ? 'text-green-400' : 
                  member.status === 'idle' ? 'text-yellow-400' : 'text-white/40'
                }`}>
                  {member.status === 'active' ? '●' : '○'} {member.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div>
          <h2 className="text-white/60 text-sm uppercase tracking-wider mb-4">Projects</h2>
          <div className="space-y-2">
            {[
              { name: 'Mission Control', owner: '🫡 Iris', status: 'active', priority: 'high' },
              { name: 'iOS App Submit', owner: '🔧 Max', status: 'blocked', priority: 'high' },
              { name: 'Series A Deck', owner: '💰 Blake', status: 'review', priority: 'high' },
              { name: 'LinkedIn Pipeline', owner: '✍️ Eli', status: 'backlog', priority: 'medium' },
            ].map((project) => (
              <div key={project.name} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{project.name}</span>
                  <span className="text-white/40 text-sm ml-4">{project.owner}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    project.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'
                  }`}>
                    {project.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    project.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    project.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                    project.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
