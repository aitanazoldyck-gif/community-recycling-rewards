/**
 * Authentication Error Handler
 * Provides comprehensive error handling for authentication operations
 */

export type AuthErrorType =
  | "CredentialsSignin"
  | "EmailNotVerified"
  | "AccountInactive"
  | "AccountDeleted"
  | "NetworkError"
  | "ServerError"
  | "RateLimitError"
  | "EmailAlreadyExists"
  | "InvalidInput"
  | "DatabaseError"
  | "UnknownError";

export interface AuthError {
  type: AuthErrorType;
  message: string;
  userFriendlyMessage: string;
  originalError?: any;
}

/**
 * Handle authentication errors and convert them to user-friendly messages
 */
export function handleAuthError(error: any): AuthError {
  const errorCode =
    typeof error === "string"
      ? error
      : typeof error?.error === "string"
        ? error.error
        : error?.code;

  if (errorCode === "CredentialsSignin") {
    return {
      type: "CredentialsSignin",
      message: "Invalid credentials",
      userFriendlyMessage: "Invalid email or password. Please check your credentials and try again.",
      originalError: error,
    };
  }

  if (errorCode === "email_not_verified") {
    return {
      type: "EmailNotVerified",
      message: "Email not verified",
      userFriendlyMessage: "Please verify your email address before signing in. Check your inbox for the verification link.",
      originalError: error,
    };
  }

  // Handle specific NextAuth error codes
  if (error?.type) {
    switch (error.type) {
      case "CredentialsSignin":
        return {
          type: "CredentialsSignin",
          message: "Invalid credentials",
          userFriendlyMessage: "Invalid email or password. Please check your credentials and try again.",
          originalError: error,
        };

      case "EmailNotVerified":
        return {
          type: "EmailNotVerified",
          message: "Email not verified",
          userFriendlyMessage: "Please verify your email address before signing in. Check your inbox for the verification link.",
          originalError: error,
        };

      case "AccountInactive":
        return {
          type: "AccountInactive",
          message: "Account inactive",
          userFriendlyMessage: "Your account has been deactivated. Please contact support for assistance.",
          originalError: error,
        };

      case "AccountDeleted":
        return {
          type: "AccountDeleted",
          message: "Account deleted",
          userFriendlyMessage: "This account has been deleted. Please contact support if you believe this is an error.",
          originalError: error,
        };

      case "EmailAlreadyExists":
        return {
          type: "EmailAlreadyExists",
          message: "Email already exists",
          userFriendlyMessage: "An account with this email already exists. Please sign in or use a different email.",
          originalError: error,
        };

      case "InvalidInput":
        return {
          type: "InvalidInput",
          message: "Invalid input",
          userFriendlyMessage: "Please check your input and try again. Make sure all fields are filled correctly.",
          originalError: error,
        };
    }
  }

  // Handle specific error codes
  if (error?.code) {
    switch (error.code) {
      case "email_not_verified":
        return {
          type: "EmailNotVerified",
          message: "Email not verified",
          userFriendlyMessage: "Please verify your email address before signing in. Check your inbox for the verification link.",
          originalError: error,
        };

      case "RATE_LIMIT_EXCEEDED":
        return {
          type: "RateLimitError",
          message: "Rate limit exceeded",
          userFriendlyMessage: "Too many login attempts. Please wait a few minutes before trying again.",
          originalError: error,
        };

      case "EMAIL_ALREADY_EXISTS":
        return {
          type: "EmailAlreadyExists",
          message: "Email already exists",
          userFriendlyMessage: "An account with this email already exists. Please sign in or use a different email.",
          originalError: error,
        };
    }
  }

  // Handle error messages
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes("email already exists") || message.includes("duplicate key")) {
      return {
        type: "EmailAlreadyExists",
        message: "Email already exists",
        userFriendlyMessage: "An account with this email already exists. Please sign in or use a different email.",
        originalError: error,
      };
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return {
        type: "InvalidInput",
        message: "Invalid input",
        userFriendlyMessage: "Please check your input and try again. Make sure all fields are filled correctly.",
        originalError: error,
      };
    }
  }

  // Handle network errors
  if (error?.name === "NetworkError" || error?.message?.includes("fetch") || error?.message?.includes("network")) {
    return {
      type: "NetworkError",
      message: "Network error",
      userFriendlyMessage: "Network connection error. Please check your internet connection and try again.",
      originalError: error,
    };
  }

  // Handle database errors
  if (error?.code === "ECONNREFUSED" || error?.message?.includes("database") || error?.message?.includes("ECONNREFUSED")) {
    return {
      type: "DatabaseError",
      message: "Database connection error",
      userFriendlyMessage: "Unable to connect to the database. Please ensure the database is running and try again.",
      originalError: error,
    };
  }

  // Handle server errors (5xx)
  if (error?.status >= 500 || error?.message?.includes("server") || error?.message?.includes("500")) {
    return {
      type: "ServerError",
      message: "Server error",
      userFriendlyMessage: "Server error occurred. Please try again later or contact support if the problem persists.",
      originalError: error,
    };
  }

  // Default unknown error
  return {
    type: "UnknownError",
    message: "Unknown error",
    userFriendlyMessage: "An unexpected error occurred. Please try again or contact support if the problem persists.",
    originalError: error,
  };
}

/**
 * Show error toast based on authentication error
 */
export function showAuthErrorToast(error: any) {
  const authError = handleAuthError(error);
  
  // Use different toast styles based on error type
  switch (authError.type) {
    case "EmailNotVerified":
      return {
        title: "Email Verification Required",
        message: authError.userFriendlyMessage,
        variant: "warning" as const,
      };

    case "AccountInactive":
    case "AccountDeleted":
      return {
        title: "Account Issue",
        message: authError.userFriendlyMessage,
        variant: "error" as const,
      };

    case "NetworkError":
      return {
        title: "Connection Error",
        message: authError.userFriendlyMessage,
        variant: "warning" as const,
      };

    case "RateLimitError":
      return {
        title: "Too Many Attempts",
        message: authError.userFriendlyMessage,
        variant: "warning" as const,
      };

    case "EmailAlreadyExists":
      return {
        title: "Email Already Registered",
        message: authError.userFriendlyMessage,
        variant: "warning" as const,
      };

    case "InvalidInput":
      return {
        title: "Invalid Information",
        message: authError.userFriendlyMessage,
        variant: "warning" as const,
      };

    case "DatabaseError":
      return {
        title: "Database Connection Error",
        message: authError.userFriendlyMessage,
        variant: "error" as const,
      };

    case "ServerError":
      return {
        title: "Server Error",
        message: authError.userFriendlyMessage,
        variant: "error" as const,
      };

    default:
      return {
        title: "Authentication Failed",
        message: authError.userFriendlyMessage,
        variant: "error" as const,
      };
  }
}

/**
 * Handle login error specifically
 */
export function handleLoginError(error: any): string {
  const authError = handleAuthError(error);

  // Return concise message for inline display
  switch (authError.type) {
    case "CredentialsSignin":
      return "Invalid email or password";
    case "EmailNotVerified":
      return "Please verify your email";
    case "AccountInactive":
      return "Account is inactive";
    case "AccountDeleted":
      return "Account has been deleted";
    case "NetworkError":
      return "Connection error";
    case "RateLimitError":
      return "Too many attempts";
    case "ServerError":
      return "Server error";
    case "EmailAlreadyExists":
      return "Email already exists";
    case "InvalidInput":
      return "Invalid information";
    case "DatabaseError":
      return "Database connection error";
    default:
      return "Login failed";
  }
}
