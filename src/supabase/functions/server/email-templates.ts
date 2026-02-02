export interface WaitlistAlertPayload {
  email: string
  name?: string | null
  position?: number | null
  referralCode?: string | null
  usedReferralCode?: string | null
  totalWaitlist?: number | null
  source?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  signupDate: string
  emailSent: boolean
  emailError?: string | null
}

export interface EmailTemplateContent {
  subject: string
  html: string
  text: string
}

const labelValue = (label: string, value?: string | number | null) => {
  if (value === undefined || value === null || value === '') return ''
  return `<p style="margin: 4px 0;"><strong>${label}:</strong> ${String(value)}</p>`
}

export function buildWaitlistAlertEmail(payload: WaitlistAlertPayload): EmailTemplateContent {
  const subject = `New waitlist signup · ${payload.email}${payload.position ? ` (#${payload.position})` : ''}`
  const header = `<h2 style="margin-bottom: 8px;">New Waitlist Signup</h2>`
  const meta = [
    labelValue('Email', payload.email),
    labelValue('Name', payload.name),
    labelValue('Queue Position', payload.position),
    labelValue('Total Waitlist', payload.totalWaitlist),
    labelValue('Referral Code', payload.referralCode),
    labelValue('Used Referral', payload.usedReferralCode),
    labelValue('Source', payload.source),
    labelValue('UTM Source', payload.utm_source),
    labelValue('UTM Medium', payload.utm_medium),
    labelValue('UTM Campaign', payload.utm_campaign),
    labelValue('Signup Date', payload.signupDate),
    labelValue('IP Address', payload.ipAddress),
    labelValue('User Agent', payload.userAgent),
    labelValue('Email Sent', payload.emailSent ? 'Yes' : 'No'),
    labelValue('Email Error', payload.emailError)
  ].join('\n')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 16px;">
      ${header}
      <p style="margin: 0 0 12px; font-size: 14px; color: #475467;">Timestamp: ${payload.signupDate}</p>
      <div style="font-size: 14px; color: #111; line-height: 1.5;">${meta}</div>
    </div>
  `

  const textLines = [
    'New waitlist signup',
    `Email: ${payload.email}`,
    payload.name ? `Name: ${payload.name}` : null,
    payload.position ? `Queue Position: #${payload.position}` : null,
    payload.totalWaitlist ? `Total Waitlist: ${payload.totalWaitlist}` : null,
    payload.referralCode ? `Referral Code: ${payload.referralCode}` : null,
    payload.usedReferralCode ? `Used Referral: ${payload.usedReferralCode}` : null,
    payload.source ? `Source: ${payload.source}` : null,
    payload.utm_source ? `UTM Source: ${payload.utm_source}` : null,
    payload.utm_medium ? `UTM Medium: ${payload.utm_medium}` : null,
    payload.utm_campaign ? `UTM Campaign: ${payload.utm_campaign}` : null,
    `Signup Date: ${payload.signupDate}`,
    payload.ipAddress ? `IP Address: ${payload.ipAddress}` : null,
    payload.userAgent ? `User Agent: ${payload.userAgent}` : null,
    `Confirmation Email Sent: ${payload.emailSent ? 'Yes' : 'No'}`,
    payload.emailError ? `Email Error: ${payload.emailError}` : null
  ].filter(Boolean).join('\n')

  return {
    subject,
    html,
    text: textLines
  }
}
