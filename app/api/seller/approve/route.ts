import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { z } from "zod"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"

// Input validation schema
const approveSellerSchema = z.object({
  email: z.string().email(),
  requestId: z.string().optional(), // MongoDB ObjectId
})

// Authorization middleware
async function authorizeAdmin(session: Session | null) {
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  
  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Admin access required")
  }
  
  return session.user
}

export async function POST(req: NextRequest) {
  try {
    // Get admin session
    const session = await getServerSession()
    await authorizeAdmin(session)

    const body = await req.json()
    const validatedData = approveSellerSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: "Invalid input data",
          details: validatedData.error.errors 
        },
        { status: 400 }
      )
    }

    const { email, requestId } = validatedData.data
    const db = await getDb()
    const adminUser = session!.user

    // Transaction for atomicity
    const result = await db.collection("seller_requests").findOneAndUpdate(
      {
        ...(requestId && { _id: requestId }),
        email: email.toLowerCase().trim(),
        status: "pending" // Only approve pending requests
      },
      { 
        $set: { 
          status: "approved" as const,
          approvedBy: adminUser.id || adminUser.email,
          approvedAt: new Date(),
          updatedAt: new Date()
        } 
      },
      { 
        returnDocument: "after",
        projection: { _id: 1, email: 1 }
      }
    )

    if (!result.value) {
      return NextResponse.json(
        { error: "Request not found or already processed" },
        { status: 404 }
      )
    }

    // Update user role (if user exists)
    const userUpdateResult = await db.collection("users").updateOne(
      { 
        email: email.toLowerCase().trim(),
        role: { $ne: "seller" } // Don't overwrite if already seller
      },
      { 
        $set: { 
          role: "seller",
          sellerApprovedAt: new Date(),
          updatedAt: new Date()
        },
        $setOnInsert: {
          email: email.toLowerCase().trim(),
          createdAt: new Date()
        }
      },
      { upsert: true }
    )

    // Log admin action for audit trail
    await db.collection("admin_logs").insertOne({
      action: "approve_seller",
      adminId: adminUser.id || adminUser.email,
      adminEmail: adminUser.email,
      targetEmail: email,
      requestId: result.value._id,
      ipAddress: req.ip || req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "",
      timestamp: new Date(),
      metadata: {
        userCreated: userUpdateResult.upsertedId ? true : false,
        userModified: userUpdateResult.modifiedCount > 0
      }
    })

    // Send approval email to seller
    // (You can add this using the same email service from previous endpoint)

    return NextResponse.json({ 
      message: "Seller approved successfully",
      requestId: result.value._id,
      userCreated: !!userUpdateResult.upsertedId
    })

  } catch (error: any) {
    console.error("APPROVE SELLER ERROR:", error)

    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (error.message === "Forbidden: Admin access required") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}