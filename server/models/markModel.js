import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const marksFilePath = join(__dirname, '..', 'data', 'marks.json');

/**
 * Read all marks from JSON file
 */
async function readMarks() {
  try {
    const fileContent = await fs.readFile(marksFilePath, 'utf-8');
    const parsedMarks = JSON.parse(fileContent);
    return Array.isArray(parsedMarks) ? parsedMarks : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Write marks back to JSON file
 */
async function writeMarks(marks) {
  await fs.writeFile(marksFilePath, JSON.stringify(marks, null, 2), 'utf-8');
}

/**
 * Get all marks
 */
async function getAllMarks() {
  const marks = await readMarks();
  return marks;
}

/**
 * Create a new mark
 */
async function addMark(markData) {
  const marks = await readMarks();

  const newMark = {
    id: Date.now().toString(),
    name: markData.name,
    icon: markData.icon || 'fa-tag',
    color: markData.color || '#8b5cf6',
    createdAt: new Date().toISOString(),
  };

  marks.push(newMark);
  await writeMarks(marks);

  return newMark;
}

/**
 * Get mark by ID
 */
async function getMarkById(markId) {
  const marks = await readMarks();
  return marks.find((m) => m.id === markId) || null;
}

/**
 * Update a mark
 */
async function updateMark(markId, markData) {
  const marks = await readMarks();
  const index = marks.findIndex((m) => m.id === markId);

  if (index === -1) {
    return null;
  }

  const updatedMark = {
    ...marks[index],
    ...markData,
    id: marks[index].id,
    createdAt: marks[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  marks[index] = updatedMark;
  await writeMarks(marks);

  return updatedMark;
}

/**
 * Delete a mark
 */
async function deleteMark(markId) {
  const marks = await readMarks();
  const index = marks.findIndex((m) => m.id === markId);

  if (index === -1) {
    return null;
  }

  const deletedMark = marks[index];
  marks.splice(index, 1);
  await writeMarks(marks);

  return deletedMark;
}

export {
  getAllMarks,
  addMark,
  getMarkById,
  updateMark,
  deleteMark,
};
