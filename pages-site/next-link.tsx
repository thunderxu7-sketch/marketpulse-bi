import type { AnchorHTMLAttributes, ReactNode } from 'react';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children?: ReactNode;
};

export default function Link({ href, children, ...props }: LinkProps) {
  const target = href.startsWith('/') ? `#${href}` : href;
  return <a href={target} {...props}>{children}</a>;
}
