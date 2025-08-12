
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      especialidad?: string;
    };
  }

  interface User {
    id: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    especialidad?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    especialidad?: string;
  }
}
