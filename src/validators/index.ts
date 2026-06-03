import Joi from "joi";
import { VALIDATION_RULES } from "../constants";

export const createOrderValidationSchema = Joi.object({
  order_id: Joi.string()
    .min(VALIDATION_RULES.ORDER_ID_MIN_LENGTH)
    .max(VALIDATION_RULES.ORDER_ID_MAX_LENGTH)
    .required(),
  courier_partner: Joi.string().required(),
  customer: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string()
      .pattern(VALIDATION_RULES.PHONE_PATTERN)
      .required(),
    email: Joi.string().email().optional(),
  }).required(),
  address: Joi.object({
    line1: Joi.string().required(),
    line2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string()
      .pattern(VALIDATION_RULES.PINCODE_PATTERN)
      .required(),
    country: Joi.string().optional(),
  }).required(),
  items: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        weight: Joi.number().optional(),
        value: Joi.number().optional(),
      })
    )
    .optional(),
  weight: Joi.number().optional(),
  dimensions: Joi.object({
    length: Joi.number().positive().required(),
    width: Joi.number().positive().required(),
    height: Joi.number().positive().required(),
  }).optional(),
  special_instructions: Joi.string().optional(),
});

export const bulkCreateOrdersValidationSchema = Joi.object({
  orders: Joi.array()
    .items(createOrderValidationSchema)
    .max(VALIDATION_RULES.MAX_BULK_ORDERS)
    .required(),
});

export const loginValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const signupValidationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("ADMIN", "OPERATOR").required(),
});

export const refreshTokenValidationSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

export const validate = (schema: Joi.Schema, data: any): { value: any; error?: Joi.ValidationError } => {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};
