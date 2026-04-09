"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast" // or your preferred toast library

type FormData = {
  name: string
  email: string
  phone: string
}

export default function SellerRequestForm() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const router = useRouter()

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = "Name is required"
    } else if (form.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setSubmitted(false)

    try {
      const res = await fetch("/api/seller/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Request sent successfully! We'll review it soon.", {
          duration: 5000,
        })
        setForm({ name: "", email: "", phone: "" })
        setSubmitted(true)
        // Optional: redirect after 2 seconds
        setTimeout(() => router.push("/thank-you"), 2000)
      } else {
        toast.error(data.error || "Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: "" }))
      }
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <svg 
              className="h-8 w-8 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Become a Seller
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Submit your request and our team will review it within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Request Submitted!</h2>
            <p className="text-gray-600">Thank you! We'll contact you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={handleInputChange("name")}
                disabled={isLoading}
                className={`
                  w-full px-4 py-3 border border-gray-300 rounded-xl 
                  focus:ring-2 focus:ring-green-500 focus:border-green-500
                  transition-all duration-200
                  ${errors.name ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleInputChange("email")}
                disabled={isLoading}
                className={`
                  w-full px-4 py-3 border border-gray-300 rounded-xl 
                  focus:ring-2 focus:ring-green-500 focus:border-green-500
                  transition-all duration-200
                  ${errors.email ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={handleInputChange("phone")}
                disabled={isLoading}
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-xl 
                  focus:ring-2 focus:ring-green-500 focus:border-green-500
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !validateForm()}
              className="
                w-full bg-gradient-to-r from-green-600 to-green-700 
                hover:from-green-700 hover:to-green-800 
                text-white font-medium py-4 px-6 rounded-xl 
                transition-all duration-200 transform hover:scale-[1.02]
                focus:outline-none focus:ring-4 focus:ring-green-500
                disabled:from-gray-400 disabled:to-gray-500 
                disabled:cursor-not-allowed disabled:transform-none
                shadow-lg hover:shadow-xl
              "
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-gray-500 space-y-2">
          <p>• Requests are reviewed within 24 hours</p>
          <p>• You&apos;ll receive an email confirmation</p>
        </div>
      </div>
    </div>
  )
}