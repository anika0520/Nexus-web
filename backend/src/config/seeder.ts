import { User } from '../models/User';

export const seedAdmin = async (): Promise<void> => {
  try {
    const adminEmail = 'admin@nexus.com';
    const existing = await User.findOne({ email: adminEmail });

    if (!existing) {
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'admin123',
        role: 'ADMIN',
        avatarColor: '#7c3aed',
      });
      console.log('✅ Admin account created  →  admin@nexus.com  /  admin123');
    } else if (existing.role !== 'ADMIN') {
      // Ensure existing account has ADMIN role
      await User.findByIdAndUpdate(existing._id, { role: 'ADMIN' });
      console.log('✅ Existing account promoted to ADMIN  →  admin@nexus.com');
    } else {
      console.log('ℹ️  Admin account already exists  →  admin@nexus.com');
    }
  } catch (err) {
    console.error('⚠️  Could not seed admin account:', err);
  }
};
