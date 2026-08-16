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
        answer: "Enable push and email notifications in your account settings. We’ll notify you when new tournaments, tryouts, or open scouting events are posted that match your preferences.",
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

function FaqItem({
    faq,
    index,
    openIndex,
    toggleFAQ,
}: {
    faq: { question: string; answer: string };
    index: number;
    openIndex: number | null;
    toggleFAQ: (i: number) => void;
}) {
    const isOpen = openIndex === index;
    return (
        <div
            className={`flex flex-col rounded-xl border outline outline-transparent transition-all duration-300 ${isOpen
                ? "bg-[#1C192F] text-white border-primary/30 shadow-md outline-primary/10"
                : "bg-[#fbfbfb] text-black border-tertiary/30 shadow-sm hover:border-tertiary hover:shadow-md"
                }`}
        >
            <button
                type="button"
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between px-6 py-5 text-left focus:outline-none"
                aria-expanded={isOpen}
            >
                <span className={`font-medium pr-4 ${isOpen ? "text-white" : "text-black"}`}>
                    {faq.question}
                </span>
                <span className={`ml-2 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                    <svg
                        className={`h-5 w-5 ${isOpen ? "text-black" : "text-black/70"}`}
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
                className={`overflow-hidden px-6 transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <p className="text-sm leading-relaxed text-white">{faq.answer}</p>
            </div>
        </div>
    );
}

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Split into two independent columns so expanding one doesn't affect the other
    const half = Math.ceil(faqs.length / 2);
    const leftFaqs = faqs.slice(0, half);
    const rightFaqs = faqs.slice(half);

    return (
        <section className="bg-[#fbfbfb] py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
                {/* Header */}
                <div className="text-center mx-auto max-w-3xl mb-14">
                    <h2 className="mt-4 text-lg  text-black md:text-2xl lg:text-3xl">
                        FAQ
                    </h2>
                    <p className="mt-4 text-black text-4xl font-bold md:text-4xl lg:text-5xl">
                        Questions? Look here.
                    </p>
                </div>

                {/* Two independent flex columns — expanding one won't affect the other */}
                <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
                    {/* Left column */}
                    <div className="flex flex-1 flex-col gap-4">
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
                    <div className="flex flex-1 flex-col gap-4">
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