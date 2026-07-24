"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ShowcaseMode = "hero" | "modal" | "compact";

const prizeSlides = [
  {
    title: "Win Real Prizes",
    subtitle: "7 x iPhone 17 Pro Max · 7 x AirPods Pro · Puzzle Credits",
    detail: "Enter the New Year draw and unlock the BMW X-7 mega draw.",
    badge: "Lucky Grand Giveaway",
    imageSrc: "/giveaway/generated/lucky-grand-giveaway-showcase-v2.png",
    imageClassName: "object-cover object-center",
    metric: "98",
    metricLabel: "prizes",
    isFeature: true,
  },
  {
    title: "iPhone 17 Pro Max",
    subtitle: "7 flagship phone prizes",
    detail: "Enter before August 31 for the strongest Wave 1 ticket boost.",
    badge: "Grand prize",
    imageSrc: "/giveaway/generated/iphone-17-pro-max-prize.png",
    imageClassName: "object-cover object-center",
    metric: "7",
    metricLabel: "winners",
  },
  {
    title: "AirPods Pro",
    subtitle: "7 premium audio prizes",
    detail: "A bright audio prize drop for New Year winners.",
    badge: "Audio prize",
    imageSrc: "/giveaway/generated/airpods-prize.png",
    imageClassName: "object-cover object-center",
    metric: "7",
    metricLabel: "winners",
  },
  {
    title: "$100 Puzzle Credit",
    subtitle: "7 marketplace credit prizes",
    detail: "Use credit toward puzzle pieces and collection building.",
    badge: "Puzzle credit",
    imageSrc: "/giveaway/generated/puzzle-credit-100.png",
    imageClassName: "object-cover object-center",
    metric: "$100",
    metricLabel: "credit",
  },
  {
    title: "$10 Puzzle Credit",
    subtitle: "7 extra credit prizes",
    detail: "More ways to keep collecting after the draw.",
    badge: "Puzzle credit",
    imageSrc: "/giveaway/generated/puzzle-credit-10.png",
    imageClassName: "object-cover object-center",
    metric: "$10",
    metricLabel: "credit",
  },
  {
    title: "$1 Puzzle Credit",
    subtitle: "70 bonus credit prizes",
    detail: "Small wins spread across more collectors.",
    badge: "Bonus prizes",
    imageSrc: "/giveaway/generated/puzzle-credit-1-bonus.png",
    imageClassName: "object-cover object-center",
    metric: "70",
    metricLabel: "winners",
  },
  {
    title: "BMW X-7 Mega Draw",
    subtitle: "One high-attention final prize",
    detail: "Wave 1 entry includes the 07.07.2027 mega draw automatically.",
    badge: "Mega draw",
    imageSrc: "/giveaway/generated/lucky-grand-giveaway-showcase-v2.png",
    imageClassName: "object-cover object-center",
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
    }, mode === "modal" ? 2500 : 2800);

    return () => window.clearInterval(timer);
  }, [mode]);

  return (
    <div className={`giveaway-showcase ${mode} ${className}`}>
      <div className="spark-field" />
      <div className="light-rig" />
      <div className="showcase-track">
        {prizeSlides.map((slide, index) => (
          <article
            key={slide.title}
            className={`showcase-slide ${slide.isFeature ? "feature-slide" : ""} ${
              slide.isMega ? "mega-slide" : ""
            } ${
              activeIndex === index ? "is-active" : ""
            }`}
            aria-hidden={activeIndex !== index}
          >
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
            <div className="speed-lines" />
            {slide.isMega ? <div className="headlight-flash" /> : null}
            {slide.isFeature ? (
              <>
                <div className="promo-header">
                  <span>Puzzle Market</span>
                  <strong>Lucky Grand Giveaway</strong>
                </div>
                <div className="prize-strip" aria-hidden="true">
                  <span>7 x iPhone 17 Pro Max</span>
                  <span>7 x AirPods Pro</span>
                  <span>Puzzle Credits</span>
                  <span>BMW X-7</span>
                </div>
              </>
            ) : null}
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

        .spark-field,
        .light-rig {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 3;
        }

        .spark-field {
          opacity: 0.72;
          background:
            radial-gradient(circle at 14% 22%, rgba(255, 255, 255, 0.7) 0 1px, transparent 2px),
            radial-gradient(circle at 73% 16%, rgba(125, 211, 252, 0.62) 0 1px, transparent 2px),
            radial-gradient(circle at 86% 60%, rgba(251, 191, 36, 0.72) 0 1px, transparent 2px),
            radial-gradient(circle at 38% 82%, rgba(255, 255, 255, 0.52) 0 1px, transparent 2px);
          animation: sparkDrift 7.8s linear infinite;
        }

        .light-rig {
          background:
            linear-gradient(105deg, transparent 0 34%, rgba(255, 255, 255, 0.18) 42%, transparent 50% 100%),
            linear-gradient(82deg, transparent 0 58%, rgba(34, 211, 238, 0.16) 64%, transparent 72% 100%);
          mix-blend-mode: screen;
          opacity: 0;
          animation: spotlightSweep 4.8s ease-in-out infinite;
        }

        .showcase-track,
        .showcase-slide {
          position: absolute;
          inset: 0;
        }

        .showcase-slide {
          opacity: 0;
          visibility: hidden;
          transform: scale(1.035);
          transition:
            opacity 260ms ease,
            transform 460ms cubic-bezier(0.22, 1, 0.36, 1),
            visibility 0s linear 460ms;
          will-change: opacity, transform;
        }

        .showcase-slide.is-active {
          opacity: 1;
          visibility: visible;
          transform: scale(1);
          transition-delay: 0s;
        }

        .slide-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 68% 42%, transparent 0 34%, rgba(0, 0, 0, 0.24) 58%, rgba(0, 0, 0, 0.68) 100%),
            linear-gradient(90deg, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.18) 38%, rgba(0, 0, 0, 0.08) 68%, rgba(0, 0, 0, 0.45)),
            linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08) 46%, rgba(0, 0, 0, 0.82));
        }

        .speed-lines {
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(103deg, transparent 0 42px, rgba(125, 211, 252, 0.16) 43px 44px, transparent 45px 92px);
          mix-blend-mode: screen;
          opacity: 0;
          transform: translateX(-16%);
        }

        .showcase-slide.is-active .speed-lines {
          animation: lineRush 1250ms ease-out;
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
          animation: headlightPulse 920ms ease-in-out infinite alternate;
        }

        .promo-header {
          position: absolute;
          left: 16px;
          top: 34px;
          z-index: 4;
          display: grid;
          max-width: min(44%, 360px);
          gap: 6px;
          border-left: 3px solid rgb(34, 211, 238);
          padding-left: 12px;
          text-transform: uppercase;
          filter: drop-shadow(0 0 18px rgba(34, 211, 238, 0.34));
        }

        .promo-header span {
          color: rgb(186, 230, 253);
          font-size: 11px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0;
        }

        .promo-header strong {
          color: white;
          font-size: clamp(16px, 2.2vw, 28px);
          font-weight: 900;
          line-height: 0.92;
          letter-spacing: 0;
          text-shadow:
            0 0 14px rgba(34, 211, 238, 0.5),
            0 0 28px rgba(251, 191, 36, 0.26);
        }

        .prize-strip {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 158px;
          z-index: 4;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .prize-strip span {
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(34, 211, 238, 0.32);
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(5, 5, 5, 0.72), rgba(12, 74, 110, 0.42));
          padding: 7px 10px;
          color: rgb(224, 242, 254);
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          text-align: center;
          text-overflow: ellipsis;
          white-space: nowrap;
          box-shadow:
            inset 0 0 18px rgba(34, 211, 238, 0.08),
            0 0 20px rgba(34, 211, 238, 0.12);
        }

        .slide-copy {
          position: absolute;
          inset: auto 14px 14px;
          z-index: 4;
          display: flex;
          min-height: 112px;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          border: 1px solid rgba(251, 191, 36, 0.28);
          border-radius: 20px;
          background:
            radial-gradient(circle at 88% 50%, rgba(251, 191, 36, 0.16), transparent 26%),
            linear-gradient(135deg, rgba(0, 0, 0, 0.86), rgba(25, 18, 5, 0.8) 50%, rgba(4, 26, 30, 0.78));
          padding: 14px;
          backdrop-filter: blur(6px);
          box-shadow:
            0 -16px 44px rgba(0, 0, 0, 0.38),
            0 0 42px rgba(251, 191, 36, 0.12);
        }

        .feature-slide .slide-copy {
          left: 16px;
          right: auto;
          width: min(56%, 620px);
          min-height: 126px;
          align-items: center;
          bottom: 16px;
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
          font-size: clamp(32px, 4.8vw, 64px);
          text-transform: uppercase;
          text-shadow:
            0 2px 0 rgba(0, 0, 0, 0.32),
            0 0 28px rgba(34, 211, 238, 0.28);
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
          top: 14px;
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

        .compact .promo-header,
        .compact .prize-strip {
          display: none;
        }

        .compact .feature-slide .slide-copy {
          width: calc(100% - 24px);
          min-height: 86px;
          bottom: 12px;
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

        @keyframes sparkDrift {
          to {
            transform: translate3d(-18px, 12px, 0);
          }
        }

        @keyframes spotlightSweep {
          0%,
          18% {
            opacity: 0;
            transform: translateX(-34%);
          }
          38% {
            opacity: 0.9;
          }
          68%,
          100% {
            opacity: 0;
            transform: translateX(42%);
          }
        }

        @keyframes lineRush {
          0% {
            opacity: 0;
            transform: translateX(-22%);
          }
          35% {
            opacity: 0.7;
          }
          100% {
            opacity: 0;
            transform: translateX(22%);
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

          .promo-header {
            left: 12px;
            top: 24px;
            max-width: calc(100% - 24px);
          }

          .promo-header strong {
            font-size: 16px;
          }

          .prize-strip {
            left: 10px;
            right: 10px;
            bottom: 118px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
          }

          .prize-strip span {
            padding: 6px 7px;
            font-size: 9px;
          }

          .feature-slide .slide-copy {
            left: 10px;
            right: 10px;
            width: auto;
            min-height: 108px;
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
          .spark-field,
          .light-rig,
          .showcase-slide,
          .speed-lines,
          .headlight-flash {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
