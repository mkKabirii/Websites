import React from 'react'
import Banner from '../components/banner'
import { banner } from '../components/bannerData'
import Into from './into';
import Current_Openings from './current_Openings';
import SquareUpHero from '../about/squareUpHero';

const sections = [
    {
        heading: "Build your career with WGTECSOL",
        description: "Join a team focused on real client impact, modern engineering practices, and continuous growth. We work on challenging digital products where your ideas can directly shape outcomes.",
        boxText: "Why Work at WGTECSOL (Pvt.) Ltd.?",
    },
    {
        heading: "Current Openings",
        description: "Explore active roles across engineering, product, and design teams. Select a position that matches your strengths and apply directly through our application form.",
    }
];

const features = [
    {
        title: "Meaningful Client Projects",
        desc: "Ship production-grade solutions for businesses across industries, with ownership from planning to delivery."
    },
    {
        title: "Supportive Team Culture",
        desc: "Collaborate with experienced teammates in a respectful environment that values communication and accountability."
    },
    {
        title: "Continuous Learning",
        desc: "Grow through mentorship, code reviews, and practical problem-solving on modern stacks and workflows."
    },
    {
        title: "Ownership and Impact",
        desc: "Take responsibility for features end-to-end and see your work create measurable value for customers."
    }
];






function Page() {
    return (
        <>
            <Banner
                bgImage={banner[4].bgImage}
                heading={banner[4].heading}
                headingTwo={banner[4].headingTwo}
                subheading={banner[4].subheading}
            />
            <Into section={sections[0]} />
            <div className="h-auto my-10 flex items-center justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full items-stretch">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            data-aos="fade-up"
                            data-aos-anchor-placement="top-center"
                            className="px-6 flex h-full flex-col gap-2 "
                        >
                            <h2 className="text-2xl sm:text-3xl md:text-[40px] text-[#D8FF99] break-words">
                                {feature.title}
                            </h2>
                            <hr className="border-[#262626] my-4" />
                            <p className="text-[#98989A] break-words">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            <Into section={sections[1]} />
            <Current_Openings />
            <SquareUpHero />
        </>
    )
}

export default Page