import { LinkButton } from '@/shared/components/link-button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <h1 className="font-heading text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found.</p>
        <LinkButton href="/">Go home</LinkButton>
      </div>
    </div>
  );
}
