import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MarketingChatPanelProps {
  onGenerate: (prompt: string, platforms: string[]) => void;
  isGenerating: boolean;
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'facebook', label: 'Facebook', icon: '👥' },
  { id: 'twitter', label: 'Twitter', icon: '🐦' },
];

export const MarketingChatPanel = ({ onGenerate, isGenerating }: MarketingChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Let's create something your audience will love! Tell me what you'd like to promote."
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'linkedin']);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    // Simple AI response for demo
    const aiResponse: Message = {
      role: 'assistant',
      content: "Great! I'll create some engaging posts for your selected platforms. Click 'Generate Posts' when you're ready!"
    };
    setMessages(prev => [...prev, aiResponse]);
    setInput('');
  };

  const handleGenerate = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage && selectedPlatforms.length > 0) {
      onGenerate(lastUserMessage.content, selectedPlatforms);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Chat messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Platform selector */}
        <div className="p-4 border-t">
          <p className="text-sm font-medium mb-2">Select Platforms</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {PLATFORMS.map((platform) => (
              <Badge
                key={platform.id}
                variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => togglePlatform(platform.id)}
              >
                <span className="mr-1">{platform.icon}</span>
                {platform.label}
              </Badge>
            ))}
          </div>

          {/* Input area */}
          <div className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., I'm launching a new digital planner next week..."
              className="resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
              <Button
                variant="hero"
                onClick={handleGenerate}
                disabled={isGenerating || messages.filter(m => m.role === 'user').length === 0}
                className="gap-2 ml-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Posts
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
