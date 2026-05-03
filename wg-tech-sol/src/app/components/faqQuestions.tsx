'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { FAQItem } from '@/app/home/types';

interface FaqSectionProps {
    faqs?: FAQItem[];
}

// Fallback data agar API se data na aaye
const defaultFaqData = [
    {
        id: 1,
        question: 'What services does WGTECSOL (Pvt.) Ltd. provide?',
        answer:
            'WGTECSOL (Pvt.) Ltd. offers a range of services including design, engineering, and project management. We specialize in user experience design, web development, mobile app development, custom software development, branding and identity, and more.',
    },
    {
        id: 2,
        question: 'How can WGTECSOL (Pvt.) Ltd. help my business?',
        answer: 'We work with clients to craft tailored digital solutions that solve problems and create value.',
    },
    {
        id: 3,
        question: 'What industries does WGTECSOL (Pvt.) Ltd. work with?',
        answer: 'We have worked with clients across healthcare, fintech, retail, logistics, and more.',
    },
    {
        id: 4,
        question: 'How long does it take to complete a project with WGTECSOL (Pvt.) Ltd.?',
        answer: 'Project duration varies based on complexity, typically ranging from a few weeks to several months.',
    },
    {
        id: 5,
        question: 'Do you offer ongoing support and maintenance after the project is completed?',
        answer: 'Yes, we provide post-launch support, performance monitoring, and regular updates.',
    },
    {
        id: 6,
        question: 'Can you work with existing design or development frameworks?',
        answer: 'Absolutely! We can integrate or extend your existing stack.',
    },
    {
        id: 7,
        question: 'How involved will I be in the project development process?',
        answer: 'Very involved — we believe in collaboration, regular feedback, and transparency.',
    },
    {
        id: 8,
        question: 'Can you help with website or app maintenance and updates?',
        answer: 'Yes, we offer ongoing maintenance packages for all digital products.',
    },
];

const FaqSection = ({ faqs }: FaqSectionProps) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    // API se aaye data ko format karna ya fallback data use karna
    const faqData = faqs && faqs.length > 0
        ? faqs.map((faq, index) => ({
            id: index + 1,
            question: faq.title?.trim() || '',
            answer: faq.body?.trim() || '',
        })).filter(item => item.question && item.answer) // Filter out empty items
        : defaultFaqData;

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const midIndex = Math.ceil(faqData.length / 2);
    const column1 = faqData.slice(0, midIndex);
    const column2 = faqData.slice(midIndex);

    return (
        <section className="bg-black py-16">
            <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 px-4 sm:px-6 md:px-10">
                {[column1, column2].map((column, colIndex) => (
                    <div key={colIndex} className={`flex flex-col space-y-6 ${colIndex === 1 ? 'md:pl-10 md:border-l md:border-gray-950' : ''
                        }`}>
                        {column.map((item, index) => {
                            const globalIndex = colIndex === 0 ? index : index + column1.length;
                            return (
                                <div
                                    key={item.id}
                                    className="border-b border-gray-950 pb-6"
                                >
                                    <div
                                        className="flex items-start justify-between cursor-pointer group"
                                        onClick={() => toggleFAQ(globalIndex)}
                                    >
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="bg-[#2f2f2f] rounded-md w-10 h-10 flex items-center justify-center font-bold group-hover:text-[#9eff00] text-white flex-shrink-0">
                                                {globalIndex + 1 < 10 ? `0${globalIndex + 1}` : globalIndex + 1}
                                            </div>
                                            <div className="text-left font-semibold group-hover:text-[#9eff00] text-white flex-1">
                                                {item.question}
                                            </div>
                                        </div>
                                        <div className="ml-4 mt-1 flex-shrink-0">
                                            {openIndex === globalIndex ? (
                                                <ChevronUpIcon className="w-5 h-5 text-[#9eff00]" />
                                            ) : (
                                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                    {openIndex === globalIndex && (
                                        <div className="pl-14 mt-3 text-sm text-gray-300 leading-relaxed">
                                            {item.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FaqSection;
