"use client";

import Image from "next/image";
import Link from "next/link";
import { FaLinkedinIn, FaInstagram, FaFacebookF } from "react-icons/fa";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaXTwitter } from "react-icons/fa6";
import type { TeamSection, TeamMember, SocialLink } from "./types";
import MagnifyText from "../components/MagnifyText";

const containerWidth = (count: number) => {
  if (count <= 1) return "max-w-sm";
  if (count === 2) return "max-w-3xl";
  if (count === 3) return "max-w-5xl";
  return "max-w-6xl";
};

const gridCols = (count: number) => {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
};

const initials = (str: string = "") =>
  str
    ?.trim()
    .split(" ")
    .map((p) => p[0]?.toUpperCase())
    .join("");

interface OurTeamsProps {
  ourTeamData: TeamSection[];
}

const getSocialLinks = (
  links?: SocialLink[],
): Array<SocialLink & { link: string }> =>
  (links ?? []).filter((link): link is SocialLink & { link: string } =>
    Boolean(link?.link),
  );

export default function Our_Teams({ ourTeamData }: OurTeamsProps) {
  useEffect(() => {
    AOS.init({ duration: 500, easing: "linear", offset: 50, once: true });
  }, []);

  return (
    <section className="w-full min-h-screen px-2 mt-20 sm:px-4 md:px-8">
      <h1 className="text-white text-center text-[clamp(2rem,6vw,58px)] font-semibold">
        <MagnifyText text="Our Teams" />
      </h1>

      {ourTeamData.map((section) => {
        const members: TeamMember[] = section?.members ?? [];

        return (
          <div
            key={section._id}
            className="my-12"
            data-aos="fade-down"
            data-aos-duration="1500"
          >
            {/* Section Heading */}
            <h2
              className="text-center my-10 text-3xl sm:text-3xl md:text-4xl text-[#9eff00] underline font-semibold"
              data-aos="fade-down"
              data-aos-delay="100"
            >
              {section?.role?.role}
            </h2>

            {/* Members Grid */}
            <div
              className={[
                "mx-auto mt-6 grid gap-6 md:gap-8 justify-items-center",
                containerWidth(members.length),
                gridCols(members.length),
              ].join(" ")}
            >
              {members.map((member, idx) => {
                const memberImage = member.image || "/images/Icon.png";
                const memberName = member.name || "Team member";
                const socialLinks = getSocialLinks(member.url);

                return (
                  <div
                    key={member._id || idx}
                    className="w-full h-full max-w-[280px] rounded-xl border border-[#232323] p-6 sm:p-7 flex flex-col items-center text-center bg-[#0b0b0b]/40"
                    data-aos="fade-down"
                    data-aos-delay={Math.min(idx * 120, 480)}
                  >
                    {/* Avatar with Ring */}
                    <div className="relative flex justify-center items-center h-32 w-32 sm:h-40 sm:w-40 mb-4">
                      {/* Ring Frame */}
                      <Image
                        src="/ring.png"
                        alt="Ring Frame"
                        fill
                        className="object-contain z-10 pointer-events-none"
                      />
                      {/* Inner Avatar */}
                      <div className="relative h-[72%] w-[72%] rounded-full overflow-hidden bg-[#0d0d0d] z-0">
                        <Image
                          src={memberImage}
                          alt={memberName}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />

                      </div>
                    </div>

                    {/* Name + Role */}
                    <div className="space-y-1 mb-4">
                      <h3 className="text-white font-semibold text-lg sm:text-xl">
                        {memberName}
                      </h3>
                      <p className="text-[#9EFF00] font-medium text-xs sm:text-sm uppercase tracking-wide">
                        {member.designation || section?.role?.role}
                      </p>
                      {member.department && (
                        <p className="text-[#B0B0B0] font-medium text-xs">
                          {member.department}
                        </p>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-gray-300 text-sm leading-relaxed flex-grow">
                      {member.shortDescription}
                    </p>

                    {/* 🔥 Social Icons (FIXED ROW) */}
                    {section?.role?.role === "Director & CEO" && (
                      <div className="flex items-center justify-center flex-row gap-4 mt-6">
                        {socialLinks.map((item, index) => (
                          <div key={`${item.siteName ?? "link"}-${index}`}>
                            {item.siteName === "LinkedIn" && (
                              <Link
                                href={item.link}
                                target="_blank"
                                className="inline-flex h-10 w-10 items-center justify-center hover:bg-lime-400 transition group rounded-lg bg-[#232323]"
                              >
                                <FaLinkedinIn className="h-4 w-4 text-lime-400 group-hover:text-black" />
                              </Link>
                            )}

                            {item.siteName === "Facebook" && (
                              <Link
                                href={item.link}
                                target="_blank"
                                className="inline-flex h-10 w-10 items-center justify-center hover:bg-lime-400 transition group rounded-lg bg-[#232323]"
                              >
                                <FaFacebookF className="h-4 w-4 text-lime-400 group-hover:text-black" />
                              </Link>
                            )}

                            {item.siteName === "Instagram" && (
                              <Link
                                href={item.link}
                                target="_blank"
                                className="inline-flex h-10 w-10 items-center justify-center hover:bg-lime-400 transition group rounded-lg bg-[#232323]"
                              >
                                <FaInstagram className="h-4 w-4 text-lime-400 group-hover:text-black" />
                              </Link>
                            )}
                            {item.siteName === "X" && (
                              <Link
                                href={item.link}
                                target="_blank"
                                className="inline-flex h-10 w-10 items-center justify-center hover:bg-lime-400 transition group rounded-lg bg-[#232323]"
                              >
                                <FaXTwitter className="h-4 w-4 text-lime-400 group-hover:text-black" />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* No Members */}
              {members.length === 0 && (
                <div className="col-span-full text-center text-gray-400 italic py-10">
                  Coming soon
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
