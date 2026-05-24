const Joi = require('joi');

/**
 * Validate registration data
 */
const validateRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    phoneNumber: Joi.string().pattern(/^\+?[0-9]\d{6,14}$/).optional().allow('', null).messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(2).max(100).required().messages({
      'string.min': 'First name must be at least 2 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Last name must be at least 2 characters',
      'any.required': 'Last name is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

/**
 * Validate login data
 */
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

/**
 * Validate forgot password
 */
const validateForgotPassword = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  });

  return schema.validate(data);
};

/**
 * Validate password reset
 */
const validatePasswordReset = (data) => {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required()
  });

  return schema.validate(data);
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validatePasswordReset
};