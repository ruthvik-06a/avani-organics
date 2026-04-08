import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/mongodb"
import { createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const db = await getDb()
    const users = db.collection("users")

<<<<<<< HEAD
    const user = await users.findOne({ email: String(email).toLowerCase().trim() })

=======
    const user = await users.findOne({ email: email.toLowerCase() })
>>>>>>> 09d70a3 (final working version)
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

<<<<<<< HEAD
    if (!user.password) {
      return NextResponse.json(
        { error: "This account does not have a password set." },
        { status: 400 }
      )
    }

    const passwordMatch = await bcrypt.compare(String(password), user.password)

=======
    const passwordMatch = await bcrypt.compare(password, user.password)
>>>>>>> 09d70a3 (final working version)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    await createSession({
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
    })

    return NextResponse.json(
<<<<<<< HEAD
      {
        message: "Logged in successfully",
        user: {
          name: user.name,
          email: user.email,
        },
      },
=======
      { message: "Logged in successfully", user: { name: user.name, email: user.email } },
>>>>>>> 09d70a3 (final working version)
      { status: 200 }
    )
  } catch (error) {
    console.error("Login error:", error)
<<<<<<< HEAD

    const message =
      error instanceof Error ? error.message : "Unknown login error"

    return NextResponse.json(
      {
        error: message,
      },
=======
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
>>>>>>> 09d70a3 (final working version)
      { status: 500 }
    )
  }
}
