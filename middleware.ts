
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Aquí puedes agregar lógica adicional si es necesario
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agenda/:path*",
    "/pacientes/:path*",
    "/expedientes/:path*",
    "/facturacion/:path*",
    "/reportes/:path*",
    "/configuracion/:path*",
  ],
};
