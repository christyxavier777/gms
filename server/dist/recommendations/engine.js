"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRecommendation = buildRecommendation;
const client_1 = require("@prisma/client");
const bmi_1 = require("../progress/bmi");
function buildRecommendation(input) {
    const bmiCategory = (0, bmi_1.categorizeBmi)(input.latestBmi);
    const delta = input.previousBmi !== null ? Number((input.latestBmi - input.previousBmi).toFixed(2)) : null;
    const reasoning = [];
    let intensity = "MODERATE";
    let focus = "General fitness";
    let cardioMinutesPerWeek = 120;
    let strengthSessionsPerWeek = 3;
    let dietGuidance = "Balanced macros and consistent hydration.";
    if (bmiCategory === client_1.DietCategory.UNDERWEIGHT) {
        intensity = "MODERATE";
        focus = "Lean mass gain and mobility";
        cardioMinutesPerWeek = 60;
        strengthSessionsPerWeek = 4;
        dietGuidance = "Calorie surplus with high-quality protein and complex carbs.";
        reasoning.push("BMI category is underweight; recommendation prioritizes safe muscle gain.");
    }
    else if (bmiCategory === client_1.DietCategory.NORMAL) {
        intensity = input.progressLast30Days >= 8 ? "ADVANCED" : "MODERATE";
        focus = "Body recomposition and performance";
        cardioMinutesPerWeek = 120;
        strengthSessionsPerWeek = 4;
        dietGuidance = "Maintenance calories with protein-first meals.";
        reasoning.push("BMI category is normal; recommendation balances performance and maintenance.");
    }
    else if (bmiCategory === client_1.DietCategory.OVERWEIGHT) {
        intensity = "MODERATE";
        focus = "Fat loss with strength preservation";
        cardioMinutesPerWeek = 180;
        strengthSessionsPerWeek = 3;
        dietGuidance = "Moderate calorie deficit and consistent protein intake.";
        reasoning.push("BMI category is overweight; recommendation targets gradual fat loss.");
    }
    else {
        intensity = "BEGINNER";
        focus = "Low-impact fat loss foundation";
        cardioMinutesPerWeek = 210;
        strengthSessionsPerWeek = 2;
        dietGuidance = "Structured calorie deficit with close weekly monitoring.";
        reasoning.push("BMI category is obese; recommendation prioritizes low-impact progression.");
    }
    if (delta !== null) {
        if (Math.abs(delta) < 0.3) {
            reasoning.push("Recent BMI trend is stable.");
        }
        else if (delta < 0) {
            reasoning.push("Recent BMI trend is improving.");
        }
        else {
            reasoning.push("Recent BMI trend is rising; nutrition adherence should be reviewed.");
        }
    }
    if (input.progressLast30Days < 4) {
        reasoning.push("Low recent tracking consistency detected; shorter feedback cycle recommended.");
    }
    if (!input.hasActiveSubscription) {
        reasoning.push("No active membership detected; keep plan volume conservative.");
    }
    const nextReviewDays = input.progressLast30Days < 4 ? 7 : 14;
    return {
        bmiCategory,
        intensity,
        focus,
        cardioMinutesPerWeek,
        strengthSessionsPerWeek,
        dietGuidance,
        nextReviewDays,
        reasoning,
    };
}
//# sourceMappingURL=engine.js.map