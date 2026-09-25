import PanchrangaLoader from '@/components/PanchrangaLoader';

export default function HubLoading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center py-24 px-4">
      <PanchrangaLoader loading={true} size="md" />
    </div>
  );
}
