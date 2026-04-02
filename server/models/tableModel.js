import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  seats: { type: Number, default: 4, min: 1 },
  status: { type: String, enum: ['available', 'occupied'], default: 'available' },
}, { timestamps: true });

tableSchema.index({ userId: 1, name: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getAllTables(userId) {
  const docs = await Table.find({ userId }).sort({ name: 1 });
  return docs.map(toPlain);
}

async function addTable(data, userId) {
  const escaped = data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existing = await Table.findOne({ userId, name: new RegExp(`^${escaped}$`, 'i') });
  if (existing) throw new Error('Table name already exists');
  const doc = await Table.create({ userId, name: data.name, seats: data.seats || 4 });
  return toPlain(doc);
}

async function updateTable(tableId, data, userId) {
  const doc = await Table.findOneAndUpdate(
    { _id: tableId, userId },
    { $set: data },
    { new: true }
  );
  return toPlain(doc);
}

async function deleteTable(tableId, userId) {
  const doc = await Table.findOneAndDelete({ _id: tableId, userId });
  return toPlain(doc);
}

export { getAllTables, addTable, updateTable, deleteTable };
