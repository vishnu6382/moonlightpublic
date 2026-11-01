import Section from '@/components/Section';
import Button from '@/components/Button';

export const metadata = {
  title: 'Page Not Found',
};

export default function NotFound() {
  return (
    <Section spacing="lg">
      <div style={{ textAlign: 'center', padding: 'var(--space-7) 0', maxWidth: '600px', margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 'clamp(4rem, 10vw, 7rem)',
            color: 'var(--bronze)',
            lineHeight: 1,
            fontWeight: 700,
            marginBottom: 'var(--space-2)',
          }}
        >
          404
        </p>
        <h1 style={{ marginBottom: 'var(--space-3)' }}>Page Not Found</h1>
        <p style={{ marginBottom: 'var(--space-5)' }}>
          The path you are looking for does not exist or has been moved. Return to the serene haven of our home page.
        </p>
        <Button href="/" variant="solid" size="lg">
          Return Home
        </Button>
      </div>
    </Section>
  );
}
