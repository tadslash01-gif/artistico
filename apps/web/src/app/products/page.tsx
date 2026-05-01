import { redirect } from "next/navigation";

export default function ProductsPage() {
  redirect("/browse?type=product");
}
