import { DealDetailContent } from "@/components/DealDetailContent";
import { getDealById, getDeals } from "@/lib/mockDeals";

type DealDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getDeals().map((deal) => ({ id: deal.id }));
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = await params;
  const fallbackDeal = getDealById(id) ?? null;

  return <DealDetailContent dealId={id} fallbackDeal={fallbackDeal} />;
}
