import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Outreach from '../models/OutReach.model.js';
import SocioLegalCounselling from '../models/SocioLegalCounselling.model.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const orCases = await Outreach.find({ 'attachedFiles.0': { $exists: true } }).lean();
  console.log('Outreach cases with files:', orCases.length);
  for (const c of orCases) {
    console.log('OR Case:', c.sNo || c.slcNo, 'Files:');
    for (const f of c.attachedFiles) {
      console.log(' - Title:', f.title, 'section:', f.section, 'fileUrl:', f.fileUrl, 'publicId:', f.publicId, 'uploadedByRole:', f.uploadedByRole);
    }
  }

  const slcCases = await SocioLegalCounselling.find({ 'attachedFiles.0': { $exists: true } }).lean();
  console.log('SLC cases with files:', slcCases.length);
  for (const c of slcCases) {
    console.log('SLC Case:', c.slcNo, 'Files:');
    for (const f of c.attachedFiles) {
      console.log(' - Title:', f.title, 'section:', f.section, 'fileUrl:', f.fileUrl, 'publicId:', f.publicId, 'uploadedByRole:', f.uploadedByRole);
    }
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
