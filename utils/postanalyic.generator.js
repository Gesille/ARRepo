"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLast12MonthsPostData = generateLast12MonthsPostData;
function generateLast12MonthsPostData(model) {
    return __awaiter(this, void 0, void 0, function* () {
        const last12Months = [];
        const currentDate = new Date();
        // نبدأ من الشهر الحالي 
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        for (let i = 0; i < 12; i++) {
            // حساب الشهر والسنة
            const monthIndex = (currentMonth - i + 12) % 12; // يضمن أن يكون الشهر بين 0-11
            const year = currentYear - Math.floor((currentMonth - i) / 12); // حساب السنة الصحيحة
            // بداية ونهاية الشهر
            const startDate = new Date(year, monthIndex, 1);
            const endDate = new Date(year, monthIndex + 1, 1);
            const monthYear = startDate.toLocaleString("default", {
                month: "short",
                year: "numeric",
            });
            const count = yield model.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate,
                },
            });
            const featuredCount = yield model.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lt: endDate,
                },
                isFeatured: true,
            });
            last12Months.push({ month: monthYear, count, featuredCount });
        }
        // عرض النتائج
        return { last12Months };
    });
}
