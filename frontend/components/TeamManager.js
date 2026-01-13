'use client';

import { useState, useEffect } from 'react';

export default function TeamManager() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    availability: 'available'
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/team`);
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.skills.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

      const response = await fetch(`${API_URL}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          skills: skillsArray,
          availability: formData.availability
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(prev => [...prev, data.teamMember]);
        setFormData({ name: '', skills: '', availability: 'available' });
        setShowForm(false);
      } else {
        alert('Failed to add team member');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Error adding team member');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
      const response = await fetch(`${API_URL}/team/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTeamMembers(prev => prev.filter(member => member._id !== id));
      } else {
        alert('Failed to delete team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Error deleting team member');
    }
  };

  if (loading) {
    return (
      <div className="team-manager">
        <h2>👥 Team Members</h2>
        <div className="loading">✨ Loading team...</div>
      </div>
    );
  }

  return (
    <div className="team-manager">
      <div className="team-header">
        <h2>
          <span className="team-icon">👥</span>
          Team Members ({teamMembers.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? '✕ Cancel' : '+ Add Member'}
        </button>
      </div>

      {showForm && (
        <div className="team-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label>Skills (comma-separated)</label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="frontend, react, javascript"
                required
              />
            </div>

            <div className="form-group">
              <label>Availability</label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <button type="submit" className="btn-primary">
              Add Team Member
            </button>
          </form>
        </div>
      )}

      {teamMembers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-text">
            No team members yet. Add your first team member to start assigning tasks!
          </div>
        </div>
      ) : (
        <div className="team-list">
          {teamMembers.map((member) => (
            <div key={member._id} className="team-card">
              <div className="team-card-header">
                <div>
                  <div className="team-name">{member.name}</div>
                  <div className="team-workload">
                    Workload: {member.currentWorkload || 0} tasks
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(member._id, member.name)}
                  className="btn-delete"
                  title="Remove team member"
                >
                  ×
                </button>
              </div>

              <div className="team-skills">
                {member.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="team-meta">
                <span className={`availability-badge availability-${member.availability}`}>
                  {member.availability}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
