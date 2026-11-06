const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../data/dbStore');
const { JWT_SECRET } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, location, farmOrBusinessName, bio } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and phone number.',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db.users.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address is already registered.',
      });
    }

    // Security Check: Public registration must NEVER grant administrator privileges
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrator account registration is prohibited. Administrator accounts must be provisioned internally.',
      });
    }

    const validRoles = ['farmer', 'buyer', 'supplier', 'machinery_owner', 'transport_provider'];
    const assignedRole = validRoles.includes(role) ? role : 'buyer';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await db.users.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      role: assignedRole,
      location: {
        state: location?.state || 'Tamil Nadu',
        district: location?.district || 'Coimbatore',
        address: location?.address || '',
        pincode: location?.pincode || '',
      },
      farmOrBusinessName: farmOrBusinessName || '',
      bio: bio || '',
      status: 'active',
      requirePasswordChange: false,
    });

    const userObj = { ...user };
    delete userObj.password;

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password format.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.users.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact platform administration.',
      });
    }

    // Authenticate users ONLY through cryptographic bcrypt hash comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    // Update last login
    await db.users.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const userObj = { ...user };
    delete userObj.password;

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userObj,
      requirePasswordChange: Boolean(user.requirePasswordChange),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change authenticated user password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your current password and the new password.',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const user = await db.users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password provided is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.users.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      requirePasswordChange: false,
      passwordChangedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Your account is now secured.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await db.users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userObj = { ...user };
    delete userObj.password;
    res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location, farmOrBusinessName, bio } = req.body;

    // Disallow role or status elevation via profile update
    const updated = await db.users.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name: name.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(location && { location }),
        ...(farmOrBusinessName !== undefined && { farmOrBusinessName }),
        ...(bio !== undefined && { bio }),
      },
      { new: true }
    );

    const userObj = { ...updated };
    delete userObj.password;
    res.status(200).json({ success: true, message: 'Profile updated successfully', user: userObj });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  changePassword,
  getMe,
  updateProfile,
};
