import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, CreditCard, Shield, Gift, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    paypal?: any;
  }
}

const Donate: React.FC = () => {
  const [amount, setAmount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const paypalButtonRef = useRef<any>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializePayPalButton = async () => {
      if (!window.paypal || !buttonContainerRef.current) return;

      // Clear previous button if it exists
      if (buttonContainerRef.current) {
        buttonContainerRef.current.innerHTML = '';
      }

      setIsLoading(true);

      try {
        const PayPalButton = window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 55
          },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: amount.toString(),
                  currency_code: 'USD'
                },
                description: 'Donation to ChatSafari'
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const order = await actions.order.capture();
              toast.success('Thank you for your donation! Your support helps us keep ChatSafari free and secure.');
              console.log('Payment completed', order);
            } catch (error) {
              console.error('Payment error:', error);
              toast.error('Payment failed. Please try again or contact support if the issue persists.');
            }
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            toast.error('Payment failed. Please try again or contact support if the issue persists.');
          },
          onCancel: () => {
            toast.success('Donation cancelled. Feel free to try again anytime!', {
              icon: 'ℹ️',
              style: {
                background: '#e3f2fd',
                color: '#1976d2'
              }
            });
          }
        });

        if (PayPalButton.isEligible()) {
          await PayPalButton.render('#paypal-button-container');
          paypalButtonRef.current = PayPalButton;
        }
      } catch (error) {
        console.error('Error rendering PayPal button:', error);
        toast.error('Failed to load payment system. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    initializePayPalButton();

    // Cleanup function
    return () => {
      if (paypalButtonRef.current) {
        paypalButtonRef.current.close();
      }
    };
  }, [amount]);

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
  };

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Brand */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center text-violet-600 hover:text-violet-700 transition duration-150 ease-in-out">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </div>

            {/* Center section - Brand */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl font-bold text-violet-600" style={{ fontFamily: 'Pacifico, cursive' }}>
                ChatSafari
              </h1>
            </div>

            {/* Right section - Empty for balance */}
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Support ChatSafari</h1>
            <p className="text-xl text-gray-600">Help us keep the platform free and improve our services</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Heart className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Keep It Free</h3>
              <p className="text-gray-600">Help us maintain a free platform for everyone to connect.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Shield className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Security</h3>
              <p className="text-gray-600">Support our efforts to improve platform security and user protection.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Gift className="h-12 w-12 text-violet-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">New Features</h3>
              <p className="text-gray-600">Help us develop new features and improve user experience.</p>
            </div>
          </div>

          {/* Donation Section */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Make a Donation</h2>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Donation Amount</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[5, 10, 20, 50].map((buttonAmount) => (
                    <button
                      key={buttonAmount}
                      className={`p-4 border rounded-lg transition duration-150 ease-in-out ${
                        amount === buttonAmount
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-500 hover:bg-violet-50'
                      }`}
                      onClick={() => handleAmountSelect(buttonAmount)}
                    >
                      <span className="text-lg font-semibold text-gray-900">${buttonAmount}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={handleCustomAmount}
                    placeholder="Custom amount"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-600">Secure payment via PayPal</span>
                </div>
                <div 
                  id="paypal-button-container" 
                  ref={buttonContainerRef}
                  className="min-h-[50px] flex items-center justify-center"
                >
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading payment system...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Is my donation secure?</h3>
                <p className="text-gray-600">Yes, all donations are processed securely through PayPal's payment system.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Can I donate anonymously?</h3>
                <p className="text-gray-600">Yes, you can choose to make your donation anonymous during the PayPal checkout process.</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">How will my donation be used?</h3>
                <p className="text-gray-600">Your donation helps us maintain and improve the platform, enhance security, and develop new features.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate; 