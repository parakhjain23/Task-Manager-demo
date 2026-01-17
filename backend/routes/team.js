const express = require('express');
const router = express.Router();
const TeamMember = require('../models/TeamMember');

/**
 * POST /api/team
 * Add a new team member
 */
router.post('/', async (req, res) => {
  try {
    const { name, skills, availability } = req.body;

    if (!name || !skills) {
      return res.status(400).json({ error: 'Name and skills are required' });
    }

    const teamMember = await TeamMember.create({
      data: { name, skills, availability: availability || 'available' }
    });

    res.json({ success: true, teamMember });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

/**
 * GET /api/team
 * Get all team members
 */
router.get('/', async (req, res) => {
  try {
    const teamMembers = await TeamMember.findMany();
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

/**
 * PUT /api/team/:id
 * Update team member
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const teamMember = await TeamMember.update({
      where: { id },
      data: updates
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json(teamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

/**
 * DELETE /api/team/:id
 * Delete team member
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const teamMember = await TeamMember.delete({
      where: { id }
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json({ success: true, message: 'Team member deleted' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

module.exports = router;
