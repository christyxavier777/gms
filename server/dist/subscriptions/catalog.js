"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.membershipPlanCatalog = exports.membershipPlanKeys = void 0;
exports.getMembershipPlanByKey = getMembershipPlanByKey;
exports.membershipPlanKeys = [
    "basic-monthly",
    "pro-quarterly",
    "elite-annual",
];
exports.membershipPlanCatalog = [
    {
        key: "basic-monthly",
        name: "Basic Monthly",
        priceInr: 1249,
        durationDays: 30,
        perks: "Gym floor access + starter plan",
    },
    {
        key: "pro-quarterly",
        name: "Pro Quarterly",
        priceInr: 3499,
        durationDays: 90,
        perks: "Trainer check-ins + diet guidance",
    },
    {
        key: "elite-annual",
        name: "Elite Annual",
        priceInr: 6999,
        durationDays: 365,
        perks: "Priority coaching + premium tracking",
    },
];
function getMembershipPlanByKey(planKey) {
    return exports.membershipPlanCatalog.find((plan) => plan.key === planKey) ?? null;
}
//# sourceMappingURL=catalog.js.map