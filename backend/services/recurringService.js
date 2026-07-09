const { Expense } = require('../config/db');

async function processRecurringExpenses() {
  try {
    console.log('🔄 Checking for pending recurring expenses...');
    const allRecurring = await Expense.find({ isRecurring: true });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let clonedCount = 0;

    for (const exp of allRecurring) {
      const expDate = new Date(exp.date);

      // Skip if the original or last occurrence is already in the current month/year
      if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
        continue;
      }

      if (exp.recurrence === 'monthly') {
        // Double check if we already cloned this for the current month
        const existingThisMonth = await Expense.findOne({
          userId: exp.userId,
          merchant: exp.merchant,
          amount: exp.amount,
          category: exp.category,
          isRecurring: true,
          recurrence: 'monthly',
          date: {
            $gte: new Date(currentYear, currentMonth, 1).toISOString(),
            $lte: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString()
          }
        });

        if (!existingThisMonth) {
          // Clone it
          await Expense.create({
            userId: exp.userId,
            amount: exp.amount,
            merchant: exp.merchant,
            category: exp.category,
            description: exp.description ? `${exp.description} (Auto-recurring)` : 'Auto-recurring subscription',
            paymentMethod: exp.paymentMethod || 'Cash',
            receiptImage: exp.receiptImage || '',
            isRecurring: true,
            recurrence: 'monthly',
            date: new Date().toISOString()
          });
          clonedCount++;
        }
      } else if (exp.recurrence === 'weekly') {
        // Check if we cloned this in the last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const existingThisWeek = await Expense.findOne({
          userId: exp.userId,
          merchant: exp.merchant,
          amount: exp.amount,
          category: exp.category,
          isRecurring: true,
          recurrence: 'weekly',
          date: {
            $gte: sevenDaysAgo.toISOString()
          }
        });

        if (!existingThisWeek) {
          // Clone it
          await Expense.create({
            userId: exp.userId,
            amount: exp.amount,
            merchant: exp.merchant,
            category: exp.category,
            description: exp.description ? `${exp.description} (Auto-recurring)` : 'Auto-recurring subscription',
            paymentMethod: exp.paymentMethod || 'Cash',
            receiptImage: exp.receiptImage || '',
            isRecurring: true,
            recurrence: 'weekly',
            date: new Date().toISOString()
          });
          clonedCount++;
        }
      }
    }

    if (clonedCount > 0) {
      console.log(`✅ Processed recurring expenses: created ${clonedCount} new entries.`);
    } else {
      console.log('✅ No pending recurring expenses found.');
    }
  } catch (err) {
    console.error('Error processing recurring expenses:', err.message);
  }
}

// Run immediately and then setup an interval for every 24 hours
function startRecurringScheduler() {
  processRecurringExpenses();
  // 24 hours in milliseconds = 86400000
  setInterval(processRecurringExpenses, 86400000);
}

module.exports = {
  startRecurringScheduler,
  processRecurringExpenses
};
