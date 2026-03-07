"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const bmi_1 = require("../progress/bmi");
(0, node_test_1.default)("calculateBmi computes BMI from weight and height", () => {
    const bmi = (0, bmi_1.calculateBmi)(70, 1.75);
    strict_1.default.equal(bmi, 22.86);
});
(0, node_test_1.default)("categorizeBmi assigns Underweight/Normal/Overweight/Obese", () => {
    strict_1.default.equal((0, bmi_1.categorizeBmi)(17.5), "UNDERWEIGHT");
    strict_1.default.equal((0, bmi_1.categorizeBmi)(22.2), "NORMAL");
    strict_1.default.equal((0, bmi_1.categorizeBmi)(27.1), "OVERWEIGHT");
    strict_1.default.equal((0, bmi_1.categorizeBmi)(33.8), "OBESE");
});
(0, node_test_1.default)("calculateBmi rejects unrealistic inputs", () => {
    strict_1.default.throws(() => (0, bmi_1.calculateBmi)(-1, 1.8));
    strict_1.default.throws(() => (0, bmi_1.calculateBmi)(60, 0));
    strict_1.default.throws(() => (0, bmi_1.calculateBmi)(Number.NaN, 1.8));
});
//# sourceMappingURL=bmi.unit.test.js.map