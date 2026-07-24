"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ShowcaseMode = "hero" | "modal" | "compact";

const prizeSlides = [
  {
    title: "Real Prize Pool",
    subtitle: "7 x iPhone 17 Pro Max / 7 x AirPods Pro",
    detail: "84 puzzle credits + BMW X-7 mega draw entry.",
    badge: "Lucky Grand Giveaway",
    imageSrc: "/giveaway/generated/grand-giveaway-all-prizes-v3.png",
    imageClassName: "object-contain object-center",
    metric: "98",
    metricLabel: "prizes",
    isAllPrizes: true,
    isFeature: true,
  },
  {
    title: "iPhone 17 Pro Max",
    subtitle: "7 flagship phone prizes",
    detail: "Enter before August 31 for the strongest Wave 1 ticket boost.",
    badge: "Grand prize",
    imageSrc: "/giveaway/generated/iphone-17-pro-max-prize.png",
    imageClassName: "object-contain object-center",
    metric: "7",
    metricLabel: "winners",
  },
  {
    title: "AirPods Pro",
    subtitle: "7 premium audio prizes",
    detail: "A bright audio prize drop for New Year winners.",
    badge: "Audio prize",
    imageSrc: "/giveaway/generated/airpods-prize.png",
    imageClassName: "object-contain object-center",
    metric: "7",
    metricLabel: "winners",
  },
  {
    title: "$100 Puzzle Credit",
    subtitle: "7 marketplace credit prizes",
    detail: "Use credit toward puzzle pieces and collection building.",
    badge: "Puzzle credit",
    imageSrc: "/giveaway/generated/puzzle-credit-100.png",
    imageClassName: "object-contain object-center",
    metric: "$100",
    metricLabel: "credit",
  },
  {
    title: "$10 Puzzle Credit",
    subtitle: "7 extra credit prizes",
    detail: "More ways to keep collecting after the draw.",
    badge: "Puzzle credit",
    imageSrc: "/giveaway/generated/puzzle-credit-10.png",
    imageClassName: "object-contain object-center",
    metric: "$10",
    metricLabel: "credit",
  },
  {
    title: "$1 Puzzle Credit",
    subtitle: "70 bonus credit prizes",
    detail: "Small wins spread across more collectors.",
    badge: "Bonus prizes",
    imageSrc: "/giveaway/generated/puzzle-credit-1-bonus.png",
    imageClassName: "object-contain object-center",
    metric: "70",
    metricLabel: "winners",
  },
  {
    title: "BMW X-7 Mega Draw",
    subtitle: "Draw takes place on 27.07.2027.",
    detail: "1 winner. Wave 1 entry unlocks the mega draw automatically.",
    badge: "Mega draw",
    imageSrc: "/giveaway/generated/bmw-x7-mega-draw-only-v3.png",
    imageClassName: "object-contain object-center",
    metric: "1",
    metricLabel: "winner",
    isMega: true,
    isFeature: true,
  },
];

