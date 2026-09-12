import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Outreach from '../models/OutReach.model.js';
import SocioLegalCounselling from '../models/SocioLegalCounselling.model.js';

async function migrate() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('Connected to DB for migration');

  const updateCaseFiles = async (Model, name) => {
    const cases = await Model.find({ 'attachedFiles.0': { $exists: true } });
    console.log(`Found ${cases.length} ${name} cases with attached files.`);

    for (const c of cases) {
      let modified = false;
      for (const f of c.attachedFiles) {
        if (!f.cloudinaryUrl && f.fileUrl && (f.fileUrl.startsWith('http://') || f.fileUrl.startsWith('https://'))) {
          f.cloudinaryUrl = f.fileUrl;
          modified = true;
        }
        const fileId = f._id?.toString() || f.publicId;
        const viewUrl = `http://localhost:3000/api/documents/view/${c._id}/${fileId}`;
        if (f.fileUrl !== viewUrl) {
          f.fileUrl = viewUrl;
          modified = true;
        }
      }
      if (modified) {
        c.markModified('attachedFiles');
        await c.save();
        console.log(`Updated case ${c._id} files to use inline view URLs.`);
      }
    }
  };

  await updateCaseFiles(Outreach, 'Outreach');
  await updateCaseFiles(SocioLegalCounselling, 'SocioLegalCounselling');

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
