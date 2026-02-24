"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Mail, Phone } from "lucide-react";
import MobileLayout from "@/components/layout/MobileLayout";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "1",
    question: "How do I add a pet to my profile?",
    answer:
      "Go to the Pets section and click the '+' button to add a new pet. Fill in the pet details including name, species, breed, and upload photos.",
  },
  {
    id: "2",
    question: "How do I book a pet service?",
    answer:
      "Visit the Services section, browse available services, select your pet, choose a date and time, and proceed to book.",
  },
  {
    id: "3",
    question: "Can I cancel my order?",
    answer:
      "You can cancel orders within 24 hours of booking. Go to My Orders and click the cancel button on your order.",
  },
  {
    id: "4",
    question: "How do I track my adoption applications?",
    answer:
      "Visit the Adoption section to see all your adoption applications and their status.",
  },
];

export default function HelpSupportPage() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Help & Support</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Contact Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Contact Us</h2>
            <div className="space-y-3">
              {/* Chat Support */}
              <button className="w-full bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-teal-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800">Chat Support</p>
                  <p className="text-xs text-gray-500">Available 9 AM - 6 PM</p>
                </div>
              </button>

              {/* Email Support */}
              <button className="w-full bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800">Email Support</p>
                  <p className="text-xs text-gray-500">
                    support@purrfectcare.com
                  </p>
                </div>
              </button>

              {/* Phone Support */}
              <button className="w-full bg-white rounded-lg p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800">Phone Support</p>
                  <p className="text-xs text-gray-500">+1 (555) 123-4567</p>
                </div>
              </button>
            </div>
          </div>

          {/* FAQs Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id.toString())}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-semibold text-gray-800">
                      {faq.question}
                    </p>
                    <span
                      className={`text-teal-500 font-bold transition-transform ${
                        expandedFAQ === faq.id.toString() ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {expandedFAQ === faq.id.toString() && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
