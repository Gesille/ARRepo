import { Model } from "mongoose";

interface MonthData {
  month: string;
  count: number;
  featuredCount: number;
}

export async function generateLast12MonthsPostData(
  model: Model<any>
): Promise<{ last12Months: MonthData[] }> {
  const last12Months: MonthData[] = [];
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

    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const featuredCount = await model.countDocuments({
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
}