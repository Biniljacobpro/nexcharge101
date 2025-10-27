import CorporateApplication from '../models/corporateApplication.model.js';
import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { 
  sendApprovalEmail, 
  sendRejectionEmail, 
  sendApplicationConfirmationEmail 
} from '../utils/emailService.js';

// Submit a new corporate application
export const submitApplication = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      contactPersonName,
      contactNumber,
      businessRegistrationNumber,
      additionalInfo
    } = req.body;

    // Check if application already exists for this company
    const existingApplication = await CorporateApplication.findOne({
      $or: [
        { companyEmail },
        { businessRegistrationNumber }
      ]
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'An application already exists for this company email or business registration number.'
      });
    }

    // Create new application
    const application = new CorporateApplication({
      companyName,
      companyEmail,
      contactPersonName,
      contactNumber,
      businessRegistrationNumber,
      additionalInfo
    });

    await application.save();

    // Send confirmation email to applicant
    await sendApplicationConfirmationEmail(application);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application._id,
        status: application.status,
        applicationDate: application.applicationDate
      }
    });

  } catch (error) {
    console.error('Error submitting corporate application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Get all applications (admin only)
export const getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'applicationDate', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await CorporateApplication.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviewedBy', 'firstName lastName email');

    const total = await CorporateApplication.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalApplications: total,
          hasNext: skip + applications.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching corporate applications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Get application by ID
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await CorporateApplication.findById(id)
      .populate('reviewedBy', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error fetching corporate application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Review application (approve/reject) - admin only
export const reviewApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    const adminId = req.user.sub; // From JWT token

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"'
      });
    }

    const application = await CorporateApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been reviewed'
      });
    }

    // Update application status
    application.status = status;
    application.reviewNotes = reviewNotes;
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();

    await application.save();

    if (status === 'approved') {
      // Create corporate admin user account
      const { user, password } = await createCorporateAdminUser(application);
      
      // Send approval email with login credentials
      await sendApprovalEmail(application, user, password);
    } else {
      // Send rejection email
      await sendRejectionEmail(application, reviewNotes);
    }

    res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: application
    });

  } catch (error) {
    console.error('Error reviewing corporate application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Helper function to create corporate admin user
const createCorporateAdminUser = async (application) => {
  try {
    // Generate a secure password
    const password = generateSecurePassword();
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create user with corporate_admin role
    const user = new User({
      personalInfo: {
        firstName: application.contactPersonName.split(' ')[0] || 'Corporate',
        lastName: application.contactPersonName.split(' ').slice(1).join(' ') || 'Admin',
        email: application.companyEmail,
        phone: application.contactNumber
      },
      credentials: {
        passwordHash: hashedPassword,
        lastLogin: new Date(),
        isActive: true,
        twoFactorEnabled: false
      },
      role: 'corporate_admin',
      roleSpecificData: {
        corporateAdminInfo: {
          corporateId: null, // Will be set when corporate is created
          accessLevel: 'full',
          managedFranchises: []
        }
      }
    });

    await user.save();

    console.log(`Corporate admin user created for ${application.companyName} with password: ${password}`);

    return { user, password };
  } catch (error) {
    console.error('Error creating corporate admin user:', error);
    throw error;
  }
};

// Helper function to generate secure password
const generateSecurePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

// Get application statistics (admin only)
export const getApplicationStats = async (req, res) => {
  try {
    const stats = await CorporateApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplications = await CorporateApplication.countDocuments();
    const pendingApplications = await CorporateApplication.countDocuments({ status: 'pending' });
    const recentApplications = await CorporateApplication.countDocuments({
      applicationDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const formattedStats = {
      total: totalApplications,
      pending: pendingApplications,
      recent: recentApplications,
      byStatus: {}
    };

    stats.forEach(stat => {
      formattedStats.byStatus[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('Error fetching application statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};
