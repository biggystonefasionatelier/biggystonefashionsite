import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const defaultType = type === "wholesale" ? "wholesale" : "retail";

  return (
    <div>
      <h1 className="text-2xl font-bold">Add product</h1>
      <ProductForm defaultProductType={defaultType} />
    </div>
  );
}
