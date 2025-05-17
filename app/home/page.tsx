"use server";
import { auth } from "@clerk/nextjs/server";
import FeaturedProducts from "./components/featured-products";
import Footer from "./components/footer";
import Header from "./components/header";
import HeroSection from "./components/hero-section";
import Testimonial from "./components/testimonial";

export default async function HomePage() {
  // Get user's role from session claims
  const { sessionClaims} = await auth();

  // Define metadata type
  type UserMetadata = {
    role?: "customer" | "employee" | "admin";
  };

  // Get user role from session claims
  const metadata = (sessionClaims?.metadata as UserMetadata) || {};
  const role = metadata.role;

  // Check if user is admin or employee
  const isAdmin = role === "admin";
  const isEmployee = role === "employee";

  return (
    <>
      <Header />
      <HeroSection />
      {!isAdmin && !isEmployee && <FeaturedProducts />}
      <Testimonial />
      <Footer />
    </>
  );
}
