import { notFound } from "next/navigation";
import { getProductById } from "@/lib/products";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit product</h1>
      <ProductForm product={product} />
    </div>
  );
}
