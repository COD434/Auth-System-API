require("dotenv").config();
import {PrismaClient} from "@prisma/client";
const crypto = require("crypto")
const nodemailer = require("nodemailer")


const prisma = new PrismaClient();

interface MailOptions{
        from: string;
        to:string;
	subject:string;
	html:string
}
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    pool:true,
    port:587,
    secure:false,
    auth:{
        user:process.env.GMAIL_USER,
        pass:process.env.GMAIL_APP_PASSWORD
    }
})

export const Token = ()=>{
    return crypto.randomBytes(32).toString("hex")
}

export const sendVerificationEmail = async(email:string ,token:string):Promise<void> => {
try{
//const user =await prisma.user.findUnique({
//	where:{id:userId},
//select:{email:true, username: true}
//})
//if (!user || !user.email){
//throw new Error("User not found or missing email");
//}

const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`
const mailOptions={
    from:` "Karabo" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Welcome, ${email}`,
    html:`
    <div style = "font-family: Arial,sans-serif;max-width: 600px; margin:0 auto">
    <h1>Thank you for try this out here's your  verification url ${verificationUrl}</h1>
    
    </div>`
};

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent  to ${email}`)
}catch(error){
    console.error("Error sending verification email:",error);
    throw error
}
};
export const genOTP =()=>{
        return Math.floor(10000 + Math.random() * 900000).toString();
}


export const  SendResetPasswordOTP = async (email:string , otp:string):Promise<void> =>{
        const mailOptions={
                from:`"Karabo"${process.env.RESET_EMAIL_USER}`,
                to:email,
                subject:"Password Reset OTP",
                html:`<div style="font-style:Arial,sans-serif;
                max-width:600px;margin: 0 auto;">

                <h1 style="color: #333;">Password Reset request</h1>

                <p>Your password reset OTP is: ${otp}.this OPT will expire in 10minutes.</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; margin:20px 0;">
                <h1 style="margin: 0; color: #0066cc;">${otp}</h1>
                </div>
                <p>This OTP will expire in 10 minutes.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style ="font-style: 12px; color: #777; ">This is an automated message,please do not reply.</p>
                </div>
                `
        };
        try{
                await transporter.sendMail(mailOptions);
                console.log(`${otp} was sent to ${email}`)
        }catch(err){
                        console.error("Couldnt send email sorry:",err)
                        throw  new Error("try again later")
                }
}



export const sendWelcomeEmail =async(userId: string):Promise<void> =>{
const user =await prisma.user.findUnique({
where:{id:userId},
select:{email:true, username:true}
})
if (!user || !user.email){
throw new Error("user not found or missing email")
}
}
