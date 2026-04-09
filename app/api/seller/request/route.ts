import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import nodemailer from "nodemailer"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit" // You'll need to implement this

// Input validation schema
const sellerRequestSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  phone: z.string().optional().max(20),
})

// Rate limiting (implement this middleware)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per IP
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
    await limiter(req, null as any) // Adjust based on your rate-limit impl

    const body = await req.json()
    const validatedData = sellerRequestSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Invalid input data",
          details: validatedData.error.errors 
        },
        { status: 400 }
      )
    }

    const { name, email, phone } = validatedData.data

    const db = await getDb()

    // Check for duplicate recent requests (spam prevention)
    const recentRequest = await db.collection("seller_requests").findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
    })

    if (recentRequest) {
      return NextResponse.json(
        { error: "You have already submitted a request recently. Please wait 24 hours." },
        { status: 429 }
      )
    }

    // Save request in DB with better structure
    const requestData = await db.collection("seller_requests").insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      status: "pending" as const,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send email with HTML template
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    })

    await transporter.sendMail({
      from: `"Seller Requests" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER!,
      replyTo: email,
      subject: `New Seller Request #${requestData.insertedId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Seller Request</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>ID:</strong> ${requestData.insertedId}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #666;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/seller-requests/${requestData.insertedId}" 
               style="background: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View in Admin
            </a>
          </p>
        </div>
      `,
      text: `New seller request #${requestData.insertedId}

Name: ${name}
Email: ${email}
Phone: ${phone || "N/A"}
IP: ${ip}
Date: ${new Date().toLocaleString()}`,
    })

    return NextResponse.json({ 
      message: "Request sent successfully",
      id: requestData.insertedId 
    })

  } catch (error: any) {
    console.error("SELLER REQUEST ERROR:", error)

    // Handle rate limit exceeded
    if (error.message?.includes("Rate limit exceeded")) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}