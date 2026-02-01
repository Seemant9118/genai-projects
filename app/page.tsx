"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ProjectType = {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  slug: string;
  projectPath: string;
};

const projects: ProjectType[] = [
  {
    id: "1",
    title: "AI Chatbot",
    description:
      "Built an LLM-powered chatbot with streaming responses, token optimization, JSON/English output formats, and features like regenerate, abort request, and multi-purpose QnA support.",
    image: "/projects/ai-chatbot.png",
    date: "01 Feb 2026",
    slug: "ai-chatbot-clone",
    projectPath: `/chat`,
  },
];

export default function Home(): React.ReactElement {
  const router = useRouter();

  const handleCardClick = (projectPath: string) => {
    toast.success("Opening project...");
    router.push(projectPath);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Gen AI Projects
        </h1>

        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          A collection of the GenAI apps I’ve built ✨
        </p>

        {/* Responsive Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleCardClick(project.projectPath)}
              title={`Open ${project.title}`}
              className="group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg active:scale-[0.98]"
            >
              {/* Responsive Image */}
              <div className="relative h-44 w-full sm:h-48 lg:h-52">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain transition duration-300 group-hover:scale-105"
                  priority
                />
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-xs text-gray-500 sm:text-sm">
                  {project.date}
                </p>

                <h2 className="mt-1 text-base font-semibold text-gray-900 sm:text-lg">
                  {project.title}
                </h2>

                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
