import bcryptjs from 'bcryptjs';
import User from '../models/User.model.js';

export const seedAdminUser = async () => {
  try {
    const adminUserId = 'ADM10001';
    const rawPassword = '12345678';
    const email = 'admin@alt.org';
    const userName = 'Admin';

    const hashedPassword = await bcryptjs.hash(rawPassword, 10);

    const existingAdmin = await User.findOne({ userID: adminUserId });

    if (!existingAdmin) {
      await User.create({
        userName,
        userID: adminUserId,
        password: hashedPassword,
        roles: 'ADM',
        email,
      });
      console.log(`[Seed] Created default Admin user: ${adminUserId} / ${rawPassword} (${email})`);
    } else {
      // Ensure password and role are correctly set
      existingAdmin.password = hashedPassword;
      existingAdmin.roles = 'ADM';
      existingAdmin.email = existingAdmin.email || email;
      existingAdmin.userName = existingAdmin.userName || userName;
      await existingAdmin.save();
      console.log(`[Seed] Verified and synchronized Admin user: ${adminUserId}`);
    }
  } catch (error) {
    console.error('[Seed] Error in seedAdminUser:', error.message);
  }
};

export default seedAdminUser;
