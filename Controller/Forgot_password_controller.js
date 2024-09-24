const nodemailer = require('nodemailer')
const pool = require('../config/db')

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'abcd123@example.com',
    pass: 'abcdmnbvcxzasdfghj', 
  },
})

// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000) 
}

// Map to store OTPs temporarily (in a production scenario, use a database or Redis for OTP storage)
const otpMap = new Map()

const forgotPassword = async (req, res) => {
  const { email_id } = req.body
  try {
    
    const userResult = await pool.query(`SELECT * FROM product_owner_tbl WHERE email_id = $1`, [email_id])
    
    const user = userResult.rows[0]
    console.log(userResult)
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Generate OTP
    const otp = generateOTP()
    otpMap.set(email_id, otp)

    // Send OTP via email
    const mailOptions = {
      to: user.email_id,
      from: 'abcd123@example.com',
      subject: 'Password Reset OTP',
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 15px;">
        <div style="background-color: #1F487C; padding: 10px; border-radius: 10px 10px 0 0; text-align: center; color: #fff;">
          <a href="www.theexample.com" style="color: #FFFFFF;font-size: 22px; font-weight: 600 ;margin: 0;">EXAMPLE</a>
        </div>
        <div style="padding: 20px; background-color: #ffffff; text-align: center; border: 3px solid #1F487C; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1F487C; font-size: 22x; margin-bottom: 8px;">Password Reset OTP</h2>
          <p style="font-size: 16px; color: #1F487C; margin-bottom: 15px;">
            Your OTP for password reset is:
          </p>
          <div style="font-size: 24px; color: #1F487C; font-weight: 900; border: 2px dashed #1F487C; background-color: #D2DAE5; border-radius: 10px 10px 10px 10px; display: inline-block; padding: 8px 15px; margin-bottom: 10px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #777; margin-bottom: 5px;">
            Please copy the OTP above & paste it into the password.
          </p>
        </div>
        <div style="padding: 10px; background-color: #D2DAE5; text-align: center; border-radius: 0 0 10px 10px;">
          <p style="font-size: 12px; color: #999; margin: 0;">
            This email was sent by Example.
          </p>
          <p style="font-size: 12px; color: #999; margin: 5px 0 0 0;">
            © Example. All rights reserved.
          </p>
        </div>
      </div>
  `,
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: 'OTP sent for password reset' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const resetPassword = async (req, res) => {
  const { email_id, otp, newPassword } = req.body
  try {
    // Check if OTP exists for the email
    if (!otpMap.has(email_id)) {
      return res.status(400).json({ message: 'OTP not found or expired' })
    }

    // Verify OTP
    const storedOTP = otpMap.get(email_id)
    if (otp !== storedOTP.toString()) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    // Update password in the database
    await pool.query('UPDATE product_owner_tbl SET password = $1 WHERE email_id = $2', [newPassword, email_id])
   

    // Remove OTP from map
    otpMap.delete(email_id)

    res.json({ message: 'Password reset successful' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { forgotPassword, resetPassword }


