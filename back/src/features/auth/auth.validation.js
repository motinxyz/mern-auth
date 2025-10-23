import { check } from "express-validator";
import { VALIDATION_RULES } from "../../constants/validation.constants.js";

export const validateRegistrationForm = [
  check("name")
    .isLength({ min: VALIDATION_RULES.NAME.MIN_LENGTH })
    .withMessage("validation.length.name"),
  check("email")
    .trim()
    .isEmail()
    .withMessage("validation.email")
    .normalizeEmail(),
  check("password")
    .isLength({ min: VALIDATION_RULES.PASSWORD.MIN_LENGTH })
    .withMessage("validation.length.password"),
];
