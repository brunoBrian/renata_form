import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token is required" },
        { status: 400 }
      );
    }

    // Verify the token with Google reCAPTCHA API
    const verificationResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      }
    );

    const recaptchaResult = await verificationResponse.json();

    // For debugging: Log the result (in production, you'd want to remove or limit this)
    console.log("reCAPTCHA verification result:", recaptchaResult);

    // Check if verification was successful
    if (!recaptchaResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "reCAPTCHA verification failed",
          errors: recaptchaResult.error_codes,
        },
        { status: 400 }
      );
    }

    // Optional: Check the score (for v3)
    // Google recommends a threshold of 0.5 by default
    if (recaptchaResult.score !== undefined && recaptchaResult.score < 0.5) {
      return NextResponse.json(
        {
          success: false,
          message: "reCAPTCHA score too low",
          score: recaptchaResult.score,
        },
        { status: 400 }
      );
    }

    // Return success if all checks pass
    return NextResponse.json({
      success: true,
      score: recaptchaResult.score,
      action: recaptchaResult.action,
    });
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