export default function GiveawayPrizeShowcase({
  mode = "hero",
  className = "",
}: {
  mode?: ShowcaseMode;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % prizeSlides.length);
    }, mode === "modal" ? 3600 : 4200);

    return () => window.clearInterval(timer);
  }, [mode]);

  return (
    <div className={`giveaway-showcase ${mode} ${className}`}>
      <div className="showcase-track">
        {prizeSlides.map((slide, index) => (
          <article
            key={slide.title}
            className={`showcase-slide ${slide.isFeature ? "feature-slide" : ""} ${
              slide.isAllPrizes ? "all-prizes-slide" : ""
            } ${
              slide.isMega ? "mega-slide" : ""
            } ${
              activeIndex === index ? "is-active" : ""
            }`}
            aria-hidden={activeIndex !== index}
          >
            <div className="slide-media">
              <Image
                src={slide.imageSrc}
                alt={`${slide.title} giveaway prize`}
                fill
                sizes={
                  mode === "modal"
                    ? "(min-width: 640px) 896px, 100vw"
                    : "(min-width: 1024px) 44vw, 100vw"
                }
                className={slide.imageClassName}
                priority={index === 0}
              />
              <div className="slide-vignette" />
              {slide.isMega ? <div className="headlight-flash" /> : null}
            </div>
            <div className="slide-copy">
              <div className="copy-main">
                <p className="slide-badge">{slide.badge}</p>
                <h2>{slide.title}</h2>
                <p>{slide.subtitle}</p>
                {mode !== "compact" ? <span>{slide.detail}</span> : null}
              </div>
              <div className="slide-metric">
                <strong>{slide.metric}</strong>
                <span>{slide.metricLabel}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="progress-dots" aria-hidden="true">
        {prizeSlides.map((slide, index) => (
          <span
            key={slide.title}
            className={activeIndex === index ? "is-active" : ""}
          />
        ))}
      </div>

      <style jsx>{`
        .giveaway-showcase {
          position: relative;
          height: 100%;
          min-height: 100%;
          overflow: hidden;
          border-radius: inherit;
          background:
            radial-gradient(circle at 78% 18%, rgba(251, 191, 36, 0.28), transparent 27%),
            radial-gradient(circle at 25% 76%, rgba(34, 211, 238, 0.18), transparent 34%),
            #030303;
          isolation: isolate;
        }

        .giveaway-showcase.hero {
          min-height: 390px;
        }

        .giveaway-showcase.compact {
          min-height: 250px;
        }

        .giveaway-showcase.modal {
          aspect-ratio: 16 / 9;
        }

        .showcase-track {
          position: absolute;
          inset: 16px 0 0;
        }

        .showcase-slide {
          position: absolute;
          inset: 0;
        }

        .showcase-slide {
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          opacity: 0;
          visibility: hidden;
          overflow: hidden;
          transform: scale(1.012);
          background: #050505;
          transition:
            opacity 420ms ease,
            transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
            visibility 0s linear 900ms;
          will-change: opacity, transform;
        }

        .showcase-slide.is-active {
          opacity: 1;
          visibility: visible;
          transform: scale(1);
          transition-delay: 0s;
        }

        .slide-media {
          position: relative;
          min-height: 0;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 48%, rgba(34, 211, 238, 0.08), transparent 38%),
            linear-gradient(180deg, #061014, #030303);
        }

        .showcase-slide.is-active .slide-media {
          animation: mediaBreath 4200ms ease-in-out both;
        }

        .slide-vignette {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.14), transparent 24%, transparent 78%, rgba(0, 0, 0, 0.1)),
            linear-gradient(180deg, rgba(0, 0, 0, 0.02), transparent 76%, rgba(0, 0, 0, 0.08));
        }

        .mega-slide .slide-vignette {
          background:
            linear-gradient(90deg, rgba(0, 0, 0, 0.12), transparent 28%, transparent 80%, rgba(0, 0, 0, 0.1)),
            linear-gradient(180deg, transparent, transparent 80%, rgba(0, 0, 0, 0.08));
        }

        .headlight-flash {
          position: absolute;
          inset: 0;
          z-index: 2;
          background:
            radial-gradient(circle at 47% 58%, rgba(255, 255, 255, 0.82), transparent 9%),
            radial-gradient(circle at 62% 58%, rgba(125, 211, 252, 0.66), transparent 12%),
            linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          mix-blend-mode: screen;
          animation: headlightPulse 1.8s ease-in-out infinite alternate;
        }

        .slide-copy {
          position: relative;
          z-index: 4;
          display: flex;
          min-height: 106px;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-top: 1px solid rgba(251, 191, 36, 0.26);
          background:
            radial-gradient(circle at 88% 50%, rgba(251, 191, 36, 0.16), transparent 26%),
            linear-gradient(135deg, rgba(0, 0, 0, 0.94), rgba(15, 13, 8, 0.92) 50%, rgba(3, 18, 22, 0.92));
          padding: 12px 14px;
          box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.04);
        }

        .copy-main {
          min-width: 0;
        }

        .slide-badge {
          display: inline-flex;
          max-width: 100%;
          border: 1px solid rgba(252, 211, 77, 0.38);
          border-radius: 999px;
          background: rgba(252, 211, 77, 0.12);
          padding: 5px 9px;
          color: rgb(254, 243, 199);
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        h2 {
          margin-top: 8px;
          color: white;
          font-size: clamp(24px, 4.2vw, 48px);
          font-weight: 900;
          line-height: 0.96;
          letter-spacing: 0;
        }

        .feature-slide h2 {
          font-size: clamp(24px, 3.2vw, 40px);
          text-transform: uppercase;
          text-shadow:
            0 2px 0 rgba(0, 0, 0, 0.32),
            0 0 28px rgba(34, 211, 238, 0.28);
        }

        .all-prizes-slide h2 {
          font-size: clamp(24px, 3vw, 38px);
          line-height: 0.94;
        }

        .all-prizes-slide .copy-main p:not(.slide-badge) {
          font-size: 12px;
          line-height: 1.18;
        }

        .all-prizes-slide .copy-main span {
          font-size: 10px;
          line-height: 1.15;
        }

        .all-prizes-slide .slide-metric strong {
          font-size: clamp(42px, 5vw, 56px);
        }

        .copy-main p:not(.slide-badge) {
          margin-top: 6px;
          color: rgb(226, 232, 240);
          font-size: 14px;
          font-weight: 800;
          line-height: 1.25;
        }

        .copy-main span,
        .slide-metric span {
          display: block;
          margin-top: 5px;
          color: rgb(165, 243, 252);
          font-size: 11px;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .slide-metric {
          flex: 0 0 auto;
          text-align: right;
        }

        .slide-metric strong {
          display: block;
          color: rgb(253, 230, 138);
          font-size: clamp(38px, 7vw, 70px);
          font-weight: 900;
          line-height: 0.86;
        }

        .feature-slide .slide-metric strong {
          color: rgb(254, 240, 138);
          text-shadow:
            0 0 18px rgba(251, 191, 36, 0.42),
            0 0 38px rgba(34, 211, 238, 0.2);
        }

        .progress-dots {
          position: absolute;
          left: 16px;
          right: 16px;
          top: 6px;
          z-index: 5;
          display: flex;
          gap: 6px;
        }

        .progress-dots span {
          height: 4px;
          flex: 1;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.22);
          overflow: hidden;
        }

        .progress-dots span.is-active {
          background: linear-gradient(90deg, rgb(252, 211, 77), rgb(34, 211, 238));
          box-shadow: 0 0 16px rgba(251, 191, 36, 0.4);
        }

        .modal .slide-copy,
        .compact .slide-copy {
          min-height: 92px;
          border-radius: 18px;
          padding: 12px;
        }

        .modal h2,
        .compact h2 {
          font-size: clamp(22px, 4vw, 34px);
        }

        .modal .copy-main span,
        .compact .copy-main span {
          display: none;
        }

        .compact .feature-slide .slide-copy {
          min-height: 84px;
        }

        .compact .feature-slide h2 {
          font-size: clamp(24px, 5vw, 32px);
        }

        .compact .copy-main p:not(.slide-badge) {
          font-size: 12px;
          line-height: 1.2;
        }

        .compact .slide-metric strong {
          font-size: 42px;
        }

        @keyframes mediaBreath {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.018);
          }
        }

        @keyframes headlightPulse {
          from {
            opacity: 0.18;
          }
          to {
            opacity: 0.78;
          }
        }

        @media (max-width: 640px) {
          .giveaway-showcase.hero {
            min-height: 330px;
          }

          .slide-copy {
            inset: auto 10px 10px;
            min-height: 102px;
            align-items: flex-end;
            gap: 10px;
            border-radius: 18px;
            padding: 12px;
          }

          .feature-slide .slide-copy {
            min-height: 96px;
          }

          h2 {
            font-size: 24px;
          }

          .feature-slide h2 {
            font-size: 30px;
          }

          .copy-main p:not(.slide-badge) {
            font-size: 12px;
          }

          .copy-main span {
            display: none;
          }

          .slide-metric strong {
            font-size: 34px;
          }

          .slide-metric span {
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .showcase-slide,
          .slide-media,
          .headlight-flash {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
