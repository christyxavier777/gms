"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBmi = calculateBmi;
exports.categorizeBmi = categorizeBmi;
exports.getDietTemplate = getDietTemplate;
const client_1 = require("@prisma/client");
const http_error_1 = require("../middleware/http-error");
function calculateBmi(weight, height) {
    if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
        throw new http_error_1.HttpError(400, "INVALID_BMI_INPUT", "Weight and height must be positive numbers");
    }
    return Number((weight / (height * height)).toFixed(2));
}
function categorizeBmi(bmi) {
    if (!Number.isFinite(bmi) || bmi <= 0) {
        throw new http_error_1.HttpError(400, "INVALID_BMI", "BMI must be a positive number");
    }
    if (bmi < 18.5)
        return client_1.DietCategory.UNDERWEIGHT;
    if (bmi < 25)
        return client_1.DietCategory.NORMAL;
    if (bmi < 30)
        return client_1.DietCategory.OVERWEIGHT;
    return client_1.DietCategory.OBESE;
}
function getDietTemplate(category) {
    if (category === client_1.DietCategory.UNDERWEIGHT) {
        return {
            title: "Auto Diet - Underweight",
            description: "Calorie surplus, balanced protein, and progressive strength focus.",
        };
    }
    if (category === client_1.DietCategory.NORMAL) {
        return {
            title: "Auto Diet - Normal BMI",
            description: "Maintenance calories, high-quality protein, and balanced macros.",
        };
    }
    if (category === client_1.DietCategory.OVERWEIGHT) {
        return {
            title: "Auto Diet - Overweight",
            description: "Moderate calorie deficit, high protein, and cardio support plan.",
        };
    }
    return {
        title: "Auto Diet - Obese",
        description: "Structured deficit with strict monitoring and medically-safe progression.",
    };
}
//# sourceMappingURL=bmi.js.map