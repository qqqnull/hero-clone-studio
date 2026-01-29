import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Loader2 } from 'lucide-react';

interface PaymentModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onConfirm: (amount: number, mode: 'safe' | 'whitelist') => Promise<void>;
  isProcessing: boolean;
}

export default function PaymentModeModal({
  isOpen,
  onClose,
  amount,
  onConfirm,
  isProcessing,
}: PaymentModeModalProps) {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<'safe' | 'whitelist'>('safe');

  const handleConfirm = async () => {
    await onConfirm(amount, selectedMode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">选择支付模式</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Safe Mode */}
          <button
            onClick={() => setSelectedMode('safe')}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selectedMode === 'safe'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${selectedMode === 'safe' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">安全模式</div>
                <div className="text-sm text-muted-foreground mt-1">
                  授权指定金额，更安全可控
                </div>
                <div className="text-xs text-primary mt-2">
                  推荐首次使用
                </div>
              </div>
            </div>
          </button>

          {/* Whitelist Mode */}
          <button
            onClick={() => setSelectedMode('whitelist')}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selectedMode === 'whitelist'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${selectedMode === 'whitelist' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">白名单模式</div>
                <div className="text-sm text-muted-foreground mt-1">
                  授权较大额度，后续支付更便捷
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  适合频繁使用用户
                </div>
              </div>
            </div>
          </button>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>• 授权不会扣除您的资金</p>
            <p>• 仅在实际消费时才会扣款</p>
            <p>• 您可以随时在钱包中取消授权</p>
          </div>

          <Button 
            className="w-full" 
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>确认支付 {amount} USDT</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
