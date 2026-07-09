const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Income, Expense, User } = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @route   POST api/ai/analyze
// @desc    Analyze user's spending data and provide financial advice
// @access  Private
router.post('/analyze', auth, async (req, res) => {
  const { customMessage } = req.body;

  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Fetch user incomes and expenses
    const incomes = await Income.find({ userId });
    const expenses = await Expense.find({ userId });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current Month stats
    const monthlyIncomes = incomes.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyExpenses = expenses.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalIncome = monthlyIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
    const savings = totalIncome - totalExpense;

    // Current month category breakdown
    const categoryMap = {};
    monthlyExpenses.forEach(exp => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });

    const categoriesText = Object.keys(categoryMap)
      .map(cat => `- ${cat}: ${user.currency === 'INR' ? '₹' : '$'}${categoryMap[cat]}`)
      .join('\n');

    // Calculate historical 6-month stats
    const monthlyHist = {};
    const historicalCategoryMap = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const tempDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyHist[key] = { income: 0, expense: 0 };
    }

    incomes.forEach(item => {
      const d = new Date(item.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyHist[key]) {
        monthlyHist[key].income += item.amount;
      }
    });

    expenses.forEach(item => {
      const d = new Date(item.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyHist[key]) {
        monthlyHist[key].expense += item.amount;
      }
      historicalCategoryMap[item.category] = (historicalCategoryMap[item.category] || 0) + item.amount;
    });

    // Compute averages
    const monthsWithData = Object.keys(monthlyHist);
    const totalHistIncome = monthsWithData.reduce((sum, k) => sum + monthlyHist[k].income, 0);
    const totalHistExpense = monthsWithData.reduce((sum, k) => sum + monthlyHist[k].expense, 0);
    const avgIncome = monthsWithData.length > 0 ? (totalHistIncome / monthsWithData.length) : 0;
    const avgExpense = monthsWithData.length > 0 ? (totalHistExpense / monthsWithData.length) : 0;
    const avgSavings = avgIncome - avgExpense;

    const histCategoryText = Object.keys(historicalCategoryMap)
      .map(cat => `- ${cat}: ${user.currency === 'INR' ? '₹' : '$'}${historicalCategoryMap[cat]} (Total over 6 months)`)
      .join('\n');

    // Setup Prompt
    const contextPrompt = `
You are an expert AI Financial Advisor. Provide highly personalized, actionable budgeting and savings advice based on the user's financial profile and transaction history.
User Profile:
- Name: ${user.name}
- Monthly Budget Limit: ${user.currency === 'INR' ? '₹' : '$'}${user.monthlyBudget}
- Preferred Currency: ${user.currency}

Current Month Stats (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}):
- Total Income: ${user.currency === 'INR' ? '₹' : '$'}${totalIncome}
- Total Expense: ${user.currency === 'INR' ? '₹' : '$'}${totalExpense}
- Current Monthly Savings: ${user.currency === 'INR' ? '₹' : '$'}${savings}
- Budget Used: ${user.monthlyBudget > 0 ? Math.round((totalExpense / user.monthlyBudget) * 100) : 0}%

Current Month Expense Breakdown by Category:
${categoriesText || '(No expenses recorded yet)'}

Historical Averages (Over the last 6 months):
- Avg Monthly Income: ${user.currency === 'INR' ? '₹' : '$'}${Math.round(avgIncome)}
- Avg Monthly Expense: ${user.currency === 'INR' ? '₹' : '$'}${Math.round(avgExpense)}
- Avg Monthly Savings: ${user.currency === 'INR' ? '₹' : '$'}${Math.round(avgSavings)}

Historical Category Spending:
${histCategoryText || '(No historical expenses recorded yet)'}

${customMessage ? `User's Question: "${customMessage}"\n\nPlease answer this question precisely using the current month stats and historical averages above. If the user asks about future estimates (e.g. 6 months savings), calculate it using the historical average monthly savings value (${Math.round(avgSavings)}) and display the mathematical steps.` : `Provide general financial advice. Suggest where they can save money, call out any excessive spending categories (like if Shopping or Food is more than 30% of income), evaluate their monthly savings rate, and provide 3-4 bullet-point suggestions.`}
Keep your response concise, friendly, and structured. Use Markdown formatting. Make sure numbers are formatted with currency symbols.
`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(contextPrompt);
        const response = await result.response;
        return res.json({ advice: response.text() });
      } catch (geminiErr) {
        console.error('Gemini API Error, falling back to rule engine:', geminiErr.message);
      }
    }

    // Smart local rule-based advisor fallback if Gemini is not set up
    let fallbackAdvice = `### 📊 AI Financial Analysis for **${user.name}**\n\n`;
    
    if (customMessage) {
      fallbackAdvice += `*Note: Custom AI queries require a valid GEMINI_API_KEY in the backend .env file. Here is a quick data-driven analysis of your query relative to your budget:*\n\n`;
    }

    if (totalExpense === 0) {
      fallbackAdvice += `It looks like you haven't logged any expenses for this month yet. A great way to start is by adding your daily transactions or scanning a receipt. Once you log some data, I'll analyze your habits and give you personalized tips!\n\n`;
      fallbackAdvice += `💡 **Next Step:** Add your salary under the "Income" section, and log your rent or grocery bills under "Expenses".`;
      return res.json({ advice: fallbackAdvice });
    }

    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    
    fallbackAdvice += `This month, you spent **${user.currency === 'INR' ? '₹' : '$'}${totalExpense.toLocaleString()}** out of **${user.currency === 'INR' ? '₹' : '$'}${totalIncome.toLocaleString()}** income.\n\n`;

    if (user.monthlyBudget > 0) {
      const budgetPct = (totalExpense / user.monthlyBudget) * 100;
      if (budgetPct > 100) {
        fallbackAdvice += `⚠️ **Budget Exceeded:** You are currently **${Math.round(budgetPct - 100)}% over** your monthly budget limit of ${user.currency === 'INR' ? '₹' : '$'}${user.monthlyBudget.toLocaleString()}. It is highly recommended to pause all non-essential shopping or dining out immediately.\n\n`;
      } else if (budgetPct > 85) {
        fallbackAdvice += `⚠️ **High Budget Usage:** You have consumed **${Math.round(budgetPct)}%** of your budget. You only have ${user.currency === 'INR' ? '₹' : '$'}${Math.round(user.monthlyBudget - totalExpense).toLocaleString()} remaining for the month.\n\n`;
      } else {
        fallbackAdvice += `✅ **On Track:** You have used **${Math.round(budgetPct)}%** of your budget, leaving ${user.currency === 'INR' ? '₹' : '$'}${Math.round(user.monthlyBudget - totalExpense).toLocaleString()} in reserve.\n\n`;
      }
    }

    // Check specific categories
    fallbackAdvice += `#### 🔍 Observations:\n`;
    let suggestions = [];

    if (categoryMap['Shopping'] && categoryMap['Shopping'] > totalIncome * 0.2) {
      fallbackAdvice += `- **High Shopping Spend:** Shopping accounts for **${Math.round((categoryMap['Shopping'] / totalExpense) * 100)}%** of your total spending. This is quite high.\n`;
      suggestions.push(`Try implementing the **24-hour rule** for online purchases—wait a day before buying to curb impulsive shopping.`);
    }

    if (categoryMap['Food'] && categoryMap['Food'] > totalIncome * 0.15) {
      fallbackAdvice += `- **Dining & Grocery:** You spent **${user.currency === 'INR' ? '₹' : '$'}${categoryMap['Food'].toLocaleString()}** on Food. Eating out can accumulate fast.\n`;
      suggestions.push(`Consider planning meals weekly to save up to 30% on food expenses.`);
    }

    if (savingsRate < 10) {
      fallbackAdvice += `- **Low Savings Rate:** Your savings rate is currently **${Math.round(savingsRate)}%**. Financial planners recommend saving at least 20% of your income.\n`;
      suggestions.push(`Automate a transfer of 10-20% of your income to a separate savings account on payday.`);
    } else {
      fallbackAdvice += `- **Healthy Savings Rate:** Excellent job! You are saving **${Math.round(savingsRate)}%** of your income.\n`;
      suggestions.push(`Consider investing some of your monthly savings of ${user.currency === 'INR' ? '₹' : '$'}${savings.toLocaleString()} in mutual funds or index trackers.`);
    }

    // Default suggestions
    if (suggestions.length < 3) {
      suggestions.push(`Audit your subscriptions (Netflix, Spotify, gym). Cancelling even one unused service can save substantial cash annually.`);
      suggestions.push(`Use the "Receipt Scanner" to capture paper receipts instantly so you don't miss logging cash payments.`);
    }

    fallbackAdvice += `\n#### 💡 Actionable Advice:\n`;
    suggestions.forEach((s, idx) => {
      fallbackAdvice += `${idx + 1}. ${s}\n`;
    });

    res.json({ advice: fallbackAdvice });

  } catch (err) {
    console.error('AI analyze error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/ai/forecast
// @desc    Generate cashflow forecast for next month using historical data
// @access  Private
router.get('/forecast', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const expenses = await Expense.find({ userId });
    const incomes = await Income.find({ userId });

    const now = new Date();
    const months = [];

    // Collect last 3 months spending
    for (let i = 2; i >= 0; i--) {
      const m = now.getMonth() - i;
      const y = now.getFullYear() + Math.floor((now.getMonth() - i) / 12);
      const actualMonth = ((m % 12) + 12) % 12;

      const monthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === actualMonth && d.getFullYear() === y;
      });

      const monthIncomes = incomes.filter(inc => {
        const d = new Date(inc.date);
        return d.getMonth() === actualMonth && d.getFullYear() === y;
      });

      months.push({
        totalExpense: monthExpenses.reduce((s, e) => s + e.amount, 0),
        totalIncome: monthIncomes.reduce((s, i) => s + i.amount, 0)
      });
    }

    // Linear regression on expenses
    const n = months.length;
    const xSum = n * (n + 1) / 2;
    const xSqSum = n * (n + 1) * (2 * n + 1) / 6;
    const ySum = months.reduce((s, m) => s + m.totalExpense, 0);
    const xySum = months.reduce((s, m, i) => s + (i + 1) * m.totalExpense, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xSqSum - xSum * xSum) || 0;
    const intercept = (ySum - slope * xSum) / n || 0;
    const forecastedExpense = Math.max(0, Math.round(intercept + slope * (n + 1)));

    const avgIncome = months.reduce((s, m) => s + m.totalIncome, 0) / n || 0;
    const forecastedSavings = Math.round(avgIncome - forecastedExpense);

    const budget = user?.monthlyBudget || 0;
    const willExceed = budget > 0 && forecastedExpense > budget;
    const excessAmount = willExceed ? Math.round(forecastedExpense - budget) : 0;

    // Category forecast
    const categoryMap = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthsAgo <= 2) {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
      }
    });

    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, total]) => ({ name, avgMonthly: Math.round(total / 3) }));

    // Setup prediction explanation prompt for Gemini
    const forecastPrompt = `
You are an expert financial strategist and machine learning translator. 
Here is a statistical cashflow prediction for the user based on linear regression analysis of their past 3 months transactions:
- Historical Monthly Average Income: ${user.currency === 'INR' ? '₹' : '$'}${Math.round(avgIncome)}
- Predicted Next Month Expense: ${user.currency === 'INR' ? '₹' : '$'}${forecastedExpense}
- Projected Next Month Savings: ${user.currency === 'INR' ? '₹' : '$'}${forecastedSavings}
- Expense Trend Direction: ${slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'} (Change rate of ${user.currency === 'INR' ? '₹' : '$'}${Math.round(Math.abs(slope))} per month)
- Budget Limit: ${user.currency === 'INR' ? '₹' : '$'}${budget}
- Will Exceed Budget: ${willExceed ? 'Yes (by ' + (user.currency === 'INR' ? '₹' : '$') + excessAmount + ')' : 'No'}

Top spend categories (last 3 months average):
${topCategories.map(c => `- ${c.name}: ${user.currency === 'INR' ? '₹' : '$'}${c.avgMonthly}/mo`).join('\n')}

Please explain this prediction to user ${user.name} in a clear, narrative style. 
Identify which categories might be driving an increasing trend or how they can sustain a decreasing trend. 
Provide 2-3 specific recommendations. Keep it under 150 words and use markdown formatting.
`;

    let explanation = `Based on your recent transactions, your monthly expenses are projected to be ${user.currency === 'INR' ? '₹' : '$'}${forecastedExpense.toLocaleString()} next month, leaving you with an estimated savings of ${user.currency === 'INR' ? '₹' : '$'}${forecastedSavings.toLocaleString()}.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(forecastPrompt);
        const response = await result.response;
        explanation = response.text();
      } catch (geminiErr) {
        console.error('Gemini explanation error, falling back to static:', geminiErr.message);
      }
    }

    res.json({
      currency: user?.currency || 'INR',
      forecastedExpense,
      forecastedSavings,
      avgIncome: Math.round(avgIncome),
      willExceed,
      excessAmount,
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      slopeAmount: Math.round(Math.abs(slope)),
      topCategories,
      historicalMonths: months,
      explanation
    });
  } catch (err) {
    console.error('Forecast error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
