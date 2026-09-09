"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How do I join a tournament as a player?",
    answer: "Create an account, complete your player profile, and browse the tournaments section. When you find a tournament that fits your category, submit your application or request to join directly from the tournament page.",
  },
  {
    question: "How can scouts discover new talent?",
    answer: "Scouts can search player profiles by position, location, age, and skill level. Enable notifications for new player matches and send direct messages to start recruitment conversations.",
  },
  {
    question: "Can I manage multiple teams or positions?",
    answer: "Yes. Add and update your teams and preferred positions in your profile settings, so your availability and showcase videos stay current for scouts and tournament organizers.",
  },
  {
    question: "How do I purchase merch from the platform?",
    answer: "Visit the merch store page, choose the items you want, and complete checkout with your preferred payment method. Order status and shipment updates are available through your account dashboard.",
  },
  {
    question: "What tools are available for evaluating player performance?",
    answer: "Use the built-in stats, highlight reels, and coach reviews to compare players. Scouts can bookmark promising talent and rate prospects to build shortlists efficiently.",
  },
  {
    question: "How do I get notified about upcoming tryouts and events?",
    answer: "Enable push and email notifications in your account settings. We'll notify you when new tournaments, tryouts, or open scouting events are posted that match your preferences.",
  },
  {
    question: "Is there support for uploading game footage?",
    answer: "Yes. Players can upload match clips and training highlights to their profile, and scouts can review video directly from the player page to assess skills and decision-making.",
  },
  {
    question: "How can I contact support if I need help?",
    answer: "Use the Help center or contact form from your account menu. Our support team is available to help with account setup, tournament registration, merchandise orders, and scout invitations.",
  },
];

function FaqItem({ faq, index, openIndex, toggleFAQ }) {
  const isOpen = openIndex === index;
  return (
    <div
      className={`flex flex-col rounded-xl border outline outline-transparent transition-all duration-300 ${
        isOpen
          ? "bg-[#D4AF6A]/10 text-white border-[#D4AF6A]/30 shadow-md outline-[#D4AF6A]/10"
          : "bg-[#1C1928] text-white border-white/10 shadow-sm hover:border-[#D4AF6A]/30"
      }`}
    >
      <button
        type="button"
        onClick={() => toggleFAQ(index)}
        className="flex w-full items-center justify-between px-4 sm:px-6 py-4 sm:py-5 text-left focus:outline-none cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className={`font-medium pr-3 sm:pr-4 text-sm sm:text-base ${isOpen ? "text-[#D4AF6A]" : "text-white"}`}>
          {faq.question}
        </span>
        <span className={`ml-2 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          <svg
            className={`h-4 w-4 sm:h-5 sm:w-5 ${isOpen ? "text-[#D4AF6A]" : "text-white/60"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden px-4 sm:px-6 transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-40 pb-4 sm:pb-5 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-xs sm:text-sm leading-relaxed text-white/80">{faq.answer}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const half = Math.ceil(faqs.length / 2);
  const leftFaqs = faqs.slice(0, half);
  const rightFaqs = faqs.slice(half);

  return (
    <section className="bg-[#1C1928] py-12 md:py-16 lg:py-20 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mx-auto max-w-3xl mb-8 md:mb-12 lg:mb-14">
          <h2 className="mt-2 md:mt-4 text-base md:text-lg text-[#D4AF6A] font-semibold">FAQ</h2>
          <p className="mt-2 md:mt-4 text-white text-2xl md:text-3xl lg:text-4xl font-bold">
            Questions? Look here.
          </p>
        </div>

        {/* Two independent flex columns - tablet responsive */}
        <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:gap-6">
          {/* Left column */}
          <div className="flex flex-1 flex-col gap-3 md:gap-4">
            {leftFaqs.map((faq, idx) => (
              <FaqItem
                key={idx}
                faq={faq}
                index={idx}
                openIndex={openIndex}
                toggleFAQ={toggleFAQ}
              />
            ))}
          </div>

          {/* Right column */}
          <div className="flex flex-1 flex-col gap-3 md:gap-4">
            {rightFaqs.map((faq, idx) => (
              <FaqItem
                key={idx + half}
                faq={faq}
                index={idx + half}
                openIndex={openIndex}
                toggleFAQ={toggleFAQ}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}