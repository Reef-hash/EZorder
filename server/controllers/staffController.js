import Staff from '../models/staffModel.js';

// GET /api/staff — list all staff for the authenticated owner
export async function listStaff(req, res) {
  try {
    const staff = await Staff.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    console.error('listStaff error:', err);
    res.status(500).json({ message: 'Gagal dapatkan senarai staff' });
  }
}

// POST /api/staff — create a new staff member
export async function createStaff(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama staff diperlukan' });
    }

    const staff = await Staff.create({ ownerId: req.user._id, name: name.trim() });
    res.status(201).json(staff);
  } catch (err) {
    console.error('createStaff error:', err);
    res.status(500).json({ message: 'Gagal cipta staff' });
  }
}

// DELETE /api/staff/:id — remove a staff member
export async function deleteStaff(req, res) {
  try {
    const staff = await Staff.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!staff) return res.status(404).json({ message: 'Staff tidak dijumpai' });
    res.json({ message: 'Staff dipadamkan' });
  } catch (err) {
    console.error('deleteStaff error:', err);
    res.status(500).json({ message: 'Gagal padamkan staff' });
  }
}

// PATCH /api/staff/:id/toggle — toggle active status
export async function toggleStaff(req, res) {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!staff) return res.status(404).json({ message: 'Staff tidak dijumpai' });
    staff.active = !staff.active;
    await staff.save();
    res.json(staff);
  } catch (err) {
    console.error('toggleStaff error:', err);
    res.status(500).json({ message: 'Gagal kemaskini staff' });
  }
}
