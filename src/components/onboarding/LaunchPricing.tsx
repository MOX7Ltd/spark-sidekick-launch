import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check } from 'lucide-react';
import { logFrontendEvent } from '@/lib/frontendEventLogger';

interface LaunchPricingProps {
  onBack?: () => void;
}

export default function LaunchPricing({ onBack }: LaunchPricingProps) {
  const navigate = useNavigate();

  useEffect(() => {
    logFrontendEvent({
      eventType: 'step_transition',
      step: 'pricing',
      payload: { action: 'view_pricing' },
    });
  }, []);

  const handleCreateHub = () => {
    navigate('/auth/signup');
  };

  const features = [
    {
      title: 'Product Lab',
      description: 'Create and manage digital products, courses, and services',
    },
    {
      title: 'Campaign Lab',
      description: 'Design AI-powered marketing campaigns and social content',
    },
    {
      title: 'Customer Inbox',
      description: 'Manage customer communications and inquiries in one place',
    },
    {
      title: 'Shopfront Manager',
      description: 'Build and customize your online storefront with ease',
    },
  ];

  const faqs = [
    {
      question: 'Is it really free to start?',
      answer: 'Yes! You can create your Hub and start using all the basic features for free. Upgrade anytime as your business grows.',
    },
    {
      question: 'What happens after I create my account?',
      answer: 'Your onboarding work will be automatically transferred to your new Hub. You\'ll have access to all four Hub areas immediately.',
    },
    {
      question: 'Can I upgrade later?',
      answer: 'Absolutely! Start free and upgrade when you need more features, higher limits, or premium support.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards and offer flexible billing options for paid plans.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="p-4 sm:p-6">
        {onBack && (
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        )}
      </header>

      <main className="flex-1 px-4 pb-32 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8 space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Launch Your Hub
            </h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to run your business in one place
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border bg-card space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Desktop CTA */}
          <div className="hidden sm:block pt-8">
            <Button
              onClick={handleCreateHub}
              variant="hero"
              size="lg"
              className="w-full h-14 text-lg"
            >
              Create my Hub (free account)
            </Button>
          </div>
        </div>
      </main>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 sm:hidden">
        <Button
          onClick={handleCreateHub}
          variant="hero"
          size="lg"
          className="w-full h-12"
        >
          Create my Hub (free account)
        </Button>
      </div>
    </div>
  );
}
