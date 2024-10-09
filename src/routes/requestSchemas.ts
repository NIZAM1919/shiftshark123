import Joi from 'joi';

const authRoutesSchemas = {
  login: {
    body: Joi.object().keys({
      phone: Joi.string().required().min(10).max(10),
      password: Joi.string().required(),
    }),
  },
  sendOTP: {
    body: Joi.object()
      .keys({
        phone: Joi.string().min(10).max(10),
        email: Joi.string().email(),
        source: Joi.string().required().valid('service-provider', 'hirer'),
      })
      .xor('phone', 'email'),
  },
  verifyOTP: {
    body: Joi.object().keys({
      requestId: Joi.string().required(),
      otp: Joi.string().required().min(6).max(6),
    }),
  },
  forgotPassword: {
    body: Joi.object().keys({
      phone: Joi.string().required().min(10).max(10),
    }),
  },
  resetPassword: {
    body: Joi.object().keys({
      phone: Joi.string().required().min(10).max(10),
      password: Joi.string().required(),
    }),
  },
  changePassword: {
    body: Joi.object().keys({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
    }),
  },
  renewToken: {
    body: Joi.object().keys({
      refreshToken: Joi.string().required(),
    }),
  },
};
const userRoutesSchemas = {
  signup: {
    body: Joi.object().keys({
      user: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email(),
        dob: Joi.number().required(),
        gender: Joi.string().required().valid('Male', 'Female', 'Other'),
        cityName: Joi.string(),
        avatar: Joi.string(),
      }).required(),
      additionalDetails: Joi.object({
        PAN: Joi.number().min(10).max(10).required(),
        aadharNumber: Joi.string().min(12).max(12).required(),
        skills: Joi.array().items(Joi.string()).required(),
        photoURL: Joi.string(),
        resume: Joi.string(),
        schoolName: Joi.string(),
        aboutMe: Joi.string(),
      }),
      bankDetails: Joi.object({
        accountNumber: Joi.string().min(9).max(18).required(),
        ifscCode: Joi.string().min(11).max(11).required(),
        accountHolderName: Joi.string().required(),
        bankName: Joi.string().required(),
      }),
    }),
  },
  updateProfile: {
    body: Joi.object().keys({
      user: Joi.object({
        name: Joi.string().required(),
        dob: Joi.number().required(),
        gender: Joi.string().required().valid('Male', 'Female', 'Other'),
        cityName: Joi.string(),
        avatar: Joi.string(),
      }).required(),
    }),
  },
  updateBankDetails: {
    body: Joi.object({
      accountNumber: Joi.string().min(9).max(18).required(),
      confirmAccountNumber: Joi.string().min(9).max(18).required(),
      ifscCode: Joi.string().min(11).max(11).required(),
      accountHolderName: Joi.string().required(),
      bankName: Joi.string().required(),
    }).required(),
  },
  updateAdditionalDetails: {
    body: Joi.object({
      PAN: Joi.string().min(10).max(10),
      aadharNumber: Joi.string().min(12),
      photoURL: Joi.string(),
      skills: Joi.array().items(Joi.string()),
      resume: Joi.string(),
      schoolName: Joi.string(),
      aboutMe: Joi.string(),
    }).required(),
  },
};
const commonRoutesSchemas = {
  uploadFile: {
    body: Joi.object().keys({
      fileBinary: Joi.string().required(),
      fileSource: Joi.string().required(),
    }),
  },
};

const emplpyerRoutesSchema = {
  signup: {
    body: Joi.object().keys({
      user: Joi.object({
        name: Joi.string().required(),
        gender: Joi.string().valid('Male', 'Female', 'Other'),
        employeeId: Joi.string().required(),
        designation: Joi.string().required(),
        cityName: Joi.string(),
        phone: Joi.string().required(),
        avatar: Joi.string(),
      }).required(),
      companyDetails: Joi.object({
        GSTNumber: Joi.string().min(10).max(10),
        name: Joi.string().required(),
        phone: Joi.string(),
        address: Joi.string().required(),
        mapLink: Joi.string().required(),
        cityName: Joi.string(),
        registrationNumber: Joi.string(),
        isNgo: Joi.boolean(),
      })
        .xor('GSTNumber', 'registrationNumber')
        .required(),
    }),
  },
  updateProfile: {
    body: Joi.object().keys({
      user: Joi.object({
        name: Joi.string(),
        employeeId: Joi.string(),
        designation: Joi.string(),
        avatar: Joi.string(),
        cityName: Joi.string(),
        phone: Joi.string(),
      }).required(),
    }),
  },
  createEmployee: {
    body: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      employee_id: Joi.string().required(),
      designation: Joi.string().required(),
    }),
  },
};
const requestSchemas = {
  authRoutesSchemas,
  userRoutesSchemas,
  commonRoutesSchemas,
  emplpyerRoutesSchema,
};

export default requestSchemas;
