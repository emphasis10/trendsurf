import { notFound } from 'next/navigation';
import { PaperDetailView } from '../../../../components/papers/PaperDetailView';
import { ApiError } from '../../../../lib/api-client';
import { fetchPaperDetail } from '../../../../lib/data-fetchers';

interface PaperPageProps {
  params: { paperId: string };
}

export const metadata = {
  title: 'Paper detail - TrendSurf'
};

export default async function PaperDetailPage({ params }: PaperPageProps) {
  try {
    const detail = await fetchPaperDetail(params.paperId);
    return <PaperDetailView detail={detail} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
