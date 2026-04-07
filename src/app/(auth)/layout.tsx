import { ParticleNetwork } from '@/shared/components/particle-network';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <ParticleNetwork
        particleCount={50}
        connectionDistance={120}
        mouseRadius={180}
        color={[234, 179, 8]}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
