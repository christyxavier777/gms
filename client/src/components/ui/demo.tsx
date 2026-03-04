import HalideTopoHero from "./halide-topo-hero"
import logo from "@/assets/The_fitness_garage_logo.jpg"
import image1 from "@/assets/TFG_img1.jpg"
import image2 from "@/assets/TFG_img2.jpg"
import image3 from "@/assets/TFG_img3.jpg"
import image4 from "@/assets/TFG_img4.jpg"
import { ArrowRight, ChartColumn, ClipboardList, CreditCard, ShieldCheck, Users, UserCog } from "lucide-react"
import { Link } from "react-router-dom"

const featureCards = [
  {
    icon: Users,
    title: "Member Management",
    text: "Manage members, attendance, profile details, and activity status from one clear workspace.",
  },
  {
    icon: ClipboardList,
    title: "Workout & Diet Plans",
    text: "Create, assign, and monitor personalized workout and diet plans with trainer-level control.",
  },
  {
    icon: CreditCard,
    title: "Subscription Plans & Billing",
    text: "Handle plan tiers, renewals, and payment records through a structured billing flow.",
  },
  {
    icon: ChartColumn,
    title: "Progress Tracking",
    text: "Track body metrics, workout history, and milestone progression for each member.",
  },
]

const roleCards = [
  {
    title: "Admin / Owner",
    route: "/admin",
    text: "Oversee members, trainers, plans, subscriptions, and system-level operations.",
  },
  {
    title: "Trainer",
    route: "/trainer",
    text: "Manage sessions, update assigned plans, and monitor client-level progress records.",
  },
  {
    title: "Gym Member",
    route: "/member",
    text: "View your workouts, diet plan, membership details, and progress dashboard.",
  },
]

const reasons = [
  "Secure role-based access for admin, trainer, and member workflows",
  "Organized structure for daily gym operations and decision-making",
  "Scalable design for local gym growth and multi-role coordination",
  "Fast and intuitive interface focused on practical usability",
]

const quickStats = [
  { value: "412+", label: "Active Members" },
  { value: "16", label: "Coaches & Trainers" },
  { value: "84%", label: "Renewal Rate" },
  { value: "1,824", label: "Weekly Check-ins" },
]

