"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { supabase } from "../../lib/supabase";

export default function SignUp() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Step 2: Personal Details
    age: "",
    gender: "",
    occupation: "",
    education_level: "",
    location: "",
    avatar_url: "",
    static_avatar_url: "",
    // Step 3: Financial
    monthly_income: "",
    // Step 4: Terms
    tc_pp_agreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState<{ [key: number]: boolean }>({});
  const [loadedGifs, setLoadedGifs] = useState<{ [key: number]: boolean }>({});
  const [hoveredAvatar, setHoveredAvatar] = useState<number | null>(null);
  const heroGradient = 'linear-gradient(135deg, #2b1b55 0%, #8648d0 60%)';

  // Avatar configuration: static preview (local for display, ImageKit for database) + GIF (ImageKit, for database)
  const avatars = [
    {
      static: "/assets/images/static_prof1.png", // Local for fast preview
      staticUrl: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof1.png", // ImageKit URL for database
      gif: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof.gif?updatedAt=1765300897707",
    },
    {
      static: "/assets/images/static_prof2.png",
      staticUrl: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof2.png",
      gif: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof2.gif",
    },
    {
      static: "/assets/images/static_prof3.jpg",
      staticUrl: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof3.jpg",
      gif: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof3.gif",
    },
    {
      static: "/assets/images/static_prof4.png",
      staticUrl: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/static_prof4.png",
      gif: "https://ik.imagekit.io/j1lc6xx4i/BrokeNoMore/prof4.gif",
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.full_name || !formData.email || !formData.password || !formData.confirmPassword) {
          setError("Please fill in all fields");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return false;
        }
        break;
      case 2:
        if (!formData.age || !formData.gender || !formData.occupation || !formData.education_level || !formData.location || !formData.avatar_url || !formData.static_avatar_url) {
          setError("Please fill in all fields and select an avatar");
          return false;
        }
        break;
      case 3:
        if (!formData.monthly_income) {
          setError("Please enter your monthly income");
          return false;
        }
        break;
      case 4:
        if (!formData.tc_pp_agreed) {
          setError("Please agree to Terms & Conditions and Privacy Policy");
          return false;
        }
        break;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
      setError("Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: authData.user.id,
            full_name: formData.full_name,
            email: formData.email,
            age: parseInt(formData.age),
            gender: formData.gender,
            occupation: formData.occupation,
            education_level: formData.education_level,
            location: formData.location,
            monthly_income: parseFloat(formData.monthly_income),
            avatar_url: formData.avatar_url,
            static_avatar_url: formData.static_avatar_url,
            tc_pp_agreed: formData.tc_pp_agreed,
            is_completed: true,
          },
        ]);

      if (profileError) throw profileError;

      // Redirect based on returnTo query param or default to pricing
      const searchParams = new URLSearchParams(window.location.search);
      const returnTo = searchParams.get('returnTo') || '/pricing';
      router.push(returnTo);
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div style={{ background: heroGradient }}>
        <Navbar />
        <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center p-1 bg-white">
                <Image
                  src="/assets/images/main_logo.png"
                  alt="BrokeNoMore"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-white text-2xl font-bold">BrokeNoMore</span>
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step
                        ? "bg-white text-[#6B46C1]"
                        : "bg-white/30 text-white"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        currentStep > step ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center text-white">
              <p className="text-sm">
                Step {currentStep} of 4:{" "}
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "Personal Details"}
                {currentStep === 3 && "Financial Information"}
                {currentStep === 4 && "Terms & Conditions"}
              </p>
            </div>
          </div>

          {/* Sign Up Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600 mb-8">Get started with BrokeNoMore today!</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <>
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                        placeholder="Create a password (min. 6 characters)"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Personal Details */}
              {currentStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                      Choose Your Avatar *
                    </label>
                    <div className="grid grid-cols-4 gap-4 mb-6 justify-items-center max-w-2xl mx-auto">
                      {avatars.map((avatar, index) => {
                        const isSelected = formData.avatar_url === avatar.gif;
                        // Show GIF only on hover, static image otherwise
                        const showGif = hoveredAvatar === index;
                        const imageUrl = showGif ? avatar.gif : avatar.static;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!avatarErrors[index]) {
                                setFormData({ 
                                  ...formData, 
                                  avatar_url: avatar.gif,
                                  static_avatar_url: avatar.staticUrl
                                });
                                setError("");
                              }
                            }}
                            onMouseEnter={() => {
                              setHoveredAvatar(index);
                              // Preload GIF on hover
                              if (!loadedGifs[index]) {
                                const img = document.createElement('img');
                                img.src = avatar.gif;
                                img.onload = () => {
                                  setLoadedGifs((prev) => ({ ...prev, [index]: true }));
                                };
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredAvatar(null);
                            }}
                            disabled={avatarErrors[index]}
                            className={`relative w-24 h-24 rounded-full border-4 transition-all duration-300 ${
                              avatarErrors[index]
                                ? "border-gray-200 opacity-50 cursor-not-allowed"
                                : isSelected
                                ? "border-[#6B46C1] ring-4 ring-[#6B46C1]/30 scale-110"
                                : "border-gray-200 hover:border-[#8648d0] hover:scale-105"
                            }`}
                          >
                            <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                              {avatarErrors[index] ? (
                                <div className="text-center">
                                  <svg
                                    className="w-8 h-8 text-gray-400 mx-auto"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <>
                                  <img
                                    src={imageUrl}
                                    alt={`Avatar ${index + 1}`}
                                    className="w-full h-full object-cover rounded-full"
                                    onError={() => {
                                      setAvatarErrors((prev) => ({ ...prev, [index]: true }));
                                    }}
                                    loading={index < 2 ? "eager" : "lazy"}
                                  />
                                  {/* Show GIF indicator when static is shown but GIF is available */}
                                  {!showGif && !avatarErrors[index] && (
                                    <div className="absolute bottom-0 right-0 bg-[#6B46C1] text-white text-xs px-1.5 py-0.5 rounded-full">
                                      GIF
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            {isSelected && !avatarErrors[index] && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#6B46C1] rounded-full flex items-center justify-center shadow-lg">
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!formData.avatar_url && (
                      <p className="text-sm text-red-600 mb-4 text-center">Please select an avatar</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                      placeholder="Enter your age"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
                      Occupation *
                    </label>
                    <input
                      type="text"
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                      placeholder="Enter your occupation"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="education_level" className="block text-sm font-medium text-gray-700 mb-2">
                      Education Level *
                    </label>
                    <select
                      id="education_level"
                      name="education_level"
                      value={formData.education_level}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                      required
                    >
                      <option value="">Select education level</option>
                      <option value="High School">High School</option>
                      <option value="Some College">Some College</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate">Doctorate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                      placeholder="Enter your city, state, or country"
                      required
                    />
                  </div>
                </>
              )}

              {/* Step 3: Financial Information */}
              {currentStep === 3 && (
                <>
                  <div>
                    <label htmlFor="monthly_income" className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Income (INR) *
                    </label>
                    <input
                      type="number"
                      id="monthly_income"
                      name="monthly_income"
                      value={formData.monthly_income}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B46C1] focus:border-transparent outline-none transition text-gray-900"
                      placeholder="Enter your monthly income"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      This information helps us provide personalized financial recommendations.
                    </p>
                  </div>
                </>
              )}

              {/* Step 4: Terms & Conditions */}
              {currentStep === 4 && (
                <>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                    <div className="text-sm text-gray-600 space-y-2 mb-4 max-h-60 overflow-y-auto">
                      <p>
                        By creating an account with BrokeNoMore, you agree to the following terms:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>You are at least 18 years old</li>
                        <li>All information provided is accurate and truthful</li>
                        <li>You will maintain the security of your account</li>
                        <li>You understand our privacy policy regarding your data</li>
                        <li>You agree to receive important account notifications</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      id="tc_pp_agreed"
                      name="tc_pp_agreed"
                      type="checkbox"
                      checked={formData.tc_pp_agreed}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#6B46C1] border-gray-300 rounded focus:ring-[#6B46C1] mt-1"
                      required
                    />
                    <label htmlFor="tc_pp_agreed" className="ml-2 text-sm text-gray-600">
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="text-[#6B46C1] hover:underline">
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" target="_blank" className="text-[#6B46C1] hover:underline">
                        Privacy Policy
                      </Link>
                      *
                    </label>
                  </div>
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-[#6B46C1] text-white py-3 rounded-lg font-semibold hover:bg-[#553C9A] transition"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#6B46C1] text-white py-3 rounded-lg font-semibold hover:bg-[#553C9A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/signin" className="text-[#6B46C1] font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
