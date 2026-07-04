import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RetroCard } from './RetroCard';
import { RetroButton } from './RetroButton';
import { RetroInput } from './RetroInput';

export const TasksTab: React.FC = () => {
  const { tasks, users, apiCreateTask, apiReviewTask, refreshTasks } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', rewardAmount: '', assignedTo: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.title || !formData.description || !formData.rewardAmount) return;
    setLoading(true); setError('');
    try {
      await apiCreateTask({ title: formData.title, description: formData.description, reward_amount: parseFloat(formData.rewardAmount), assigned_to: formData.assignedTo || undefined });
      setFormData({ title: '', description: '', rewardAmount: '', assignedTo: '' });
      setShowCreate(false);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleReview = async (id: string, status: string) => {
    setLoading(true);
    try { await apiReviewTask(id, status); } catch { /* ignore */ } finally { setLoading(false); }
  };

  const pendingCount = (tasks || []).filter(t => t.status === 'submitted').length;

  return (
    <RetroCard title="📋 Task Manager" color="cyan">
      <div className="flex gap-2 mb-4">
        <RetroButton variant="success" size="sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ Create Task'}</RetroButton>
        <span className="bg-yellow-400 text-black px-3 py-1 font-bold text-sm">{pendingCount} pending review</span>
        <RetroButton variant="secondary" size="sm" onClick={() => refreshTasks()}>↻ Refresh</RetroButton>
      </div>
      {error && <div className="bg-red-500 border-4 border-red-700 text-black p-3 font-bold mb-4">{error}</div>}

      {showCreate && (
        <div className="bg-black border-4 border-cyan-400 p-4 mb-4 space-y-3">
          <RetroInput label="Title *" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
          <div><label className="block text-cyan-400 font-bold mb-1 text-xs uppercase">Description *</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-black border-4 border-cyan-400 text-white px-3 py-2 font-mono text-sm focus:outline-none" /></div>
          <RetroInput label="Reward ($) *" type="number" value={formData.rewardAmount} onChange={e => setFormData({ ...formData, rewardAmount: e.target.value })} />
          <div><label className="block text-cyan-400 font-bold mb-1 text-xs uppercase">Assign To (optional)</label>
            <select value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} className="w-full bg-black border-4 border-cyan-400 text-white px-4 py-2 font-mono">
              <option value="">All users</option>
              {(users || []).filter(u => !u.isAdmin).map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select></div>
          <RetroButton variant="success" onClick={handleCreate} disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</RetroButton>
        </div>
      )}

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {(tasks || []).length === 0 ? <p className="text-gray-400 text-center py-8">No tasks yet.</p> :
          (tasks || []).map(task => {
            const user = (users || []).find(u => u.id === task.assignedTo);
            return (
              <div key={task.id} className={`bg-black border-4 p-3 ${task.status === 'submitted' ? 'border-yellow-400' : task.status === 'approved' ? 'border-green-400' : task.status === 'rejected' ? 'border-red-400' : 'border-gray-700'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-cyan-400 font-bold">{task.title}</h4>
                    <p className="text-gray-400 text-xs">{user?.name || 'Unknown'} · $ {task.rewardAmount}</p>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className={`px-2 py-0.5 text-xs font-bold ${task.status === 'submitted' ? 'bg-yellow-400 text-black' : task.status === 'approved' ? 'bg-green-400 text-black' : task.status === 'rejected' ? 'bg-red-400 text-black' : 'bg-gray-600 text-white'}`}>{task.status.toUpperCase()}</span>
                    {task.status === 'submitted' && <>
                      <RetroButton size="sm" variant="success" onClick={() => handleReview(task.id, 'approved')} disabled={loading}>✓</RetroButton>
                      <RetroButton size="sm" variant="danger" onClick={() => handleReview(task.id, 'rejected')} disabled={loading}>✕</RetroButton>
                    </>}
                  </div>
                </div>
                {task.screenshotUrl && <a href={task.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs underline mt-1 inline-block">📷 Proof</a>}
              </div>
            );
          })
        }
      </div>
    </RetroCard>
  );
};
