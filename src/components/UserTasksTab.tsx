import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RetroCard } from './RetroCard';
import { RetroButton } from './RetroButton';
import { ClipboardList, Upload, CheckCircle, Clock, XCircle, Gift } from 'lucide-react';

export const UserTasksTab: React.FC = () => {
  const { currentUser, tasks, apiSubmitTask, refreshTasks } = useApp();
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const myTasks = (tasks || []).filter(t => t.assignedTo === currentUser.id);
  const approvedCount = myTasks.filter(t => t.status === 'approved').length;
  const totalEarned = myTasks.filter(t => t.status === 'approved').reduce((s, t) => s + t.rewardAmount, 0);

  const handleSubmit = async (taskId: string) => {
    if (!screenshotUrl.trim()) { alert('Please paste a screenshot URL or proof link'); return; }
    setLoading(true);
    try { await apiSubmitTask(taskId, screenshotUrl); setScreenshotUrl(''); setActiveTaskId(null); } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <span className="bg-green-400 text-black px-3 py-1 font-bold text-sm">{approvedCount} approved</span>
        <span className="bg-purple-400 text-black px-3 py-1 font-bold text-sm">$ {totalEarned} earned</span>
        <RetroButton variant="secondary" size="sm" onClick={() => refreshTasks()}>↻ Refresh</RetroButton>
      </div>

      <RetroCard title="My Tasks" color="cyan">
        {myTasks.length === 0 ? (
          <div className="text-center py-12"><ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400 text-lg">No tasks assigned yet.</p></div>
        ) : (
          <div className="space-y-4">
            {myTasks.map(task => (
              <div key={task.id} className={`bg-gray-900 border-4 p-4 ${task.status === 'approved' ? 'border-green-400' : task.status === 'submitted' ? 'border-blue-400' : task.status === 'rejected' ? 'border-red-400' : 'border-yellow-400'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div><h3 className="text-xl font-bold text-cyan-400">{task.title}</h3></div>
                  <div className="text-right">
                    <span className={`px-3 py-1 font-bold text-xs inline-flex items-center gap-1 ${task.status === 'pending' ? 'bg-yellow-400 text-black' : task.status === 'submitted' ? 'bg-blue-400 text-black' : task.status === 'approved' ? 'bg-green-400 text-black' : 'bg-red-400 text-black'}`}>
                      {task.status === 'pending' && <Clock className="w-3 h-3" />}
                      {task.status === 'submitted' && <Upload className="w-3 h-3" />}
                      {task.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                      {task.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {task.status.toUpperCase()}
                    </span>
                    <p className="text-green-400 font-bold mt-2 flex items-center justify-end gap-1"><Gift className="w-4 h-4" /> $ {task.rewardAmount}</p>
                  </div>
                </div>
                <p className="text-white mb-4 bg-black p-3 border-2 border-gray-700">{task.description}</p>

                {task.status === 'pending' && (
                  <div className="bg-black border-4 border-yellow-400 p-4">
                    {activeTaskId === task.id ? (
                      <div className="space-y-3">
                        <label className="block text-yellow-400 font-bold uppercase">Screenshot URL / Proof Link</label>
                        <input type="text" value={screenshotUrl} onChange={e => setScreenshotUrl(e.target.value)} placeholder="https://..." className="w-full bg-black border-4 border-cyan-400 text-white px-4 py-2 font-mono" />
                        <div className="flex gap-2">
                          <RetroButton variant="success" onClick={() => handleSubmit(task.id)} disabled={loading}>{loading ? 'Submitting...' : 'Submit Proof'}</RetroButton>
                          <RetroButton variant="secondary" onClick={() => { setActiveTaskId(null); setScreenshotUrl(''); }}>Cancel</RetroButton>
                        </div>
                      </div>
                    ) : (
                      <RetroButton variant="warning" onClick={() => setActiveTaskId(task.id)}>Complete Task & Submit Proof</RetroButton>
                    )}
                  </div>
                )}
                {task.status === 'submitted' && <div className="bg-blue-900 border-4 border-blue-400 p-4"><p className="text-blue-400 font-bold">⏳ Submitted — Waiting for admin review</p></div>}
                {task.status === 'approved' && <div className="bg-green-900 border-4 border-green-400 p-4"><p className="text-green-400 font-bold text-lg">✅ Approved! $ {task.rewardAmount} added to your balance!</p></div>}
                {task.status === 'rejected' && <div className="bg-red-900 border-4 border-red-400 p-4"><p className="text-red-400 font-bold">❌ Rejected: {task.rejectionReason}</p></div>}
              </div>
            ))}
          </div>
        )}
      </RetroCard>
    </div>
  );
};
