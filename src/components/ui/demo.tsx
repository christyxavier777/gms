import HalideTopoHero from "./halide-topo-hero"
import logo from "@/assets/The_fitness_garage_logo.jpg"
import dumbbell from "@/assets/TFG-dumbbell.jpg"
import image1 from "@/assets/TFG_img1.jpg"
import image2 from "@/assets/TFG_img2.jpg"
import image3 from "@/assets/TFG_img3.jpg"
import image4 from "@/assets/TFG_img4.jpg"
import { ShieldCheck, Users, UserCog } from "lucide-react"
import { Link } from "react-router-dom"

const galleryImages = [image1, image2, image3, image4]

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
        dumbbellImageSrc={dumbbell}
        heroImageSrc={image1}
      />

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <h2 className="mb-8 text-3xl font-black uppercase tracking-[0.08em]">Platform Features</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <article className="border border-[#2f2f2f] bg-[#111111] p-6">
            <Users className="mb-4 h-6 w-6 text-[#E21A2C]" />
            <h3 className="text-xl font-bold uppercase tracking-[0.08em]">Member Management</h3>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.06em] text-gray-300">
              Organize profiles, membership data, and progress records with clear operational control.
            </p>
          </article>
          <article className="border border-[#2f2f2f] bg-[#111111] p-6">
            <UserCog className="mb-4 h-6 w-6 text-[#E21A2C]" />
            <h3 className="text-xl font-bold uppercase tracking-[0.08em]">Trainer Control</h3>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.06em] text-gray-300">
              Coordinate trainer workflows and maintain disciplined service standards at scale.
            </p>
          </article>
          <article className="border border-[#2f2f2f] bg-[#111111] p-6">
            <ShieldCheck className="mb-4 h-6 w-6 text-[#E21A2C]" />
            <h3 className="text-xl font-bold uppercase tracking-[0.08em]">Secure Role-Based Access</h3>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.06em] text-gray-300">
              Enforce strict access boundaries between admins, trainers, and members.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-14">
        <h2 className="mb-8 text-3xl font-black uppercase tracking-[0.08em]">System Credibility</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-[#2f2f2f] bg-[#111111] p-5">
              <p className="text-3xl font-black text-[#E21A2C]">Role Locked</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Operational boundaries by design.</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#111111] p-5">
              <p className="text-3xl font-black text-[#E21A2C]">Dashboard Ready</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Admin, trainer, and member views in place.</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#111111] p-5">
              <p className="text-3xl font-black text-[#E21A2C]">Workflow Focused</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Built for daily gym operations.</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#111111] p-5">
              <p className="text-3xl font-black text-[#E21A2C]">Tailwind Driven</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Consistent interface primitives.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {galleryImages.map((image, index) => (
              <div key={image} className="relative overflow-hidden border border-[#2f2f2f] bg-[#111111]">
                <img src={image} alt={`The Fitness Garage facility view ${index + 1}`} className="h-44 w-full object-cover grayscale" />
                <div className="absolute inset-0 bg-[#E21A2C]/15" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E21A2C]/40 bg-[#111111]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-3xl font-black uppercase tracking-[0.08em]">Command Your Gym Floor</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">The system behind strong, disciplined operations.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="border border-[#E21A2C] bg-[#E21A2C] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">
              ENTER THE GARAGE
            </Link>
            <Link to="/register" className="border border-[#E21A2C] bg-[#1A1A1A] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white">
              REGISTER
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
