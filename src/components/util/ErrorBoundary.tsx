import * as React from 'react';

type Props = { fallback?: React.ReactNode; children: React.ReactNode };

export class ErrorBoundary extends React.Component<Props, { hasError: boolean }> {
  constructor(props: Props) { 
    super(props); 
    this.state = { hasError: false }; 
  }
  
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  
  componentDidCatch(err: any) { 
    console.error('[ErrorBoundary]', err); 
  }
  
  render() { 
    return this.state.hasError 
      ? (this.props.fallback ?? <div className="p-6 text-sm text-red-600">Something went wrong.</div>) 
      : this.props.children; 
  }
}
