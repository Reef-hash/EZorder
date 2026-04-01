import mongoose from 'mongoose';

const markSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: 'fa-tag' },
  color: { type: String, default: '#8b5cf6' },
}, { timestamps: true });

const Mark = mongoose.model('Mark', markSchema);

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function getAllMarks(userId) {
  const docs = await Mark.find({ userId });
  return docs.map(toPlain);
}

async function addMark(markData, userId) {
  const doc = await Mark.create({
    userId,
    name: markData.name,
    icon: markData.icon || 'fa-tag',
    color: markData.color || '#8b5cf6',
  });
  return toPlain(doc);
}

async function getMarkById(markId, userId) {
  const doc = await Mark.findOne({ _id: markId, userId });
  return toPlain(doc);
}

async function updateMark(markId, markData, userId) {
  const doc = await Mark.findOneAndUpdate(
    { _id: markId, userId },
    { $set: markData },
    { new: true }
  );
  return toPlain(doc);
}

async function deleteMark(markId, userId) {
  const doc = await Mark.findOneAndDelete({ _id: markId, userId });
  return toPlain(doc);
}

export {
  getAllMarks,
  addMark,
  getMarkById,
  updateMark,
  deleteMark,
};
