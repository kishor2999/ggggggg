import type { Metadata } from "next";
import UserProductsClient from "./user-products-client";

export const metadata: Metadata = {
  title: "Shop Products | SparkleWash",
  description: "Browse and purchase car care products",
};

export default function UserProductsPage() {
  return <UserProductsClient />;
}
