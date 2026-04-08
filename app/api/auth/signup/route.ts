import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/mongodb"
import { createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const users = db.collection("users")

<<<<<<< HEAD
    const normalizedEmail = String(email).toLowerCase().trim()

    const existingUser = await users.findOne({ email: normalizedEmail })
=======
    const existingUser = await users.findOne({ email: email.toLowerCase() })
>>>>>>> 09d70a3 (final working version)
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

<<<<<<< HEAD
    const hashedPassword = await bcrypt.hash(String(password), 12)

    const result = await users.insertOne({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : null,
=======
    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await users.insertOne({
      name,
      email: email.toLowerCase(),
      phone: phone || null,
>>>>>>> 09d70a3 (final working version)
      password: hashedPassword,
      createdAt: new Date(),
    })

    await createSession({
      userId: result.insertedId.toString(),
<<<<<<< HEAD
      name: String(name).trim(),
      email: normalizedEmail,
    })

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          name: String(name).trim(),
          email: normalizedEmail,
        },
      },
=======
      name,
      email: email.toLowerCase(),
    })

    return NextResponse.json(
      { message: "Account created successfully", user: { name, email } },
>>>>>>> 09d70a3 (final working version)
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
<<<<<<< HEAD

    const message =
      error instanceof Error ? error.message : "Unknown signup error"

    return NextResponse.json(
      { error: message },
=======
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
>>>>>>> 09d70a3 (final working version)
      { status: 500 }
    )
  }
}
