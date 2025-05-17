"use server";
import Header from "./components/header";
import HeroSection from "./components/hero-section";
import FeaturedProducts from "./components/featured-products";
import Testimonial from "./components/testimonial";
import Footer from "./components/footer";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  // Get user's role from session claims
  const { sessionClaims } = await auth();

  // Define metadata type
  type UserMetadata = {
    role?: "customer" | "employee" | "admin";
  };

  // Get user role from session claims
  const metadata = (sessionClaims?.metadata as UserMetadata) || {};
  const role = metadata.role;

  // Check if user is admin
  const isAdmin = role === "admin";

  return (
    <>
      <Header />
      <HeroSection />
      {!isAdmin && <FeaturedProducts />}
      <Testimonial />
      <Footer />
    </>
  );
}
