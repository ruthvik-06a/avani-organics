"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"

type FormData = {
  name: string
  email: string
  phone: string
}

export default function SellerPage() {
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
    } else if (form.name.length > 100) {
      newErrors.name = "Name is too long"
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (form.phone && form.phone.length > 20) {
      newErrors.phone = "Phone number is too long"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fix the errors above")
      return
    }

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
        toast.success(
          "🎉 Request sent successfully! We'll review it within 24 hours.",
          { duration: 6000 }
        )
        setForm({ name: "", email: "", phone: "" })
        setSubmitted(true)
        // Optional: redirect to thank you page after delay
        // setTimeout(() => router.push("/thank-you"), 3000)
      } else {
        // Handle specific API errors
        if (data.error.includes("recently")) {
          toast.error("You've already submitted a request recently. Please wait 24 hours.")
        } else if (data.error.includes("Too many requests")) {
          toast.error("Too many requests. Please wait a moment and try again.")
        } else {
          toast.error(data.error || "Something went wrong. Please try again.")
        }
      }
    } catch (error) {
      console.error("Seller request error:", error)
      toast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setForm(prev => ({ ...prev, [field]: value }))
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: "" }))
      }
    }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-3xl flex items-center justify-center">
            <svg 
              className="h-12 w-12 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Request Submitted!
            </h2>
            <p className="text-lg text-gray-600">
              Thank you for your interest! Our team will review your application 
              and contact you within 24 hours.
            </p>
          </div>

          <button
            onClick={() => {
              setSubmitted(false)
              setForm({ name: "", email: "", phone: "" })
            }}
            className="
              w-full bg-gradient-to-r from-green-600 to-green-700 
              hover:from-green-700 hover:to-green-800 
              text-white font-medium py-3 px-6 rounded-xl 
              transition-all duration-200 hover:shadow-xl
              focus:outline-none focus:ring-4 focus:ring-green-500
            "
          >
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 space-y-8">
        {/* Header */}
        <div className="text-center pb-8 border-b border-gray-100">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <svg 
              className="h-8 w-8 text-white" 
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
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Become a Seller
          </h1>
          <p className="mt-3 text-lg text-gray-600 leading-relaxed">
            Join our marketplace. Submit your request and get approved in 24 hours.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleInputChange("name")}
              disabled={isLoading}
              autoComplete="name"
              className={`
                w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl 
                focus:ring-4 focus:ring-green-500 focus:border-green-500
                focus:outline-none transition-all duration-300
                placeholder-gray-400
                ${errors.name 
                  ? "border-red-300 bg-red-50 focus:ring-red-400 focus:border-red-400" 
                  : "hover:border-gray-300"
                }
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleInputChange("email")}
              disabled={isLoading}
              autoComplete="email"
              className={`
                w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl 
                focus:ring-4 focus:ring-green-500 focus:border-green-500
                focus:outline-none transition-all duration-300
                placeholder-gray-400
                ${errors.email 
                  ? "border-red-300 bg-red-50 focus:ring-red-400 focus:border-red-400" 
                  : "hover:border-gray-300"
                }
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-3">
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={form.phone}
              onChange={handleInputChange("phone")}
              disabled={isLoading}
              autoComplete="tel"
              className="
                w-full px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl 
                focus:ring-4 focus:ring-green-500 focus:border-green-500
                focus:outline-none transition-all duration-300
                placeholder-gray-400 hover:border-gray-300
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            />
            {errors.phone && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || Object.keys(errors).length > 0}
            className="
              w-full bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-700 
              hover:from-emerald-700 hover:via-emerald-700 hover:to-green-800
              text-white font-semibold text-lg py-5 px-8 rounded-2xl 
              transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02]
              focus:outline-none focus:ring-4 focus:ring-emerald-500/50
              shadow-2xl hover:shadow-3xl
              disabled:from-gray-400 disabled:to-gray-500 
              disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg
            "
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-4 h-6 w-6 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Request...
              </>
            ) : (
              <>
                <svg className="inline mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                </svg>
                Submit Seller Request
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="pt-8 border-t border-gray-100 text-center text-xs space-y-2 text-gray-500">
          <p>🔒 Your data is secure and private</p>
          <p>📧 We'll send you a confirmation email</p>
          <p>⚡ Approval within 24 hours</p>
        </div>
      </div>
    </div>
  )
}