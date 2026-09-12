import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import Advocate from '../models/Advocate.model.js';

dotenv.config();

let transporter = null;

/**
 * Initializes and returns the Nodemailer email transporter.
 * Falls back to Ethereal / Console logger if SMTP credentials are not set.
 */
export const getTransporter = async () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      console.log('Nodemailer configured with SMTP host:', SMTP_HOST);
      return transporter;
    } catch (err) {
      console.warn('Failed to initialize SMTP transporter, falling back to mock logger:', err.message);
    }
  }

  // Development Fallback: Ethereal or Console Logger
  console.log('No SMTP credentials in .env. Using mock/logging email transporter.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n================== [OUTGOING EMAIL NOTIFICATION] ==================');
      console.log('To:     ', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Preview:', mailOptions.text ? mailOptions.text.slice(0, 160) + '...' : '(HTML email)');
      console.log('===================================================================\n');
      return {
        messageId: `mock_${Date.now()}`,
        response: 'Email logged to console (configure SMTP in backend/.env for live inbox delivery)',
      };
    },
  };

  return transporter;
};

/**
 * Send email notification to Socio-Legal Counselling (SLC) team when Outreach registers a new case
 */
export const sendNewOutreachCaseNotification = async (caseDoc) => {
  try {
    const activeTransporter = await getTransporter();

    // 1. Gather recipient emails for SLC team
    const slcUsers = await User.find({ roles: 'SLC', email: { $exists: true, $ne: '' } }).select('email userName');
    const recipientEmails = slcUsers.map((u) => u.email).filter(Boolean);

    if (process.env.SLC_NOTIFICATION_EMAIL) {
      recipientEmails.push(process.env.SLC_NOTIFICATION_EMAIL);
    }

    // Default fallback if no specific emails set
    if (recipientEmails.length === 0) {
      recipientEmails.push('sociolegal.team@example.com');
    }

    const uniqueRecipients = [...new Set(recipientEmails)];

    const caseIdentifier = caseDoc.slcNo ? `SLC #${caseDoc.slcNo}` : `Case #${caseDoc.sNo || caseDoc._id.toString().slice(-6)}`;
    const inmateName = caseDoc.inmate?.name || 'Unnamed Inmate';
    const contactName = caseDoc.contactPerson?.name || caseDoc.familyMember?.name || 'Not recorded';
    const contactPhone =
      (Array.isArray(caseDoc.contactPerson?.phoneNumbers) && caseDoc.contactPerson.phoneNumbers[0]) ||
      caseDoc.familyMember?.phoneNumber ||
      'N/A';
    const offence = caseDoc.inmate?.offenceType || caseDoc.inmate?.crimeCategory || 'Under Investigation';
    const fir = caseDoc.caseDetails?.firNumber || 'N/A';
    const court = caseDoc.caseDetails?.court || 'N/A';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const subject = `[Action Required] New Outreach Case Registered: ${inmateName} (${caseIdentifier})`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1e1b4b, #4338ca); color: #ffffff; padding: 24px 32px; }
    .header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .info-table td.label { font-weight: 600; color: #64748b; width: 40%; }
    .info-table td.value { font-weight: 700; color: #0f172a; }
    .cta-container { text-align: center; margin-top: 28px; }
    .cta-button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3); }
    .footer { background-color: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Socio-Legal Counselling Alert</span>
      <h2>New Case Registered by Outreach</h2>
      <p style="margin: 4px 0 0 0; opacity: 0.85; font-size: 13px;">A new inmate case file requires Socio-Legal assessment & counselling.</p>
    </div>
    <div class="content">
      <p style="margin-top: 0; font-size: 15px; line-height: 1.5;">
        Hello <strong>Socio-Legal Team</strong>,<br>
        An outreach team member has just registered a new inmate record on the system:
      </p>

      <table class="info-table">
        <tr>
          <td class="label">Case Reference</td>
          <td class="value">${caseIdentifier}</td>
        </tr>
        <tr>
          <td class="label">Inmate Name</td>
          <td class="value">${inmateName}</td>
        </tr>
        <tr>
          <td class="label">Offence / Category</td>
          <td class="value">${offence}</td>
        </tr>
        <tr>
          <td class="label">FIR Number</td>
          <td class="value">${fir}</td>
        </tr>
        <tr>
          <td class="label">Jurisdiction / Court</td>
          <td class="value">${court}</td>
        </tr>
        <tr>
          <td class="label">Family / Contact Person</td>
          <td class="value">${contactName} (${contactPhone})</td>
        </tr>
      </table>

      <div class="cta-container">
        <a href="${frontendUrl}" class="cta-button">Open Socio-Legal Portal & Assign Advocate ↗</a>
      </div>
    </div>
    <div class="footer">
      Prison Socio-Legal Management System • Automated notification sent because you are registered as a Socio-Legal Counsellor.
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Prison Socio-Legal System" <no-reply@sociolegal.org>',
      to: uniqueRecipients.join(', '),
      subject,
      text: `New Outreach Case Registered: ${inmateName} (${caseIdentifier}). Offence: ${offence}. Please log in to ${frontendUrl} to assess and assign an advocate.`,
      html: htmlContent,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    console.log('New outreach case notification email dispatched:', info.messageId || 'Success');
    return info;
  } catch (error) {
    console.error('Error sending outreach case notification email:', error.message);
    return null;
  }
};

/**
 * Send email notification to the assigned Advocate when Socio-Legal assigns them to a case
 */
export const sendAdvocateAssignmentNotification = async (caseDoc, advocateInfo) => {
  try {
    const activeTransporter = await getTransporter();

    // 1. Locate advocate email
    let advocateEmail = advocateInfo.email;

    if (!advocateEmail && advocateInfo.userID) {
      const advRecord = await Advocate.findOne({ userID: advocateInfo.userID.trim().toUpperCase() });
      if (advRecord && advRecord.email) {
        advocateEmail = advRecord.email;
      }
    }

    if (!advocateEmail && advocateInfo.userID) {
      const userRecord = await User.findOne({ userID: advocateInfo.userID.trim().toUpperCase() });
      if (userRecord && userRecord.email) {
        advocateEmail = userRecord.email;
      }
    }

    if (!advocateEmail) {
      advocateEmail = `adv.${(advocateInfo.name || 'counsel').toLowerCase().replace(/[^a-z0-9]/g, '')}@delhibar.org`;
    }

    const caseIdentifier = caseDoc.slcNo ? `SLC #${caseDoc.slcNo}` : `Case #${caseDoc.sNo || caseDoc._id.toString().slice(-6)}`;
    const inmateName = caseDoc.inmate?.name || 'Inmate';
    const advocateName = advocateInfo.name || 'Counsel';
    const fir = caseDoc.caseDetails?.firNumber || 'N/A';
    const policeStation = caseDoc.caseDetails?.policeStation || 'N/A';
    const court = caseDoc.caseDetails?.court || advocateInfo.practiceCourt || 'District Court';
    const offence = caseDoc.inmate?.offenceType || caseDoc.inmate?.crimeCategory || advocateInfo.specialization || 'Criminal Matter';
    const sections =
      Array.isArray(caseDoc.caseDetails?.caseSections) && caseDoc.caseDetails.caseSections.length > 0
        ? caseDoc.caseDetails.caseSections.join(', ')
        : 'Sections under review';
    const nextHearing = caseDoc.caseDetails?.nextHearingDate
      ? new Date(caseDoc.caseDetails.nextHearingDate).toLocaleDateString('en-GB')
      : 'Not yet scheduled';
    const bailStatus = caseDoc.caseDetails?.bailApplicationsFiled === true ? 'Bail Application Filed' : 'Bail Not Yet Filed';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const subject = `[Legal Case Assignment] You have been assigned: Inmate ${inmateName} (${caseIdentifier})`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #78350f, #d97706); color: #ffffff; padding: 24px 32px; }
    .header h2 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .info-table td.label { font-weight: 600; color: #64748b; width: 40%; }
    .info-table td.value { font-weight: 700; color: #0f172a; }
    .cta-container { text-align: center; margin-top: 28px; }
    .cta-button { display: inline-block; background-color: #d97706; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3); }
    .footer { background-color: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">⚖ Case Assignment Notice</span>
      <h2>Legal Representation Assigned</h2>
      <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Assigned via the Socio-Legal Counselling cell.</p>
    </div>
    <div class="content">
      <p style="margin-top: 0; font-size: 15px; line-height: 1.5;">
        Dear <strong>Adv. ${advocateName}</strong>,<br>
        You have been assigned to provide legal aid and representation for the following inmate case:
      </p>

      <table class="info-table">
        <tr>
          <td class="label">Inmate Name</td>
          <td class="value">${inmateName}</td>
        </tr>
        <tr>
          <td class="label">Docket Reference</td>
          <td class="value">${caseIdentifier}</td>
        </tr>
        <tr>
          <td class="label">Offence / Sections</td>
          <td class="value">${offence} (${sections})</td>
        </tr>
        <tr>
          <td class="label">FIR & Police Station</td>
          <td class="value">FIR ${fir} • PS: ${policeStation}</td>
        </tr>
        <tr>
          <td class="label">Court</td>
          <td class="value">${court}</td>
        </tr>
        <tr>
          <td class="label">Bail Status</td>
          <td class="value">${bailStatus}</td>
        </tr>
        <tr>
          <td class="label">Next Hearing</td>
          <td class="value">${nextHearing}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        You can log in to the Advocate Portal using your User ID (<strong>${advocateInfo.userID || 'Your ADV ID'}</strong>) to inspect all case documents, upload bail petitions (PDF with ADV_ prefix), and update hearing proceedings.
      </p>

      <div class="cta-container">
        <a href="${frontendUrl}" class="cta-button">Open Advocate Dashboard ↗</a>
      </div>
    </div>
    <div class="footer">
      Prison Socio-Legal Management System • Confidential legal communication intended solely for Adv. ${advocateName}.
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Prison Socio-Legal System" <no-reply@sociolegal.org>',
      to: advocateEmail,
      subject,
      text: `Dear Adv. ${advocateName}, you have been assigned to Case: Inmate ${inmateName} (${caseIdentifier}). Court: ${court}. Please log in at ${frontendUrl} to view documents and update hearing details.`,
      html: htmlContent,
    };

    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`Advocate assignment email dispatched to ${advocateEmail}:`, info.messageId || 'Success');
    return info;
  } catch (error) {
    console.error('Error sending advocate assignment notification email:', error.message);
    return null;
  }
};
