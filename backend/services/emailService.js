const nodemailer = require('nodemailer');

// Create transporter — reads from env vars only, no hardcoded credentials
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Format currency helper
const fmt = (amount, currency = 'INR') => {
  const sym = currency === 'USD' ? '$' : '₹';
  return `${sym}${Number(amount).toLocaleString('en-IN')}`;
};

// ─── Email Templates ──────────────────────────────────────────────────────────

const budgetAlertTemplate = ({ name, spent, budget, currency, percentage }) => ({
  subject: `⚠️ Budget Alert — You've used ${percentage}% of your monthly budget`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 32px 16px;">
      <div style="background: linear-gradient(135deg, #0D9488, #7C3AED); border-radius: 16px; padding: 32px; color: white; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px; margin-bottom: 8px;">⚠️</div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Budget Alert</h1>
        <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">SmartSpend.AI</p>
      </div>

      <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
        <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          You've spent <strong style="color: #EF4444;">${fmt(spent, currency)}</strong> out of your 
          <strong>${fmt(budget, currency)}</strong> monthly budget — that's <strong style="color: #EF4444;">${percentage}%</strong> used.
          ${percentage >= 100 ? ' <strong style="color:#DC2626;">Your budget has been exceeded!</strong>' : ''}
        </p>

        <!-- Progress bar -->
        <div style="background: #F1F5F9; border-radius: 8px; height: 10px; margin: 0 0 24px; overflow: hidden;">
          <div style="width: ${Math.min(percentage, 100)}%; background: ${percentage >= 100 ? '#EF4444' : percentage >= 80 ? '#F97316' : '#0D9488'}; height: 100%; border-radius: 8px; transition: width 0.3s;"></div>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <div style="flex:1; background: #F0FDF4; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: #16A34A; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Spent</div>
            <div style="font-size: 20px; font-weight: 800; color: #15803D; margin-top: 4px;">${fmt(spent, currency)}</div>
          </div>
          <div style="flex:1; background: #EFF6FF; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: #2563EB; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Budget</div>
            <div style="font-size: 20px; font-weight: 800; color: #1D4ED8; margin-top: 4px;">${fmt(budget, currency)}</div>
          </div>
          <div style="flex:1; background: ${percentage >= 100 ? '#FEF2F2' : '#FFF7ED'}; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: ${percentage >= 100 ? '#DC2626' : '#EA580C'}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Remaining</div>
            <div style="font-size: 20px; font-weight: 800; color: ${percentage >= 100 ? '#B91C1C' : '#C2410C'}; margin-top: 4px;">${fmt(Math.max(0, budget - spent), currency)}</div>
          </div>
        </div>

        <p style="color: #64748B; font-size: 13px; margin: 0;">
          💡 Tip: Review your top spending categories in the SmartSpend.AI app to identify where you can cut back.
        </p>
      </div>

      <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 20px;">
        SmartSpend.AI · Auto-alert · <a href="#" style="color: #0D9488;">Manage Notifications</a>
      </p>
    </div>
  `
});

const weeklyReportTemplate = ({ name, currency, totalIncome, totalExpense, totalSavings, topCategories }) => ({
  subject: `📊 Your Weekly Financial Summary — SmartSpend.AI`,
  html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #f8fafc; padding: 32px 16px;">
      <div style="background: linear-gradient(135deg, #7C3AED, #0D9488); border-radius: 16px; padding: 32px; color: white; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px; margin-bottom: 8px;">📊</div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Weekly Summary</h1>
        <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">SmartSpend.AI</p>
      </div>

      <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 16px;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">Hi <strong>${name}</strong>, here's your financial snapshot for this week:</p>
        
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <div style="flex:1; background: #F0FDF4; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: #16A34A; font-weight: 700; text-transform: uppercase;">Income</div>
            <div style="font-size: 18px; font-weight: 800; color: #15803D; margin-top: 4px;">${fmt(totalIncome, currency)}</div>
          </div>
          <div style="flex:1; background: #FEF2F2; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: #DC2626; font-weight: 700; text-transform: uppercase;">Expenses</div>
            <div style="font-size: 18px; font-weight: 800; color: #B91C1C; margin-top: 4px;">${fmt(totalExpense, currency)}</div>
          </div>
          <div style="flex:1; background: ${totalSavings >= 0 ? '#EFF6FF' : '#FEF2F2'}; border-radius: 10px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; color: ${totalSavings >= 0 ? '#2563EB' : '#DC2626'}; font-weight: 700; text-transform: uppercase;">Saved</div>
            <div style="font-size: 18px; font-weight: 800; color: ${totalSavings >= 0 ? '#1D4ED8' : '#B91C1C'}; margin-top: 4px;">${fmt(totalSavings, currency)}</div>
          </div>
        </div>

        ${topCategories && topCategories.length > 0 ? `
        <div style="border-top: 1px solid #F1F5F9; padding-top: 20px;">
          <p style="font-size: 13px; font-weight: 700; color: #334155; margin: 0 0 12px;">Top Spending Categories</p>
          ${topCategories.slice(0, 4).map((c, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F8FAFC;">
              <span style="font-size: 13px; color: #475569;">${['🔴','🟠','🟡','🟢'][i] || '•'} ${c.name}</span>
              <span style="font-size: 13px; font-weight: 700; color: #334155;">${fmt(c.total, currency)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>

      <p style="text-align: center; color: #94A3B8; font-size: 12px; margin-top: 20px;">
        SmartSpend.AI · Weekly Digest · <a href="#" style="color: #0D9488;">Manage Notifications</a>
      </p>
    </div>
  `
});

// ─── Send Functions ────────────────────────────────────────────────────────────

/**
 * Send a budget alert email to a user
 */
const sendBudgetAlert = async ({ toEmail, name, spent, budget, currency }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 Email service not configured (EMAIL_USER / EMAIL_PASS not set). Skipping budget alert.');
    return false;
  }
  const percentage = Math.round((spent / budget) * 100);
  const template = budgetAlertTemplate({ name, spent, budget, currency, percentage });
  try {
    await transporter.sendMail({
      from: `"SmartSpend.AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: template.subject,
      html: template.html
    });
    console.log(`✅ Budget alert email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send budget alert email:', err.message);
    return false;
  }
};

/**
 * Send a weekly financial summary email to a user
 */
const sendWeeklySummary = async ({ toEmail, name, currency, totalIncome, totalExpense, totalSavings, topCategories }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 Email service not configured. Skipping weekly summary.');
    return false;
  }
  const template = weeklyReportTemplate({ name, currency, totalIncome, totalExpense, totalSavings, topCategories });
  try {
    await transporter.sendMail({
      from: `"SmartSpend.AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: template.subject,
      html: template.html
    });
    console.log(`✅ Weekly summary email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to send weekly summary email:', err.message);
    return false;
  }
};

module.exports = { sendBudgetAlert, sendWeeklySummary };
