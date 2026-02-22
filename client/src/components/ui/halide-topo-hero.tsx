import { Link } from "react-router-dom"
import { Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"

type HalideTopoHeroProps = {
  className?: string
  title?: string
  subtitle?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
  logoSrc: string
  dumbbellImageSrc: string
  heroImageSrc: string
}

export default function HalideTopoHero({
  className,
  title = "THE FITNESS GARAGE",
  subtitle = "strength / conditioning / discipline",
  primaryCtaLabel = "ENTER THE GARAGE",
  primaryCtaHref = "/login",
  secondaryCtaLabel = "REGISTER",
  secondaryCtaHref = "/register",
  logoSrc,
  dumbbellImageSrc,
  heroImageSrc,
}: HalideTopoHeroProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-y border-[#E21A2C]/40 bg-[#0f0f0f] text-white",
        className,
      )}
    >
      <div className="absolute inset-0">
        <img
          src={heroImageSrc}
          alt="The Fitness Garage training floor"
          className="h-full w-full object-cover opacity-20 grayscale"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] [background-size:38px_38px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g stroke="#E21A2C" strokeWidth="1">
            <path d="M0 140C120 90 240 210 360 160C480 110 600 230 720 190C840 150 960 260 1080 220C1140 200 1170 180 1200 170" />
            <path d="M0 240C130 180 250 290 370 260C490 230 610 320 730 300C850 280 970 360 1090 340C1150 330 1180 320 1200 310" />
            <path d="M0 340C120 300 240 390 360 360C480 330 600 420 720 390C840 360 960 440 1080 420C1140 410 1170 400 1200 390" />
            <path d="M0 440C120 390 240 500 360 460C480 420 600 530 720 500C840 470 960 560 1080 540C1140 530 1170 520 1200 510" />
            <path d="M0 540C120 490 240 590 360 560C480 530 600 620 720 590C840 560 960 650 1080 630C1140 620 1170 610 1200 600" />
            <path d="M0 640C120 600 240 690 360 660C480 630 600 720 720 700C840 680 960 740 1080 730C1140 725 1170 720 1200 715" />
          </g>
        </svg>
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-7xl items-center px-6 py-20">
        <div className="max-w-3xl space-y-8">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="The Fitness Garage logo" className="h-14 w-14 border border-[#E21A2C]/50 object-cover" />
            <p className="inline-flex border border-[#E21A2C]/70 bg-[#1A1A1A] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#E21A2C]">
              The Fitness Garage
            </p>
          </div>
          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[0.08em] text-white sm:text-6xl md:text-7xl">
            {title}
          </h1>
          <p className="max-w-2xl border-l-4 border-[#E21A2C] pl-4 text-base font-semibold uppercase tracking-[0.12em] text-gray-300 sm:text-lg">
            {subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={primaryCtaHref}
              className="inline-flex items-center border border-[#E21A2C] bg-[#E21A2C] px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#b91524]"
            >
              {primaryCtaLabel} <span className="ml-2">&rarr;</span>
            </Link>
            <Link
              to={secondaryCtaHref}
              className="inline-flex items-center border border-[#E21A2C] bg-[#1A1A1A] px-6 py-3 text-sm font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#242424]"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
          <div className="inline-flex items-center gap-3 border border-[#2b2b2b] bg-[#131313] px-4 py-3">
            <Dumbbell className="h-5 w-5 text-[#E21A2C]" />
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-300">
              Power. Precision. Progress.
            </span>
          </div>
        </div>
        <div className="ml-auto hidden lg:block">
          <div className="border border-[#2f2f2f] bg-[#111111] p-2">
            <img src={dumbbellImageSrc} alt="Dumbbell equipment" className="h-[420px] w-[300px] object-cover grayscale" />
          </div>
        </div>
      </div>
    </section>
  )
}
