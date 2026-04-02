import * as tableModel from '../models/tableModel.js';

async function getTables(req, res) {
  try {
    const tables = await tableModel.getAllTables(req.user._id);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ message: 'Failed to load tables.' });
  }
}

async function createTable(req, res) {
  try {
    const { name, seats } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Table name is required.' });
    const table = await tableModel.addTable({ name: name.trim(), seats }, req.user._id);
    res.status(201).json(table);
  } catch (error) {
    if (error.message === 'Table name already exists') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error creating table:', error);
    res.status(500).json({ message: 'Failed to create table.' });
  }
}

async function updateTable(req, res) {
  try {
    const { id } = req.params;
    const updated = await tableModel.updateTable(id, req.body, req.user._id);
    if (!updated) return res.status(404).json({ message: 'Table not found.' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ message: 'Failed to update table.' });
  }
}

async function deleteTable(req, res) {
  try {
    const { id } = req.params;
    const deleted = await tableModel.deleteTable(id, req.user._id);
    if (!deleted) return res.status(404).json({ message: 'Table not found.' });
    res.json({ message: 'Table deleted.' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ message: 'Failed to delete table.' });
  }
}

export { getTables, createTable, updateTable, deleteTable };
