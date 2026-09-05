/**
 * Mock Authentication for Development
 * This provides a fallback authentication system when database is not available
 */

const MOCK_USERS = [
  {
    id: "admin-001",
    email: "admin@example.com",
    password: "Admin123!",
    name: "System Admin",
    role: "ADMIN",
    emailVerified: new Date(),
    isActive: true,
  },
  {
    id: "staff-001",
    email: "staff@example.com",
    password: "Staff123!",
    name: "Collection Staff",
    role: "COLLECTION_STAFF",
    emailVerified: new Date(),
    isActive: true,
  },
  {
    id: "resident-001",
    email: "resident@example.com",
    password: "Resident123!",
    name: "Juan Dela Cruz",
    role: "RESIDENT",
    emailVerified: new Date(),
    isActive: true,
  },
];

/**
 * Authenticate user with mock credentials
 */
export async function mockAuthenticate(email: string, password: string) {
  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return {
      success: false as const,
      error: "Invalid email or password",
    };
  }

  if (!user.isActive) {
    return {
      success: false as const,
      error: "Account is inactive",
    };
  }

  return {
    success: true as const,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  };
}

/**
 * Check if mock authentication should be used
 */
export function shouldUseMockAuth(): boolean {
  return (
    process.env.MOCK_AUTH === "true" &&
    (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("localhost"))
  );
}

/**
 * Get mock user by email
 */
export function getMockUser(email: string) {
  return MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
