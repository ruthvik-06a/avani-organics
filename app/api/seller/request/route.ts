import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import nodemailer from "nodemailer"
import { z } from "zod"

// Input validation schema
const sellerRequestSchema = z.object({
  name: z.string().min(2).max(100).transform((val) => val.trim()),
  email: z.string().email().transform((val) => val.trim().toLowerCase()),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number")
    .max(20)
    .transform((val) => val.trim())
    .optional(),
})

// Rate limit
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 500

function rateLimitMiddleware(req: NextRequest): boolean {
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()
  const key = `rate:${ip}`

  if (requestCounts.has(key)) {
    const record = requestCounts.get(key)!
    if (now < record.resetTime) {
      if (record.count >= MAX_REQUESTS) {
        return false
      }
      record.count++
    } else {
      requestCounts.set(key, { count: 1, resetTime: now + WINDOW_MS })
    }
  } else {
    requestCounts.set(key, { count: 1, resetTime: now + WINDOW_MS })
  }

  return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"

    if (!rateLimitMiddleware(req)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const validatedData = sellerRequestSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validatedData.error.errors,
        },
        { status: 400 }
      )
    }

    const { name, email, phone } = validatedData.data
    const db = await getDb()

    const recentRequest = await db.collection("seller_requests").findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })

    if (recentRequest) {
      return NextResponse.json(
        { error: "You have already submitted a request recently. Please wait 24 hours." },
        { status: 429 }
      )
    }

    const requestData = await db.collection("seller_requests").insertOne({
      name,
      email,
      phone: phone || "",
      status: "pending" as const,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const transporter = nodemailer.createTransport({
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
      subject: `New Seller Request #${requestData.insertedId.toString().slice(-6)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Seller Request</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>ID:</strong> ${requestData.insertedId.toString()}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <!-- ✅ APPROVE BUTTON ADDED -->
          <div style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/approve?requestId=${requestData.insertedId}"
               style="background: green; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
               Approve Seller
            </a>
          </div>
        </div>
      `,
      text: `New seller request #${requestData.insertedId.toString()}

Name: ${name}
Email: ${email}
Phone: ${phone || "N/A"}
IP: ${ip}
Date: ${new Date().toLocaleString()}`,
    })

    return NextResponse.json({
      message: "Request sent successfully",
      id: requestData.insertedId.toString(),
    })

  } catch (error: any) {
    console.error("SELLER REQUEST ERROR:", error)

    if (error.message?.includes("Rate limit")) {
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