export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-primary py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs text-text-tertiary font-mono">
          &copy; {new Date().getFullYear()} Insan Arafat Jahan. Built with Next.js.
        </p>
      </div>
    </footer>
  );
}