const communityHighlights = [
  "Built for the local fitness community in Neermarga, Mangalore",
  "Designed for admin, trainer, and member collaboration",
  "Professional fitness operations without unnecessary complexity",
]

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <HalideTopoHero
        title="THE FITNESS GARAGE"
        subtitle="strength / conditioning / discipline"
        primaryCtaLabel="ENTER THE GARAGE"
        primaryCtaHref="/login"
        secondaryCtaLabel="REGISTER"
        secondaryCtaHref="/register"
        logoSrc={logo}
        dumbbellImageSrc={image2}
        heroImageSrc={image1}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 lg:grid-cols-3">
        <article className="landing-rise border border-[#2f2f2f] bg-[#111111] p-6 lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">About The Gym</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em]">thefitnessgarage, Neermarga</h2>
          <p className="mt-4 text-sm leading-6 text-gray-300">
            thefitnessgarage is a local physical gym in Neermarga, Mangalore, supported by a dedicated Gym Management System web application. The platform helps admins, trainers, and gym members coordinate memberships, plans, subscriptions, billing, and progress tracking in one streamlined workflow.
          </p>
          <p className="mt-4 text-sm leading-6 text-gray-300">
            Mission: enable consistent, disciplined, and measurable fitness outcomes through structured gym operations.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {quickStats.map((item) => (
              <div key={item.label} className="border border-[#2f2f2f] bg-[#171717] p-3">
                <p className="text-2xl font-black text-[#E21A2C]">{item.value}</p>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="border border-[#2f2f2f] bg-[#141414] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#E21A2C]">Operating Focus</p>
              <p className="mt-2 text-sm text-gray-300">Member retention, trainer productivity, and measurable progress with clean process control.</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#141414] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#E21A2C]">Local Presence</p>
              <p className="mt-2 text-sm text-gray-300">Built for Neermarga, Mangalore gym workflows and the day-to-day rhythm of real coaching floors.</p>
            </div>
          </div>
        </article>
        <article className="landing-rise grid gap-3" style={{ animationDelay: "120ms" }}>
          <div className="relative overflow-hidden border border-[#2f2f2f] bg-[#0f0f0f]">
            <img src={image3} alt="Training floor at thefitnessgarage" className="h-40 w-full object-cover transition duration-500 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <p className="absolute bottom-2 left-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white">Main Floor</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative overflow-hidden border border-[#2f2f2f] bg-[#0f0f0f]">
              <img src={image2} alt="Functional training space" className="h-32 w-full object-cover transition duration-500 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <p className="absolute bottom-2 left-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white">Conditioning</p>
            </div>
            <div className="relative overflow-hidden border border-[#2f2f2f] bg-[#0f0f0f]">
              <img src={image4} alt="Strength zone view" className="h-32 w-full object-cover transition duration-500 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <p className="absolute bottom-2 left-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white">Strength Bay</p>
            </div>
          </div>
          <div className="border border-[#2f2f2f] bg-[#111111] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#E21A2C]">Facility Story</p>
            <p className="mt-2 text-sm text-gray-300">A practical local gym setup connected to a structured digital system, so operations and outcomes stay aligned.</p>
          </div>
        </article>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">System Features</p>
        <h2 className="mt-2 text-4xl font-black uppercase tracking-[0.08em]">Gym Management In One Place</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {featureCards.map((item, index) => {
            const Icon = item.icon
            return (
              <article
                key={item.title}
                className="landing-card-fade border border-[#2f2f2f] bg-[#111111] p-6 transition-colors hover:border-[#E21A2C]/60"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Icon className="h-6 w-6 text-[#E21A2C]" />
                <h3 className="mt-4 text-xl font-black uppercase tracking-[0.08em] text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-300">{item.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="relative border-y border-[#E21A2C]/30 bg-[#0f0f0f] py-16">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_25%,rgba(226,26,44,0.35),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(226,26,44,0.2),transparent_34%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">User Roles</p>
          <h2 className="mt-2 text-4xl font-black uppercase tracking-[0.08em]">Admin, Trainer, Member</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {roleCards.map((item, index) => (
              <Link
                key={item.title}
                to={item.route}
                className="landing-card-fade border border-[#2f2f2f] bg-[#111111] p-6 transition-all hover:-translate-y-1 hover:border-[#E21A2C]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <UserCog className="h-5 w-5 text-[#E21A2C]" />
                <h3 className="mt-3 text-xl font-black uppercase tracking-[0.08em] text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-6 text-gray-300">{item.text}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#E21A2C]">
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 lg:grid-cols-2">
        <article className="landing-rise border border-[#2f2f2f] bg-[#111111] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">Why Choose Us</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.08em]">Secure, Organized, Scalable</h2>
          <div className="mt-6 space-y-3">
            {reasons.map((reason) => (
              <div key={reason} className="flex gap-3 border border-[#2f2f2f] bg-[#171717] p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E21A2C]" />
                <p className="text-sm text-gray-300">{reason}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="landing-rise relative overflow-hidden border border-[#2f2f2f] bg-[#0f0f0f]" style={{ animationDelay: "120ms" }}>
          <img src={image3} alt="Gym community training session" className="h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">Social Proof / Community</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-white">Fitness Community First</h3>
            <div className="mt-4 space-y-2">
              {communityHighlights.map((item) => (
                <p key={item} className="text-sm text-gray-300">{item}</p>
              ))}
            </div>
            <a
              href="https://instagram.com/_thefitnessgarage"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center border border-[#E21A2C] bg-[#111111] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#E21A2C]"
            >
              Instagram: @_thefitnessgarage
            </a>
          </div>
        </article>
      </section>

      <section className="relative border-y border-[#E21A2C]/40 bg-[#111111]">
        <img src={image4} alt="Gym operations control" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">Call To Action</p>
            <p className="mt-2 text-3xl font-black uppercase tracking-[0.08em]">Get Started With Your Fitness Journey</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Enroll now and unlock structured training with smart gym operations.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="border border-[#E21A2C] bg-[#E21A2C] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">
              ENROLL NOW
            </Link>
            <Link to="/login" className="border border-[#E21A2C] bg-[#1A1A1A] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">
              ENTER THE GARAGE
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E21A2C]/25 bg-[#0f0f0f]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">thefitnessgarage</p>
            <p className="mt-3 text-sm text-gray-300">Gym management web application for reliable and disciplined fitness operations.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">Location & Contact</p>
            <p className="mt-3 text-sm text-gray-300">Neermarga, Mangalore</p>
            <p className="mt-1 text-sm text-gray-300">+91 98765 43210</p>
            <p className="mt-1 text-sm text-gray-300">hello@thefitnessgarage.in</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E21A2C]">Quick Links</p>
            <div className="mt-3 space-y-2">
              <a href="https://instagram.com/_thefitnessgarage" target="_blank" rel="noreferrer" className="block text-sm font-semibold uppercase tracking-[0.08em] text-gray-300 transition-colors hover:text-white">
                Instagram
              </a>
              <Link to="/login" className="block text-sm font-semibold uppercase tracking-[0.08em] text-gray-300 transition-colors hover:text-white">
                Login
              </Link>
              <Link to="/register" className="block text-sm font-semibold uppercase tracking-[0.08em] text-gray-300 transition-colors hover:text-white">
                Register
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#2f2f2f] py-4 text-center text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
          Copyright {new Date().getFullYear()} thefitnessgarage. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
