import { useState, useMemo } from 'react';
import {
  Star,
  Calendar,
  Mail,
  Copy,
  Check,
  Sparkles,
  Send,
  Edit3,
  User,
  ExternalLink
} from 'lucide-react';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';
import { useReputation } from '../../context/ReputationContext';
import { Loader2 } from 'lucide-react';

const SOURCE_COLORS: Record<string, string> = {
  'Booking.com': '#003580',
  'Google': '#4285F4',
  'Expedia': '#FFCC00',
  'Tripadvisor': '#34E0A1',
  'Agoda': '#5C2D91'
};

const getSentimentStyle = (sentiment: number) => {
  if (sentiment >= 70) return { bg: 'bg-sage-100', text: 'text-sage-700', label: 'Positive' };
  if (sentiment >= 40) return { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Neutral' };
  return { bg: 'bg-gold-100', text: 'text-gold-700', label: 'Negative' };
};

const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < fullStars
            ? 'text-gold-500 fill-gold-500'
            : i === fullStars && hasHalf
              ? 'text-gold-500 fill-gold-500/50'
              : 'text-neutral-300'
            }`}
        />
      ))}
    </div>
  );
};

interface Review {
  id: string;
  guest: string;
  email?: string;
  source: string;
  rating: number;
  sentiment: number;
  date: string;
  title: string;
  review: string;
  keywords?: string[];
  responded?: boolean;
  responseText?: string;
}

interface GuestCRMData {
  totalStays: number;
  ltv: number;
  segment: string;
}

interface ReviewDetailDrawerProps {
  review: Review | null;
  onClose: () => void;
  onRespond?: (reviewId: string, responseText: string) => void;
  guestCRMData?: GuestCRMData;
}

export default function ReviewDetailDrawer({
  review,
  onClose,
  onRespond,
  guestCRMData
}: ReviewDetailDrawerProps) {
  const { generateDraft } = useReputation();
  const [responseText, setResponseText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState<string>('');

  // Clear state when review changes
  useMemo(() => {
    setAiDraft('');
    setIsGenerating(false);
    setIsEditing(false);
    setResponseText('');
  }, [review?.id]);

  if (!review) return null;

  const sentimentStyle = getSentimentStyle(review.sentiment);
  const sourceColor = SOURCE_COLORS[review.source] || '#A57865';

  const handleGenerateAI = async () => {
    if (!review) return;
    setIsGenerating(true);
    try {
      const draft = await generateDraft(parseInt(review.id));
      setAiDraft(draft.draft_text);
      setResponseText(draft.draft_text);
      setIsEditing(true);
    } catch (error) {
      console.error("Failed to generate draft:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseSuggested = () => {
    setResponseText(aiDraft);
    setIsEditing(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (responseText.trim() && onRespond) {
      onRespond(review.id, responseText);
      onClose();
    }
  };

  const header = (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-[10px] bg-terra-500 flex items-center justify-center text-white text-lg font-bold">
        {review.guest?.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2) || 'G'}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">{review.guest}</h2>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="px-2 py-0.5 text-[10px] font-bold text-white rounded"
            style={{ backgroundColor: sourceColor }}
          >
            {review.source}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sentimentStyle.bg} ${sentimentStyle.text}`}>
            {sentimentStyle.label}
          </span>
        </div>
        {review.email && (
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {review.email}
          </p>
        )}
      </div>
    </div>
  );

  const footer = !review.responded ? (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSend}
        disabled={!responseText.trim()}
      >
        Send Response
      </Button>
    </div>
  ) : (
    <div className="flex items-center justify-end w-full">
      <Button variant="ghost" onClick={onClose}>
        Close
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={!!review}
      onClose={onClose}
      header={header}
      maxWidth="max-w-xl"
      footer={footer}
      title=""
      subtitle=""
      className=""
    >
      <div className="space-y-5">
        {/* Rating & Sentiment */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-[10px]">
            <div className="w-9 h-9 rounded-[8px] bg-gold-100 flex items-center justify-center">
              <Star className="w-4 h-4 text-gold-600" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-500">Rating</p>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} />
                <span className="text-[13px] font-semibold text-neutral-900">{review.rating}/5</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-[10px]">
            <div className="w-9 h-9 rounded-[8px] bg-terra-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-terra-600" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-500">Sentiment</p>
              <p className="text-[13px] font-semibold text-neutral-900">{review.sentiment}/100</p>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-[13px] text-neutral-500">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(review.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>

        {/* Review Title */}
        <div>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Review Title</p>
          <p className="text-[16px] font-medium text-neutral-900">"{review.title}"</p>
        </div>

        {/* Full Review */}
        <div>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Full Review</p>
          <div className="bg-neutral-50 rounded-[10px] p-4">
            <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {review.review}
            </p>
          </div>
        </div>

        {/* Keywords */}
        {review.keywords && review.keywords.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">Detected Keywords</p>
            <div className="flex flex-wrap gap-2">
              {review.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-ocean-100 text-ocean-700 text-[11px] font-medium rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CRM Guest Profile */}
        {guestCRMData && (
          <div className="bg-sage-50 rounded-[10px] p-4 border border-sage-100">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-sage-700" />
              <p className="text-[13px] font-semibold text-sage-800">CRM Guest Profile</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-neutral-500">Total Stays</p>
                <p className="text-[18px] font-bold text-neutral-900">{guestCRMData.totalStays || 0}</p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">LTV</p>
                <p className="text-[18px] font-bold text-sage-700">${(guestCRMData.ltv || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">Segment</p>
                <p className="text-[13px] font-semibold text-neutral-900">{guestCRMData.segment || 'N/A'}</p>
              </div>
            </div>
            <button className="mt-3 flex items-center gap-1 text-[11px] font-medium text-sage-700 hover:underline">
              View Full Profile
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Existing Response */}
        {review.responded && review.responseText && (
          <div>
            <p className="text-[11px] font-semibold text-sage-700 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Your Response
            </p>
            <div className="bg-sage-50 rounded-[10px] p-4 border border-sage-100">
              <p className="text-[13px] text-neutral-700 whitespace-pre-wrap">
                {review.responseText}
              </p>
            </div>
          </div>
        )}

        {/* AI Response Generator */}
        {!review.responded && (
          <div>
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-terra-600" />
              AI Suggested Response
            </p>

            {/* AI Response Section */}
            {!aiDraft && !isGenerating && (
              <Button
                variant="secondary"
                onClick={handleGenerateAI}
                className="w-full justify-center py-8 border-dashed border-2 bg-terra-50 hover:bg-terra-100 border-terra-200"
              >
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="w-5 h-5 text-terra-600" />
                  <span className="text-terra-700 font-medium">Generate AI Response</span>
                </div>
              </Button>
            )}

            {isGenerating && (
              <div className="w-full py-8 border-2 border-dashed border-neutral-200 rounded-[10px] flex flex-col items-center justify-center gap-3 bg-neutral-50">
                <Loader2 className="w-6 h-6 text-terra-500 animate-spin" />
                <p className="text-[13px] text-neutral-500 font-medium">Crafting response...</p>
              </div>
            )}

            {aiDraft && (
              <div className="bg-terra-50 rounded-[10px] p-4 border border-terra-100 mb-3 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[13px] text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {aiDraft}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={copied ? Check : Copy}
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    icon={Edit3}
                    onClick={handleUseSuggested}
                  >
                    Use & Edit
                  </Button>
                </div>
              </div>
            )}

            {isEditing && (
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2 block">
                  Edit Response
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-[10px] text-[13px] focus:outline-none focus:ring-2 focus:ring-terra-500/20 focus:border-terra-500 resize-none"
                  placeholder="Edit your response..."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
