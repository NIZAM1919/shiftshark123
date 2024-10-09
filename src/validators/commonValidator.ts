import { body, param, query } from 'express-validator';
import { isEmpty } from 'lodash';

//BOOLEAN VALIDATOR FUNCTION
const booleanValidator = (
    field,
    messageName,
    options = {
        type: 'body',
        optional: true,
        allow: [],
    }
) => {
    let validation = null;
    switch (options?.type) {
        case 'param':
            validation = param(field);
            break;
        case 'body':
            validation = body(field);
            break;
        case 'query':
            validation = query(field);
            break;
    }

    if (options?.optional) {
        validation.optional({ nullable: true });
    } else {
        validation
            .exists()
            .withMessage(`${messageName} must be provided`)
            .bail()
            .notEmpty()
            .withMessage(`${messageName} must be provided`)
            .bail();
    }

    return validation
        .trim()
        .isBoolean()
        .withMessage(`${messageName} should be boolean`)
        .custom((value) => {
            if (!isEmpty(value)) {
                if (!options?.allow.some((v) => v === value)) {
                    throw new Error(
                        `${messageName} must be a boolean: [${options?.allow.join(
                            ','
                        )}]`
                    );
                }
                return true;
            }
            return false;
        })
        .customSanitizer((value) => {
            if (isEmpty(value)) {
                return null;
            }
            return value;
        });
};

//TEXT FIELD VALIDATOR FUNCTION
const requiredTextField = (
    field: string,
    messageName: string,
    options: { min: number; max: number },
    lengthMessage?: String
) => {
    return body(field)
        .trim()
        .exists()
        .notEmpty()
        .withMessage(`${messageName} is required`)
        .isString()
        .bail()
        .isLength({
            min: options.min,
            max: options.max,
        })
        .withMessage(
            lengthMessage
                ? lengthMessage
                : `${messageName} must be between ${options.min} and ${options.max} characters`
        );
};

//OPTIONAL FIELD VALIDATOR FUNCTION
const optionalTextField = (
    field: string,
    messageName: string,
    options: { min: number; max: number; nullable: boolean }
) => {
    return body(field)
        .optional({
            nullable: options.nullable,
        })
        .trim()
        .isString()
        .isLength({
            min: options.min,
            max: options.max,
        })
        .withMessage(
            `${messageName} must be between ${options.min} and ${options.max} characters`
        );
};

const createValidation = (
    fieldName: string,
    renderKey: string,
    required?: boolean
) => {
    let validation = body(fieldName);

    if (required) {
        validation = validation
            .exists()
            .withMessage(`${renderKey} is required`)
            .bail();
    }
    return validation
        .trim()
        .escape()
        .notEmpty()
        .withMessage(`${renderKey} cannot be empty`)
        .bail();
};

//EXPORT
export {
    booleanValidator,
    requiredTextField,
    optionalTextField,
    createValidation
};
