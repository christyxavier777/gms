import { DietCategory } from "@prisma/client";
import { HttpError } from "../middleware/http-error";

export function calculateBmi(weight: number, height: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
    throw new HttpError(400, "INVALID_BMI_INPUT", "Weight and height must be positive numbers");
  }

  return Number((weight / (height * height)).toFixed(2));
}

export function categorizeBmi(bmi: number): DietCategory {
  if (!Number.isFinite(bmi) || bmi <= 0) {
    throw new HttpError(400, "INVALID_BMI", "BMI must be a positive number");
  }

  if (bmi < 18.5) return DietCategory.UNDERWEIGHT;
  if (bmi < 25) return DietCategory.NORMAL;
  if (bmi < 30) return DietCategory.OVERWEIGHT;
  return DietCategory.OBESE;
}

export function getDietTemplate(category: DietCategory): { title: string; description: string } {
  if (category === DietCategory.UNDERWEIGHT) {
    return {
      title: "Auto Diet - Underweight",
      description: "Calorie surplus, balanced protein, and progressive strength focus.",
    };
  }
  if (category === DietCategory.NORMAL) {
    return {
      title: "Auto Diet - Normal BMI",
      description: "Maintenance calories, high-quality protein, and balanced macros.",
    };
  }
  if (category === DietCategory.OVERWEIGHT) {
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
