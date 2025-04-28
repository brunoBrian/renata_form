"use client";

export const verifyReCaptchaToken = async (token) => {
  try {
    const response = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    return {
      success: data.success,
      score: data.score,
    };
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return { success: false };
  }
};
