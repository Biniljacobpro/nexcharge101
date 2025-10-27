import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { verifyFirebaseIdToken } from '../firebaseAdmin.js';
import { sendPasswordResetOtpEmail } from '../utils/emailService.js';

const sanitizeUser = (userDoc) => {
  const sanitized = {
    id: userDoc._id,
    role: userDoc.role,
    firstName: userDoc.personalInfo.firstName,
    lastName: userDoc.personalInfo.lastName,
    email: userDoc.personalInfo.email,
    phone: userDoc.personalInfo.phone,
    address: userDoc.personalInfo.address,
    profileImage: userDoc.personalInfo.profileImage,
    credentials: userDoc.credentials,
    roleSpecificData: userDoc.roleSpecificData
  };
  console.log('Sanitized user data:', { id: sanitized.id, email: sanitized.email, hasPassword: !!sanitized.credentials?.passwordHash });
  return sanitized;
};
// Update an existing vehicle by index
export const updateUserVehicleAtIndex = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user || user.role !== 'ev_user') {
      return res.status(404).json({ success: false, message: 'EV User not found' });
    }
    const { index } = req.params;
    const { make, model, year, batteryCapacity, preferredChargingType, chargingAC, chargingDC } = req.body;
    const idx = Number(index);
    const vehicles = user.roleSpecificData?.evUserInfo?.vehicles || [];
    if (Number.isNaN(idx) || idx < 0 || idx >= vehicles.length) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle index' });
    }
    if (!make || !model || !batteryCapacity) {
      return res.status(400).json({ success: false, message: 'make, model and batteryCapacity are required' });
    }

    const norm = (s) => String(s || '').trim().toLowerCase();
    const target = {
      make: String(make).trim(),
      model: String(model).trim(),
      year: typeof year === 'number' ? year : undefined,
      batteryCapacity: Number(batteryCapacity),
      preferredChargingType: preferredChargingType || undefined,
      chargingAC: chargingAC || undefined,
      chargingDC: chargingDC || undefined
    };

    // Duplicate check excluding the same index
    const duplicate = vehicles.some((v, i) => i !== idx &&
      norm(v.make) === norm(target.make) &&
      norm(v.model) === norm(target.model) &&
      (v.year || undefined) === target.year &&
      Number(v.batteryCapacity) === target.batteryCapacity
    );
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Vehicle with same details already exists' });
    }

    vehicles[idx] = target;
    user.roleSpecificData.evUserInfo.vehicles = vehicles;

    await user.save();
    return res.json({ success: true, message: 'Vehicle updated', data: vehicles });
  } catch (error) {
    console.error('Error updating user vehicle:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// List EV user's vehicles
export const getMyVehicles = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user || user.role !== 'ev_user') {
      return res.status(404).json({ success: false, message: 'EV User not found' });
    }
    const vehicles = user.roleSpecificData?.evUserInfo?.vehicles || [];
    return res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error fetching user vehicles:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Add a vehicle to EV user's list
export const addUserVehicle = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user || user.role !== 'ev_user') {
      return res.status(404).json({ success: false, message: 'EV User not found' });
    }
    const { make, model, year, batteryCapacity, preferredChargingType, chargingAC, chargingDC } = req.body;
    if (!make || !model || !batteryCapacity) {
      return res.status(400).json({ success: false, message: 'make, model and batteryCapacity are required' });
    }
    user.roleSpecificData = user.roleSpecificData || {};
    user.roleSpecificData.evUserInfo = user.roleSpecificData.evUserInfo || {};
    user.roleSpecificData.evUserInfo.vehicles = user.roleSpecificData.evUserInfo.vehicles || [];

    const norm = (s) => String(s || '').trim().toLowerCase();
    const exists = user.roleSpecificData.evUserInfo.vehicles.some(v =>
      norm(v.make) === norm(make) &&
      norm(v.model) === norm(model) &&
      (v.year || undefined) === (typeof year === 'number' ? year : undefined) &&
      Number(v.batteryCapacity) === Number(batteryCapacity)
    );
    if (exists) {
      return res.status(409).json({ success: false, message: 'Vehicle with same details already exists' });
    }

    user.roleSpecificData.evUserInfo.vehicles.push({
      make: String(make),
      model: String(model),
      year: typeof year === 'number' ? year : undefined,
      batteryCapacity: Number(batteryCapacity),
      preferredChargingType: preferredChargingType || undefined,
      chargingAC: chargingAC || undefined,
      chargingDC: chargingDC || undefined
    });
    await user.save();
    return res.status(201).json({ success: true, message: 'Vehicle added', data: user.roleSpecificData.evUserInfo.vehicles });
  } catch (error) {
    console.error('Error adding user vehicle:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Remove a vehicle by index from EV user's list
export const removeUserVehicle = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user || user.role !== 'ev_user') {
      return res.status(404).json({ success: false, message: 'EV User not found' });
    }
    const { index } = req.params;
    const idx = Number(index);
    const arr = user.roleSpecificData?.evUserInfo?.vehicles || [];
    if (Number.isNaN(idx) || idx < 0 || idx >= arr.length) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle index' });
    }
    arr.splice(idx, 1);
    user.roleSpecificData.evUserInfo.vehicles = arr;
    await user.save();
    return res.json({ success: true, message: 'Vehicle removed', data: arr });
  } catch (error) {
    console.error('Error removing user vehicle:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const signup = async (req, res) => {
	try {
		const { firstName, lastName, email, password } = req.body;
		if (!firstName || !lastName || !email || !password) return res.status(400).json({ error: 'Missing fields' });
		const existing = await User.findOne({ 'personalInfo.email': email });
		if (existing) return res.status(409).json({ error: 'Email already in use' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({
			role: 'ev_user',
			personalInfo: { firstName, lastName, email },
			credentials: { passwordHash, isActive: true },
		});
		const payload = { sub: user._id.toString(), role: user.role };
		const accessToken = signAccessToken(payload);
		const refreshToken = signRefreshToken(payload);
		return res.status(201).json({ user: sanitizeUser(user), accessToken, refreshToken });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to sign up' });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ 'personalInfo.email': email });
		if (!user || !user.credentials?.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.credentials && user.credentials.isActive === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
    }
		const match = await bcrypt.compare(password, user.credentials.passwordHash);
		if (!match) return res.status(401).json({ error: 'Invalid credentials' });
		user.credentials.lastLogin = new Date();
		await user.save();
		const payload = { sub: user._id.toString(), role: user.role };
		return res.json({ user: sanitizeUser(user), accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to login' });
	}
};

export const googleSignIn = async (req, res) => {
	try {
		const { idToken } = req.body; // Firebase ID token from frontend
		if (!idToken) return res.status(400).json({ error: 'Missing Firebase token' });
		const decoded = await verifyFirebaseIdToken(idToken);
		console.log('Google sign-in decoded:', { email: decoded.email, name: decoded.name, uid: decoded.uid });
		
		const email = decoded.email?.toLowerCase();
		const firstName = decoded.name?.split(' ')[0] || 'Nex';
		const lastName = decoded.name?.split(' ').slice(1).join(' ') || 'Charge';
		let user = await User.findOne({ 'personalInfo.email': email });
		
		if (!user) {
			console.log('Creating new Google user:', { email, firstName, lastName });
			user = await User.create({
				role: 'ev_user',
				personalInfo: { firstName, lastName, email, profileImage: decoded.picture },
				google: { googleId: decoded.uid, emailVerified: decoded.email_verified },
				credentials: { isActive: true },
			});
		} else {
			console.log('Updating existing Google user:', { email });
			// Update existing user's Google info and profile image if they don't have one
			if (!user.personalInfo.profileImage && decoded.picture) {
				user.personalInfo.profileImage = decoded.picture;
			}
			if (!user.google.googleId) {
				user.google = { googleId: decoded.uid, emailVerified: decoded.email_verified };
			}
		}
		user.credentials.lastLogin = new Date();
		await user.save();
		console.log('Google user saved successfully:', { id: user._id, email: user.personalInfo.email });
		
		const tokenPayload = { sub: user._id.toString(), role: user.role };
		return res.json({ user: sanitizeUser(user), accessToken: signAccessToken(tokenPayload), refreshToken: signRefreshToken(tokenPayload) });
	} catch (e) {
		console.error('Google sign-in error:', e);
		return res.status(401).json({ error: 'Invalid Firebase token' });
	}
};

export const me = async (req, res) => {
	try {
		const user = await User.findById(req.user.sub);
		if (!user) return res.status(404).json({ error: 'Not found' });
		return res.json({ user: sanitizeUser(user) });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch profile' });
	}
};

export const refresh = async (req, res) => {
	try {
		const { refreshToken } = req.body;
		if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });
		const payload = verifyRefreshToken(refreshToken);
		const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
		return res.json({ accessToken });
	} catch (e) {
		return res.status(401).json({ error: 'Invalid refresh token' });
	}
};

export const logout = async (_req, res) => {
	return res.json({ ok: true });
};

// Email availability check
export const checkEmailAvailability = async (req, res) => {
  try {
    const rawEmail = (req.query.email || '').toString().trim().toLowerCase();
    if (!rawEmail) return res.status(400).json({ error: 'Email is required' });

    // Basic RFC 5322-like email check (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(rawEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existing = await User.findOne({ 'personalInfo.email': rawEmail }).select('_id');
    return res.json({ available: !existing });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to check email' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, evVehicle } = req.body;
    const userId = req.user.sub;
    console.log('Profile update request:', { userId, firstName, lastName, phone, address });

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Trim and validate first name
    const trimmedFirstName = firstName.trim();
    if (trimmedFirstName.length < 2 || trimmedFirstName.length > 10) {
      return res.status(400).json({ error: 'First name must be between 2 and 10 characters' });
    }
    if (!/^[A-Za-z]+$/.test(trimmedFirstName)) {
      return res.status(400).json({ error: 'Letters only, no spaces' });
    }

    // Trim and validate last name
    const trimmedLastName = lastName.trim();
    if (trimmedLastName.length < 2 || trimmedLastName.length > 10) {
      return res.status(400).json({ error: 'Last name must be between 2 and 10 characters' });
    }
    if (!/^[A-Za-z]+$/.test(trimmedLastName)) {
      return res.status(400).json({ error: 'Letters only, no spaces' });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    if (address && address.length > 80) {
      return res.status(400).json({ error: 'Address must be less than 80 characters' });
    }

    const user = await User.findById(userId);
    console.log('Found user for profile update:', { userId, userFound: !!user, email: user?.personalInfo?.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile fields with trimmed values
    user.personalInfo.firstName = trimmedFirstName;
    user.personalInfo.lastName = trimmedLastName;
    if (phone !== undefined) user.personalInfo.phone = phone;
    if (address !== undefined) user.personalInfo.address = address;

    // Optionally set EV user vehicle info
    if (evVehicle && typeof evVehicle === 'object') {
      const { make, model, year, batteryCapacity, preferredChargingType } = evVehicle;
      user.roleSpecificData = user.roleSpecificData || {};
      user.roleSpecificData.evUserInfo = user.roleSpecificData.evUserInfo || {};
      user.roleSpecificData.evUserInfo.vehicleInfo = {
        make: make || '',
        model: model || '',
        year: typeof year === 'number' ? year : undefined,
        batteryCapacity: typeof batteryCapacity === 'number' ? batteryCapacity : undefined,
        preferredChargingType: preferredChargingType || undefined
      };
    }

    await user.save();

    // Return sanitized user data
    const sanitizedUser = {
      id: user._id,
      firstName: user.personalInfo.firstName,
      lastName: user.personalInfo.lastName,
      email: user.personalInfo.email,
      phone: user.personalInfo.phone,
      address: user.personalInfo.address,
      profileImage: user.personalInfo.profileImage,
      role: user.role,
      roleSpecificData: user.roleSpecificData
    };

    res.json({ 
      message: 'Profile updated successfully',
      user: sanitizedUser 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Update only EV user's vehicle info without requiring name fields
export const updateUserVehicle = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { make, model, year, batteryCapacity, preferredChargingType, chargingAC, chargingDC, specifications } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'ev_user') {
      return res.status(404).json({ success: false, message: 'EV User not found' });
    }

    user.roleSpecificData = user.roleSpecificData || {};
    user.roleSpecificData.evUserInfo = user.roleSpecificData.evUserInfo || {};
    // Maintain single vehicleInfo for backward compatibility
    user.roleSpecificData.evUserInfo.vehicleInfo = {
      make: make || '',
      model: model || '',
      year: typeof year === 'number' ? year : undefined,
      batteryCapacity: typeof batteryCapacity === 'number' ? batteryCapacity : undefined,
      preferredChargingType: preferredChargingType || undefined,
      chargingAC: chargingAC || undefined,
      chargingDC: chargingDC || undefined,
      specifications: specifications || undefined
    };

    // Also ensure vehicles array exists and prevent duplicates
    user.roleSpecificData.evUserInfo.vehicles = user.roleSpecificData.evUserInfo.vehicles || [];
    const norm = (s) => String(s || '').trim().toLowerCase();
    const duplicate = user.roleSpecificData.evUserInfo.vehicles.some(v =>
      norm(v.make) === norm(make) &&
      norm(v.model) === norm(model) &&
      (v.year || undefined) === (typeof year === 'number' ? year : undefined) &&
      Number(v.batteryCapacity) === (typeof batteryCapacity === 'number' ? batteryCapacity : undefined)
    );
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Vehicle with same details already exists' });
    }
    user.roleSpecificData.evUserInfo.vehicles.push({
      make: make || '',
      model: model || '',
      year: typeof year === 'number' ? year : undefined,
      batteryCapacity: typeof batteryCapacity === 'number' ? batteryCapacity : undefined,
      preferredChargingType: preferredChargingType || undefined,
    });

    await user.save();

    return res.json({ 
      success: true,
      message: 'Vehicle information updated successfully', 
      data: {
        vehicleInfo: user.roleSpecificData.evUserInfo.vehicleInfo,
        vehicles: user.roleSpecificData.evUserInfo.vehicles
      }
    });
  } catch (error) {
    console.error('Error updating EV user vehicle:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.sub;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one uppercase letter, one lowercase letter, and one number' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has a password (Google users might not)
    if (!user.credentials.passwordHash) {
      return res.status(400).json({ error: 'Password change not available for Google accounts' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.credentials.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear mustChangePassword if set
    user.credentials.passwordHash = newPasswordHash;
    if (user.credentials.mustChangePassword) {
      user.credentials.mustChangePassword = false;
    }
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const { profileImage } = req.body;
    const userId = req.user.sub;

    // If empty string provided, treat as removal
    const isRemoval = typeof profileImage === 'string' && profileImage.trim() === '';
    if (!isRemoval) {
      // When setting a URL, it must be a valid absolute URL
      if (!profileImage || typeof profileImage !== 'string') {
        return res.status(400).json({ error: 'Profile image URL is required' });
      }
      try {
        new URL(profileImage);
      } catch {
        return res.status(400).json({ error: 'Invalid profile image URL' });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update or clear profile image
    user.personalInfo.profileImage = isRemoval ? undefined : profileImage;
    await user.save();

    // Return sanitized user data
    const sanitizedUser = {
      id: user._id,
      firstName: user.personalInfo.firstName,
      lastName: user.personalInfo.lastName,
      email: user.personalInfo.email,
      phone: user.personalInfo.phone,
      address: user.personalInfo.address,
      profileImage: user.personalInfo.profileImage,
      role: user.role,
      roleSpecificData: user.roleSpecificData
    };

    res.json({ 
      message: isRemoval ? 'Profile image removed successfully' : 'Profile image updated successfully',
      user: sanitizedUser 
    });
  } catch (error) {
    console.error('Profile image update error:', error);
    res.status(500).json({ error: 'Failed to update profile image' });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.sub;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle both Cloudinary URLs and local file paths
    let imageUrl;
    if (req.file.path && (req.file.path.startsWith('http') || req.file.path.startsWith('https'))) {
      // Cloudinary URL
      imageUrl = req.file.path;
    } else {
      // Local file path
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    
    // Update profile image
    user.personalInfo.profileImage = imageUrl;
    await user.save();

    // Return sanitized user data
    const sanitizedUser = {
      id: user._id,
      firstName: user.personalInfo.firstName,
      lastName: user.personalInfo.lastName,
      email: user.personalInfo.email,
      phone: user.personalInfo.phone,
      address: user.personalInfo.address,
      profileImage: user.personalInfo.profileImage,
      role: user.role,
      roleSpecificData: user.roleSpecificData,
      credentials: user.credentials
    };

    res.json({ 
      message: 'Profile image uploaded successfully',
      user: sanitizedUser 
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
};

// ------------------ Forgot Password with 6-digit OTP ------------------
const generateSixDigitOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const requestPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ 'personalInfo.email': email.toLowerCase() });
    // For privacy, always return success, but only set OTP for existing users
    if (!user) return res.json({ message: 'If an account exists, an OTP has been sent' });

    const otp = generateSixDigitOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.credentials.resetOtpCode = otp;
    user.credentials.resetOtpExpires = expires;
    user.credentials.resetOtpAttempts = 0;
    await user.save();

    await sendPasswordResetOtpEmail({
      recipientEmail: user.personalInfo.email,
      recipientName: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`.trim(),
      otpCode: otp
    });

    return res.json({ message: 'If an account exists, an OTP has been sent' });
  } catch (error) {
    console.error('requestPasswordResetOtp error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
};

export const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const user = await User.findOne({ 'personalInfo.email': email.toLowerCase() });
    if (!user || !user.credentials.resetOtpCode) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    if (user.credentials.resetOtpAttempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }
    if (new Date() > user.credentials.resetOtpExpires) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (user.credentials.resetOtpCode !== otp) {
      user.credentials.resetOtpAttempts += 1;
      await user.save();
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // Mark OTP as verified (one-time token approach)
    user.credentials.resetOtpCode = `VERIFIED:${Date.now()}`;
    user.credentials.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.credentials.resetOtpAttempts = 0;
    await user.save();
    return res.json({ message: 'OTP verified. You can now reset your password.' });
  } catch (error) {
    console.error('verifyPasswordResetOtp error:', error);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must include upper, lower, and number' });
    }

    const user = await User.findOne({ 'personalInfo.email': email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid request' });

    // Must have verified marker
    const marker = user.credentials.resetOtpCode || '';
    if (!marker.startsWith('VERIFIED:') || new Date() > user.credentials.resetOtpExpires) {
      return res.status(400).json({ error: 'OTP not verified or has expired' });
    }

    const saltRounds = 12;
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    user.credentials.passwordHash = newHash;
    user.credentials.mustChangePassword = false;
    user.credentials.resetOtpCode = undefined;
    user.credentials.resetOtpExpires = undefined;
    user.credentials.resetOtpAttempts = 0;
    await user.save();

    return res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('resetPasswordWithOtp error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
};




