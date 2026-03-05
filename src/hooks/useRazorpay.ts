import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Extend Window object to include Razorpay
declare global {
    interface Window {
        Razorpay: any;
    }
}

export const useRazorpay = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const initializePayment = useCallback(async (projectId: string) => {
        try {
            setIsProcessing(true);

            // 1. Load the Razorpay SDK
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                throw new Error("Razorpay SDK failed to load. Are you online?");
            }

            // 2. Call Edge Function to create order
            const { data: orderData, error: orderError } = await supabase.functions.invoke(
                "create-razorpay-order",
                {
                    body: { projectId },
                }
            );

            if (orderError) {
                console.error("Order creation error:", orderError);
                throw new Error("Failed to initialize payment order.");
            }

            if (!orderData?.order_id) {
                throw new Error("No order ID returned from the server.");
            }

            // 3. Initialize Razorpay Checkout
            const options = {
                key: orderData.key_id, // Enter the Key ID generated from the Dashboard
                amount: orderData.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                currency: orderData.currency,
                name: "Your Project Tracking",
                description: `Payment for Project: ${projectId}`,
                // image: "https://your_logo.com", // Optional: Add your logo URL here
                order_id: orderData.order_id, // This is the order_id created in the backend
                handler: async function (response: any) {
                    // 4. Handle success callback and verify signature
                    try {
                        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
                            "verify-razorpay-payment",
                            {
                                body: {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                },
                            }
                        );

                        if (verifyError || !verifyData?.success) {
                            console.error("Payment verification failed:", verifyError || verifyData);
                            toast.error("Payment verification failed. Please contact support.");
                        } else {
                            toast.success("Payment successful!");
                            // You can trigger a UI refresh or reload here if needed
                        }
                    } catch (error) {
                        console.error("Error during payment verification:", error);
                        toast.error("An error occurred while verifying the payment.");
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    // Optional: Prefill user details if available
                    // name: "User Name",
                    // email: "user@example.com",
                    // contact: "9999999999"
                },
                theme: {
                    color: "#000000",
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        toast.info("Payment cancelled.");
                    },
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.on("payment.failed", function (response: any) {
                console.error("Payment failed:", response.error);
                toast.error(`Payment failed: ${response.error.description}`);
                setIsProcessing(false);
            });

            paymentObject.open();

        } catch (error: any) {
            console.error("Payment Initialization Error:", error);
            toast.error(error.message || "Something went wrong while initializing payment.");
            setIsProcessing(false);
        }
    }, []);

    return { initializePayment, isProcessing };
};
