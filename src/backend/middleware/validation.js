const Joi = require("joi");

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return res.status(400).json({
        status: "error",
        message: "Validation error",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required().messages({
      "string.min": "First name must be at least 2 characters long",
      "string.max": "First name must not exceed 50 characters",
      "any.required": "First name is required",
    }),

    lastName: Joi.string().min(2).max(50).required().messages({
      "string.min": "Last name must be at least 2 characters long",
      "string.max": "Last name must not exceed 50 characters",
      "any.required": "Last name is required",
    }),

    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    phoneNumber: Joi.string().min(10).max(20).required().messages({
      "string.min": "Phone number must be at least 10 characters long",
      "string.max": "Phone number must not exceed 20 characters",
      "any.required": "Phone number is required",
    }),

    password: Joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters long",
      "any.required": "Password is required",
    }),
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),

    rememberMe: Joi.boolean().optional(),
  }),

  // Forgot password
  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
  }),

  // Reset password
  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      "any.required": "Reset token is required",
    }),

    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
        "any.required": "New password is required",
      }),
  }),

  // Change password
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
    }),

    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
      .required()
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
        "any.required": "New password is required",
      }),
  }),

  // Device management
  device: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Device name must be at least 2 characters long",
      "string.max": "Device name must not exceed 100 characters",
      "any.required": "Device name is required",
    }),

    type: Joi.string()
      .valid(
        "temperature",
        "humidity",
        "air_quality",
        "motion",
        "door",
        "other"
      )
      .required()
      .messages({
        "any.only":
          "Device type must be one of: temperature, humidity, air_quality, motion, door, other",
        "any.required": "Device type is required",
      }),

    location: Joi.string().min(2).max(200).required().messages({
      "string.min": "Location must be at least 2 characters long",
      "string.max": "Location must not exceed 200 characters",
      "any.required": "Location is required",
    }),

    description: Joi.string().max(500).allow("").messages({
      "string.max": "Description must not exceed 500 characters",
    }),

    is_active: Joi.boolean().default(true),
  }),

  // Update profile
  updateProfile: Joi.object({
    full_name: Joi.string().min(2).max(100).messages({
      "string.min": "Full name must be at least 2 characters long",
      "string.max": "Full name must not exceed 100 characters",
    }),

    email: Joi.string().email().messages({
      "string.email": "Please provide a valid email address",
    }),
  }).min(1),
};

module.exports = {
  validate,
  schemas,
};
